import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/api/apiClient';

import CanvasViewport from './CanvasViewport';
import CanvasToolbar from './CanvasToolbar';
import Minimap from './Minimap';
import ContextMenu from './ContextMenu';

import { useViewport } from './hooks/useViewport';
import { useSelection } from './hooks/useSelection';
import { useDrag } from './hooks/useDrag';
import { useResize } from './hooks/useResize';

import {
  DEFAULT_UNIT_WIDTH,
  DEFAULT_UNIT_HEIGHT,
  calculateNewUnitPosition,
  snapToGrid,
  screenToCanvas,
  canvasToScreen,
} from './utils/canvasUtils';

/**
 * CanvasEditor — the main orchestrating component that replaces DeterministicOrgChart.
 *
 * Fetches units + layout data, wires up viewport/selection/drag/resize hooks,
 * and renders CanvasViewport, CanvasToolbar, Minimap, and ContextMenu.
 */
export default function CanvasEditor({ versionId, onSelectUnit, isReadOnly, orgType = 'codificare', onSnapshot }) {
  const queryClient = useQueryClient();
  const containerRef = useRef(null);
  const svgRef = useRef(null);
  const clickedUnitRef = useRef(null);

  // --- Data fetching ---

  const { data: units = [] } = useQuery({
    queryKey: ['units', versionId],
    queryFn: () => apiClient.listUnits(versionId),
    enabled: !!versionId,
  });

  const [aggregatesMap, setAggregatesMap] = useState({});
  const [layoutData, setLayoutData] = useState(null);
  const [chartTitle, setChartTitle] = useState('CODIFICAREA STRUCTURILOR DIN ANEXA LA OMTI NR. 48/23.01.2026');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editableTitle, setEditableTitle] = useState(chartTitle);

  useEffect(() => {
    if (!versionId) return;
    let cancelled = false;

    const fetchLayout = async () => {
      try {
        const response = await fetch(`http://localhost:8000/api/layout/${versionId}`);
        const data = await response.json();
        if (cancelled) return;
        setLayoutData(data);

        const aggMap = {};
        if (data.layout) {
          data.layout.forEach((node) => {
            if (node.aggregates) {
              aggMap[node.unit_id] = node.aggregates;
            }
          });
        }
        setAggregatesMap(aggMap);
      } catch (error) {
        console.error('Failed to fetch layout:', error);
      }
    };

    const fetchVersion = async () => {
      try {
        const response = await fetch(`http://localhost:8000/api/versions/${versionId}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` },
        });
        const versionInfo = await response.json();
        if (cancelled) return;
        if (versionInfo.chart_title) {
          setChartTitle(versionInfo.chart_title);
          setEditableTitle(versionInfo.chart_title);
        }
      } catch (error) {
        console.error('Failed to fetch version:', error);
      }
    };

    fetchLayout();
    fetchVersion();
    return () => { cancelled = true; };
  }, [versionId]);

  // --- Identify special units ---

  const saveChartTitle = useCallback(async (newTitle) => {
    try {
      const response = await fetch(
        `http://localhost:8000/api/versions/${versionId}/chart-title?title=${encodeURIComponent(newTitle)}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
            'Content-Type': 'application/json',
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        setChartTitle(data.chart_title);
        setEditableTitle(data.chart_title);
      }
    } catch (error) {
      console.error('Failed to save chart title:', error);
      setEditableTitle(chartTitle);
    }
  }, [versionId, chartTitle]);

  const consiliu = useMemo(
    () => units.find((u) => u.unit_type === 'consiliu'),
    [units]
  );
  const directorGeneral = useMemo(
    () => units.find((u) => u.unit_type === 'director_general'),
    [units]
  );
  const legend = useMemo(
    () => units.find((u) => u.unit_type === 'legend'),
    [units]
  );

  // --- Fixed elements positions (persisted in localStorage) ---

  const [fixedElements, setFixedElements] = useState({
    legend: { x: 20, y: 20, width: 200, height: 180 },
    director: { x: 1180, y: 20, width: 200, height: 60 },
    header1: { x: 500, y: 120, width: 400, height: 20 },
    header2: { x: 500, y: 140, width: 400, height: 20 },
    consiliu: { x: 600, y: 180, width: 300, height: 60 },
    customLegend: { x: 250, y: 20, width: 200, height: 300 },
  });

  useEffect(() => {
    if (!versionId) return;
    const saved = localStorage.getItem(`fixed_elements_${versionId}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (!parsed.customLegend) {
          parsed.customLegend = { x: 450, y: 20, width: 200, height: 300 };
        }
        setFixedElements(parsed);
        return;
      } catch {
        // ignore parse errors
      }
    }
    // No saved positions for this version — try to copy from any other version
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('fixed_elements_') && key !== `fixed_elements_${versionId}`) {
        try {
          const fallback = JSON.parse(localStorage.getItem(key));
          if (fallback && fallback.consiliu) {
            if (!fallback.customLegend) {
              fallback.customLegend = { x: 450, y: 20, width: 200, height: 300 };
            }
            setFixedElements(fallback);
            localStorage.setItem(`fixed_elements_${versionId}`, JSON.stringify(fallback));
            return;
          }
        } catch { /* ignore */ }
      }
    }
  }, [versionId]);

  // --- Context menu state ---

  const [contextMenu, setContextMenu] = useState(null);

  // --- Hook integration ---

  const viewport = useViewport();
  const selection = useSelection();

  // Drag end callback — PATCH position, invalidate queries, toast on error
  const handleDragEnd = useCallback(
    async (unitId, newX, newY) => {
      try {
        await apiClient.updateUnit(unitId, {
          custom_x: Math.round(newX),
          custom_y: Math.round(newY),
        });
        queryClient.invalidateQueries({ queryKey: ['units', versionId] });
      } catch (error) {
        toast.error('Eroare la salvarea poziției: ' + error.message);
        throw error; // re-throw so useDrag can rollback
      }
    },
    [versionId, queryClient]
  );

  const drag = useDrag({
    units,
    viewport: viewport.viewport,
    isReadOnly,
    onDragEnd: handleDragEnd,
  });

  // Resize end callback — PATCH dimensions, invalidate queries, toast on error
  const handleResizeEnd = useCallback(
    async (unitId, newWidth, newHeight) => {
      try {
        await apiClient.updateUnit(unitId, {
          custom_width: Math.round(newWidth),
          custom_height: Math.round(newHeight),
        });
        queryClient.invalidateQueries({ queryKey: ['units', versionId] });
      } catch (error) {
        toast.error('Eroare la salvarea dimensiunilor: ' + error.message);
      }
    },
    [versionId, queryClient]
  );

  const resize = useResize({
    isReadOnly,
    onResizeEnd: handleResizeEnd,
  });

  // --- Build positions map ---

  const positions = useMemo(() => {
    const map = {};
    for (const unit of units) {
      const dragPos = drag.getNodePosition(unit.id);
      const size = resize.getNodeSize(unit.id, {
        width: unit.custom_width ?? DEFAULT_UNIT_WIDTH,
        height: unit.custom_height ?? DEFAULT_UNIT_HEIGHT,
      });
      map[unit.id] = {
        x: dragPos.x,
        y: dragPos.y,
        width: size.width,
        height: size.height,
      };
    }
    return map;
  }, [units, drag, resize]);

  // --- Build sizes map ---

  const sizes = useMemo(() => {
    const map = {};
    for (const unit of units) {
      map[unit.id] = resize.getNodeSize(unit.id, {
        width: unit.custom_width ?? DEFAULT_UNIT_WIDTH,
        height: unit.custom_height ?? DEFAULT_UNIT_HEIGHT,
      });
    }
    return map;
  }, [units, resize]);

  // --- Build fixedNodes array ---

  const fixedNodes = useMemo(() => {
    const nodes = [];

    // Stats legend (totals box) — always present
    nodes.push({
      type: 'stats_legend',
      unit: null,
      position: fixedElements.legend,
      units: units,
      aggregatesMap: aggregatesMap,
    });

    // Consiliu de Conducere — always present (use unit data if available)
    nodes.push({
      type: 'consiliu',
      unit: consiliu || { name: 'CONSILIUL DE CONDUCERE' },
      position: fixedElements.consiliu,
    });

    // Director General mini-legend — always present
    nodes.push({
      type: 'director_legend',
      unit: directorGeneral || { director_title: 'DIRECTOR GENERAL', director_name: '' },
      position: fixedElements.director,
    });

    // Custom Legend (3-column table) — always present
    nodes.push({
      type: 'custom_legend',
      unit: legend || {
        legend_col1: 'NUMĂR POSTURI CONDUCERE',
        legend_col2: 'TOTAL POSTURI INCLUS CONDUCERE',
        legend_col3: 'DENUMIRE STRUCTURĂ',
      },
      position: fixedElements.customLegend,
    });

    // Header nodes
    nodes.push({
      type: 'header',
      unit: { name: 'AUTORITATEA DE SIGURANȚĂ FEROVIARĂ ROMÂNĂ - ASFR' },
      position: fixedElements.header1,
    });
    // Header 2 — only for codificare, editable on click
    if (orgType !== 'omti') {
      nodes.push({
        type: 'header_editable',
        unit: { name: chartTitle },
        position: { ...fixedElements.header2, _onEditClick: () => { setIsEditingTitle(true); setEditableTitle(chartTitle); } },
      });
    }

    return nodes;
  }, [consiliu, directorGeneral, legend, fixedElements, units, aggregatesMap, chartTitle, orgType]);

  // --- Mouse event routing ---

  const handleNodeMouseDown = useCallback(
    (e, unit) => {
      if (e.button === 0) {
        drag.handlers.onNodeMouseDown(e, unit);
        clickedUnitRef.current = unit;
      }
    },
    [drag.handlers]
  );

  const handleViewportMouseDown = useCallback(
    (e) => {
      // Close context menu on any click
      setContextMenu(null);

      // Only start pan if clicking on empty area (not on a node)
      if (e.target.tagName === 'svg' || e.target.tagName === 'rect') {
        const isGridRect =
          e.target.getAttribute('fill') === 'url(#grid)' ||
          e.target.tagName === 'svg';
        if (isGridRect) {
          viewport.handlers.onMouseDown(e);
        }
      }
    },
    [viewport.handlers]
  );

  const handleViewportMouseMove = useCallback(
    (e) => {
      // Fixed element resize
      if (fixedResizeRef.current) {
        const svg = e.currentTarget;
        const svgRect = svg.getBoundingClientRect();
        const mouseX = e.clientX - svgRect.left;
        const mouseY = e.clientY - svgRect.top;
        const deltaX = (mouseX - fixedResizeRef.current.startMouseX) / viewport.viewport.zoom;
        const deltaY = (mouseY - fixedResizeRef.current.startMouseY) / viewport.viewport.zoom;
        const newWidth = snapToGrid(Math.max(100, fixedResizeRef.current.startWidth + deltaX));
        const newHeight = snapToGrid(Math.max(40, fixedResizeRef.current.startHeight + deltaY));
        setFixedElements((prev) => ({
          ...prev,
          [fixedResizeRef.current.key]: {
            ...prev[fixedResizeRef.current.key],
            width: newWidth,
            height: newHeight,
          },
        }));
        return;
      }
      // Fixed element drag
      if (fixedDragRef.current) {
        const svg = e.currentTarget;
        const svgRect = svg.getBoundingClientRect();
        const mouseX = e.clientX - svgRect.left;
        const mouseY = e.clientY - svgRect.top;
        const canvasCoords = screenToCanvas(mouseX, mouseY, viewport.viewport);
        const rawX = canvasCoords.x - fixedDragRef.current.offsetX / viewport.viewport.zoom;
        const rawY = canvasCoords.y - fixedDragRef.current.offsetY / viewport.viewport.zoom;
        const newX = snapToGrid(rawX);
        const newY = snapToGrid(rawY);
        fixedDragRef.current.moved = true;
        setFixedElements((prev) => ({
          ...prev,
          [fixedDragRef.current.key]: {
            ...prev[fixedDragRef.current.key],
            x: newX,
            y: newY,
          },
        }));
        return; // Don't pan while dragging fixed element
      }
      viewport.handlers.onMouseMove(e);
      drag.handlers.onCanvasMouseMove(e);
      resize.handlers.onMouseMove(e);
    },
    [viewport.handlers, viewport.viewport, drag.handlers, resize.handlers]
  );

  const handleViewportMouseUp = useCallback(() => {
    // Fixed element resize end
    if (fixedResizeRef.current) {
      localStorage.setItem(`fixed_elements_${versionId}`, JSON.stringify(fixedElements));
      fixedResizeRef.current = null;
      return;
    }
    // Fixed element drag end — save to localStorage
    if (fixedDragRef.current) {
      if (fixedDragRef.current.moved) {
        localStorage.setItem(`fixed_elements_${versionId}`, JSON.stringify(fixedElements));
      } else {
        // Was just a click, not a drag — handle click on fixed node
        // (click handling is done by FixedNode's onClick)
      }
      fixedDragRef.current = null;
      return;
    }

    // If we had a clicked unit but drag didn't actually move, treat as click
    if (clickedUnitRef.current && !drag.dragState.isDragging && !isReadOnly) {
      selection.select(clickedUnitRef.current.id);
      if (onSelectUnit) {
        onSelectUnit(clickedUnitRef.current);
      }
    }
    clickedUnitRef.current = null;

    viewport.handlers.onMouseUp();
    drag.handlers.onCanvasMouseUp();
    resize.handlers.onMouseUp();
  }, [
    drag.dragState.isDragging,
    drag.handlers,
    viewport.handlers,
    resize.handlers,
    selection,
    onSelectUnit,
    versionId,
    fixedElements,
  ]);

  // --- Canvas click (empty area) → deselect ---

  const handleCanvasClick = useCallback(
    (e) => {
      // Only deselect if clicking on the SVG background / grid
      if (
        e.target.tagName === 'svg' ||
        e.target.getAttribute('fill') === 'url(#grid)'
      ) {
        selection.deselect();
      }
    },
    [selection]
  );

  // --- Context menu ---

  const handleContextMenu = useCallback(
    (e, unit) => {
      e.preventDefault();
      e.stopPropagation();
      if (isReadOnly) return;
      const rect = containerRef.current?.getBoundingClientRect();
      setContextMenu({
        position: {
          x: e.clientX - (rect?.left || 0),
          y: e.clientY - (rect?.top || 0),
        },
        unit,
      });
    },
    [isReadOnly]
  );

  const handleAddChild = useCallback(async () => {
    if (!contextMenu?.unit || isReadOnly) return;
    const parent = contextMenu.unit;
    const siblings = units.filter((u) => u.parent_unit_id === parent.id);
    const pos = calculateNewUnitPosition(parent, siblings, {
      ...viewport.viewport,
      width: containerRef.current?.clientWidth || 800,
      height: containerRef.current?.clientHeight || 600,
    });

    // Inherit parent color (strip -full suffix for strip-only mode)
    let childColor = parent.color || null;
    if (childColor && childColor.endsWith('-full')) {
      childColor = childColor.replace('-full', '');
    }

    try {
      await apiClient.createUnit({
        version_id: versionId,
        name: 'Unitate nouă',
        stas_code: '',
        unit_type: 'compartiment',
        parent_unit_id: parent.id,
        custom_x: Math.round(pos.x),
        custom_y: Math.round(pos.y),
        custom_width: DEFAULT_UNIT_WIDTH,
        custom_height: DEFAULT_UNIT_HEIGHT,
        color: childColor,
      });
      queryClient.invalidateQueries({ queryKey: ['units', versionId] });
      toast.success('Unitate copil creată cu succes');
    } catch (error) {
      toast.error('Eroare la crearea unității: ' + error.message);
    }
    setContextMenu(null);
  }, [contextMenu, isReadOnly, units, viewport.viewport, versionId, queryClient]);

  const handleDeleteUnit = useCallback(async () => {
    if (!contextMenu?.unit || isReadOnly) return;
    try {
      await apiClient.deleteUnit(contextMenu.unit.id);
      queryClient.invalidateQueries({ queryKey: ['units', versionId] });
      selection.deselect();
      toast.success('Unitatea a fost ștearsă');
    } catch (error) {
      toast.error('Eroare la ștergerea unității: ' + error.message);
    }
    setContextMenu(null);
  }, [contextMenu, isReadOnly, versionId, queryClient, selection]);

  const handleRotateUnit = useCallback(async () => {
    if (!contextMenu?.unit || isReadOnly) return;
    try {
      await apiClient.updateUnit(contextMenu.unit.id, {
        is_rotated: !contextMenu.unit.is_rotated,
      });
      queryClient.invalidateQueries({ queryKey: ['units', versionId] });
    } catch (error) {
      toast.error('Eroare la rotirea unității: ' + error.message);
    }
    setContextMenu(null);
  }, [contextMenu, isReadOnly, versionId, queryClient]);

  // --- Add unit from toolbar ---

  const handleAddUnit = useCallback(() => {
    if (isReadOnly) return;
    const pos = calculateNewUnitPosition(null, [], {
      ...viewport.viewport,
      width: containerRef.current?.clientWidth || 800,
      height: containerRef.current?.clientHeight || 600,
    });
    // Open side panel with a template (no id = create mode)
    if (onSelectUnit) {
      onSelectUnit({
        _isNew: true,
        version_id: versionId,
        name: '',
        stas_code: '',
        unit_type: 'compartiment',
        parent_unit_id: null,
        custom_x: Math.round(pos.x),
        custom_y: Math.round(pos.y),
        custom_width: DEFAULT_UNIT_WIDTH,
        custom_height: DEFAULT_UNIT_HEIGHT,
      });
    }
  }, [isReadOnly, viewport.viewport, versionId, onSelectUnit]);

  // --- Fixed node handlers ---

  const fixedDragRef = useRef(null);
  const fixedResizeRef = useRef(null);

  const handleFixedNodeMouseDown = useCallback(
    (e, type) => {
      // director_legend is always draggable (even in OMTI read-only)
      if (isReadOnly && type !== 'director_legend') return;
      e.stopPropagation();

      const svg = e.currentTarget.closest('svg');
      if (!svg) return;
      const svgRect = svg.getBoundingClientRect();
      const mouseX = e.clientX - svgRect.left;
      const mouseY = e.clientY - svgRect.top;

      // Map type to fixedElements key
      const keyMap = {
        consiliu: 'consiliu',
        director_legend: 'director',
        custom_legend: 'customLegend',
        stats_legend: 'legend',
        header: 'header1',
        header_editable: 'header2',
      };
      const key = keyMap[type];
      if (!key) return;

      const el = fixedElements[key];
      const canvasCoords = screenToCanvas(mouseX, mouseY, viewport.viewport);
      fixedDragRef.current = {
        key,
        offsetX: (canvasCoords.x - el.x) * viewport.viewport.zoom,
        offsetY: (canvasCoords.y - el.y) * viewport.viewport.zoom,
        moved: false,
      };
    },
    [isReadOnly, fixedElements, viewport.viewport]
  );

  const handleFixedNodeClick = useCallback(
    (unit) => {
      if (unit && onSelectUnit) {
        onSelectUnit(unit);
      }
    },
    [onSelectUnit]
  );

  const handleFixedResizeMouseDown = useCallback(
    (e, type) => {
      if (isReadOnly) return;
      e.stopPropagation();
      e.preventDefault();

      const svg = e.currentTarget.closest('svg');
      if (!svg) return;
      const svgRect = svg.getBoundingClientRect();
      const mouseX = e.clientX - svgRect.left;
      const mouseY = e.clientY - svgRect.top;

      const keyMap = {
        consiliu: 'consiliu',
        director_legend: 'director',
        custom_legend: 'customLegend',
        stats_legend: 'legend',
        header: 'header1',
        header_editable: 'header2',
      };
      const key = keyMap[type];
      if (!key) return;

      const el = fixedElements[key];
      fixedResizeRef.current = {
        key,
        startMouseX: mouseX,
        startMouseY: mouseY,
        startWidth: el.width,
        startHeight: el.height,
      };
    },
    [isReadOnly, fixedElements]
  );

  // --- Keyboard shortcuts ---

  useEffect(() => {
    const handleKeyDown = async (e) => {
      // R → rotate selected unit
      if ((e.key === 'r' || e.key === 'R') && !e.ctrlKey && !e.metaKey) {
        if (selection.selectedUnitId && !isReadOnly) {
          const unit = units.find((u) => u.id === selection.selectedUnitId);
          if (unit) {
            try {
              await apiClient.updateUnit(unit.id, {
                is_rotated: !unit.is_rotated,
              });
              queryClient.invalidateQueries({ queryKey: ['units', versionId] });
            } catch (error) {
              toast.error('Eroare la rotirea unității: ' + error.message);
            }
          }
        }
      }

      // Ctrl+0 → reset zoom
      if (e.key === '0' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        viewport.actions.resetZoom();
      }

      // Ctrl+1 → fit to content
      if (e.key === '1' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        viewport.actions.fitToContent(
          units,
          containerRef.current?.clientWidth,
          containerRef.current?.clientHeight,
          fixedElements
        );
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    selection.selectedUnitId,
    isReadOnly,
    units,
    versionId,
    queryClient,
    viewport.actions,
  ]);

  // --- Snapshot capture ---

  const handleCaptureSnapshot = useCallback(async () => {
    const svgElement = svgRef.current;
    if (!svgElement) return;

    try {
      toast.info('Se generează imaginea...');

      const svgClone = svgElement.cloneNode(true);

      // Include both unit positions AND fixed element positions in bounding box
      // Account for rotated units (width/height swap visually)
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

      for (const unit of units) {
        const p = positions[unit.id];
        if (!p) continue;
        const isRotated = unit.is_rotated;
        if (isRotated) {
          // Rotated -90° around center: visual bounds expand
          const cx = p.x + p.width / 2;
          const cy = p.y + p.height / 2;
          const halfW = p.height / 2; // swapped
          const halfH = p.width / 2;  // swapped
          if (cx - halfW < minX) minX = cx - halfW;
          if (cy - halfH < minY) minY = cy - halfH;
          if (cx + halfW > maxX) maxX = cx + halfW;
          if (cy + halfH > maxY) maxY = cy + halfH;
        } else {
          if (p.x < minX) minX = p.x;
          if (p.y < minY) minY = p.y;
          if (p.x + p.width > maxX) maxX = p.x + p.width;
          if (p.y + p.height > maxY) maxY = p.y + p.height;
        }
      }

      for (const fe of Object.values(fixedElements)) {
        if (fe.x < minX) minX = fe.x;
        if (fe.y < minY) minY = fe.y;
        if (fe.x + fe.width > maxX) maxX = fe.x + fe.width;
        if (fe.y + fe.height > maxY) maxY = fe.y + fe.height;
      }

      // Account for director_legend text overflow (OMTI ANEXA text is wider than its rect)
      const dirFe = fixedElements.director;
      if (dirFe && orgType === 'omti') {
        const textOverflow = 200; // estimated overflow of centered long text
        if (dirFe.x + dirFe.width + textOverflow > maxX) maxX = dirFe.x + dirFe.width + textOverflow;
        if (dirFe.x - textOverflow < minX) minX = dirFe.x - textOverflow;
      }

      if (!isFinite(minX)) {
        toast.error('Nu există unități de capturat');
        return;
      }

      const padTop = 20;
      const padBottom = 80;
      const padLeft = 20;
      const padRight = 80;
      const contentWidth = maxX - minX + padLeft + padRight;
      const contentHeight = maxY - minY + padTop + padBottom;

      svgClone.setAttribute('width', contentWidth);
      svgClone.setAttribute('height', contentHeight);
      svgClone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      svgClone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
      svgClone.removeAttribute('style');

      // Embed default font styles so they survive serialization
      const styleEl = document.createElementNS('http://www.w3.org/2000/svg', 'style');
      styleEl.textContent = `
        text { font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; }
        foreignObject div { font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; }
      `;
      svgClone.insertBefore(styleEl, svgClone.firstChild);

      const transformGroup = svgClone.querySelector('g[transform]');
      if (transformGroup) {
        transformGroup.setAttribute('transform', `translate(${padLeft - minX}, ${padTop - minY}) scale(1)`);
      }

      const gridRect = svgClone.querySelector('rect[fill="url(#grid)"]');
      if (gridRect) gridRect.setAttribute('fill', '#ffffff');

      // Remove all resize handles from snapshot
      svgClone.querySelectorAll('g[style*="nwse-resize"]').forEach(el => el.remove());
      svgClone.querySelectorAll('[style*="nwse-resize"]').forEach(el => el.remove());

      // Inline computed styles from original foreignObject elements onto clone
      // This preserves text wrapping, font sizes, flexbox layout etc.
      const originalFOs = svgElement.querySelectorAll('foreignObject');
      const clonedFOs = svgClone.querySelectorAll('foreignObject');
      const importantProps = [
        'display', 'flex-direction', 'align-items', 'justify-content', 'text-align',
        'font-size', 'font-weight', 'font-family', 'color', 'line-height',
        'padding', 'margin', 'width', 'height', 'overflow', 'word-wrap',
        'overflow-wrap', 'hyphens', 'white-space', 'border', 'background-color',
        'box-sizing', 'opacity', 'user-select',
      ];

      for (let i = 0; i < originalFOs.length && i < clonedFOs.length; i++) {
        const origElements = originalFOs[i].querySelectorAll('*');
        const cloneElements = clonedFOs[i].querySelectorAll('*');
        for (let j = 0; j < origElements.length && j < cloneElements.length; j++) {
          const computed = window.getComputedStyle(origElements[j]);
          let inlineStyle = '';
          for (const prop of importantProps) {
            inlineStyle += `${prop}:${computed.getPropertyValue(prop)};`;
          }
          cloneElements[j].setAttribute('style', inlineStyle);
          cloneElements[j].setAttribute('xmlns', 'http://www.w3.org/1999/xhtml');
        }
        // Also set xmlns on the foreignObject's direct children
        const divs = clonedFOs[i].querySelectorAll('div');
        divs.forEach(div => {
          div.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml');
        });
      }

      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(svgClone);

      // Use inline data URL to avoid tainted canvas
      const svgDataUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgString);

      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        canvas.width = contentWidth * 2;
        canvas.height = contentHeight * 2;
        const ctx = canvas.getContext('2d');
        ctx.scale(2, 2);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, contentWidth, contentHeight);
        ctx.drawImage(img, 0, 0, contentWidth, contentHeight);

        const imageData = canvas.toDataURL('image/png');

        // Download locally as PNG
        const link = document.createElement('a');
        link.download = `organigrama_${new Date().toISOString().slice(0, 10)}.png`;
        link.href = imageData;
        link.click();

        // Save to server
        try {
          if (onSnapshot) {
            await onSnapshot(versionId, imageData);
          } else {
            await apiClient.saveVersionSnapshot(versionId, imageData);
          }
          toast.success('Imagine salvată');
        } catch (err) {
          toast.error('Eroare la salvarea imaginii: ' + err.message);
        }
      };
      img.onerror = () => {
        toast.error('Eroare la generarea imaginii');
      };
      img.src = svgDataUrl;
    } catch (error) {
      console.error('Failed to capture snapshot:', error);
      toast.error('Eroare la generarea imaginii: ' + error.message);
    }
  }, [versionId, positions, onSnapshot]);

  // --- Render ---

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      <CanvasViewport
        ref={svgRef}
        units={units}
        fixedNodes={fixedNodes}
        aggregatesMap={aggregatesMap}
        svgTransform={viewport.svgTransform}
        selectedUnitId={selection.selectedUnitId}
        isReadOnly={isReadOnly}
        positions={positions}
        sizes={sizes}
        dragState={drag.dragState}
        isPanning={viewport.isPanning}
        onViewportMouseDown={handleViewportMouseDown}
        onViewportMouseMove={handleViewportMouseMove}
        onViewportMouseUp={handleViewportMouseUp}
        onViewportWheel={viewport.handlers.onWheel}
        onNodeMouseDown={handleNodeMouseDown}
        onNodeContextMenu={handleContextMenu}
        onResizeHandleMouseDown={resize.handlers.onHandleMouseDown}
        onFixedNodeMouseDown={handleFixedNodeMouseDown}
        onFixedNodeClick={handleFixedNodeClick}
        onFixedResizeMouseDown={handleFixedResizeMouseDown}
        orgType={orgType}
      />

      <CanvasToolbar
        zoom={viewport.viewport.zoom}
        onZoomIn={viewport.actions.zoomIn}
        onZoomOut={viewport.actions.zoomOut}
        onFitToContent={() =>
          viewport.actions.fitToContent(
            units,
            containerRef.current?.clientWidth,
            containerRef.current?.clientHeight,
            fixedElements
          )
        }
        onResetZoom={viewport.actions.resetZoom}
        isReadOnly={isReadOnly}
        onAddUnit={handleAddUnit}
        onCaptureSnapshot={handleCaptureSnapshot}
      />

      {/* @ts-ignore */}
      <Minimap
        units={units}
        positions={positions}
        viewport={viewport.viewport}
        canvasSize={{
          width: containerRef.current?.clientWidth || 800,
          height: containerRef.current?.clientHeight || 600,
        }}
        onNavigate={viewport.actions.panTo}
      />

      {contextMenu && (
        // @ts-ignore
        <ContextMenu
          position={contextMenu.position}
          unit={contextMenu.unit}
          isReadOnly={isReadOnly}
          onEdit={() => {
            if (onSelectUnit) onSelectUnit(contextMenu.unit);
            setContextMenu(null);
          }}
          onAddChild={handleAddChild}
          onDelete={handleDeleteUnit}
          onRotate={handleRotateUnit}
          onClose={() => setContextMenu(null)}
        />
      )}

      {isEditingTitle && (() => {
        const h2 = fixedElements.header2;
        const screenPos = canvasToScreen(h2.x, h2.y, viewport.viewport);
        const screenW = Math.max(h2.width * viewport.viewport.zoom, 700);
        const screenCenterX = screenPos.x + (h2.width * viewport.viewport.zoom) / 2;
        return (
          <div style={{
            position: 'absolute',
            top: screenPos.y,
            left: screenCenterX - screenW / 2,
            width: screenW,
            zIndex: 30,
          }}>
            <input
              type="text"
              value={editableTitle}
              onChange={(e) => setEditableTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  saveChartTitle(editableTitle);
                  setIsEditingTitle(false);
                } else if (e.key === 'Escape') {
                  setEditableTitle(chartTitle);
                  setIsEditingTitle(false);
                }
              }}
              onBlur={() => {
                saveChartTitle(editableTitle);
                setIsEditingTitle(false);
              }}
              autoFocus
              className="text-center border border-blue-500 px-2 py-1 rounded outline-none bg-white"
              style={{ width: '100%', fontSize: `${Math.max(10, 14 * viewport.viewport.zoom)}px` }}
            />
          </div>
        );
      })()}
    </div>
  );
}
