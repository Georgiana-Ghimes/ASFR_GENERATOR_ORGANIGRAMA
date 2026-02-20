import React, { useEffect, useState } from 'react';
import { apiClient } from '@/api/apiClient';

const DeterministicOrgChart = ({ versionId, onSelectUnit, isReadOnly }) => {
  const [layoutData, setLayoutData] = useState(null);
  const [aggregates, setAggregates] = useState({});
  const [loading, setLoading] = useState(true);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editableTitle, setEditableTitle] = useState('CODIFICAREA STRUCTURILOR DIN ANEXA LA OMTI NR. 48/23.01.2026');
  const [versionData, setVersionData] = useState(null);
  const [consiliuUnit, setConsiliuUnit] = useState(null);
  const [directorGeneralUnit, setDirectorGeneralUnit] = useState(null);
  const [legendUnit, setLegendUnit] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null); // For highlighting selected unit
  const [draggedNode, setDraggedNode] = useState(null);
  const [draggedFixedElement, setDraggedFixedElement] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [tempPosition, setTempPosition] = useState(null);
  const [nearestParent, setNearestParent] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [resizingNode, setResizingNode] = useState(null);
  const [resizingFixedElement, setResizingFixedElement] = useState(null);
  const [tempHeight, setTempHeight] = useState(null);
  const [tempWidth, setTempWidth] = useState(null);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStartPos, setResizeStartPos] = useState({ x: 0, y: 0 });
  const svgRef = React.useRef(null);

  // Fixed elements positions (legend, director, consiliu, headers, customLegend)
  const [fixedElements, setFixedElements] = useState({
    legend: { x: 20, y: 20, width: 200, height: 100 },
    director: { x: 1180, y: 20, width: 200, height: 60 },
    header1: { x: 500, y: 120, width: 400, height: 20 },
    header2: { x: 500, y: 140, width: 400, height: 20 },
    consiliu: { x: 600, y: 180, width: 300, height: 60 },
    customLegend: { x: 450, y: 20, width: 200, height: 300 }
  });

  const SNAP_DISTANCE = 19; // 0.5cm ≈ 19px
  const GRID_SIZE = 20; // Grid cell size in pixels
  
  const snapToGrid = (value) => {
    return Math.round(value / GRID_SIZE) * GRID_SIZE;
  };

  // Calculate dynamic font size based on element dimensions
  const getDynamicFontSize = (elementKey, baseFontSize = 10) => {
    const element = resizingFixedElement === elementKey && tempWidth && tempHeight
      ? { width: tempWidth, height: tempHeight }
      : fixedElements[elementKey];
    
    // Base dimensions for reference (initial dimensions)
    const initialDimensions = {
      legend: { width: 200, height: 100 },
      director: { width: 200, height: 60 },
      header1: { width: 400, height: 20 },
      header2: { width: 400, height: 20 },
      consiliu: { width: 300, height: 60 },
      customLegend: { width: 200, height: 300 }
    };
    
    const baseWidth = initialDimensions[elementKey].width;
    const baseHeight = initialDimensions[elementKey].height;
    
    // Calculate scale factor (use the smaller of width/height scale)
    const scaleX = element.width / baseWidth;
    const scaleY = element.height / baseHeight;
    const scale = Math.min(scaleX, scaleY);
    
    // For legend, use larger base font and better scaling
    if (elementKey === 'legend') {
      return Math.max(8, Math.min(baseFontSize * scale, 32)); // Clamp between 8px and 32px
    }
    
    return Math.max(6, Math.min(baseFontSize * scale, 24)); // Clamp between 6px and 24px
  };

  useEffect(() => {
    if (!versionId) return;
    
    // Load fixed elements positions from localStorage
    const savedPositions = localStorage.getItem(`fixed_elements_${versionId}`);
    if (savedPositions) {
      const parsed = JSON.parse(savedPositions);
      // Ensure customLegend exists (for backward compatibility)
      if (!parsed.customLegend) {
        parsed.customLegend = { x: 450, y: 20, width: 200, height: 300 };
      }
      setFixedElements(parsed);
    }
    
    const fetchLayout = async () => {
      try {
        setLoading(true);
        const response = await fetch(`http://localhost:8000/api/layout/${versionId}`);
        const data = await response.json();
        
        setLayoutData(data);
        
        // Build aggregates map
        const aggMap = {};
        data.layout.forEach(node => {
          if (node.aggregates) {
            aggMap[node.unit_id] = node.aggregates;
          }
        });
        setAggregates(aggMap);
        
        // Fetch version data to get chart_title
        const versionResponse = await fetch(`http://localhost:8000/api/versions/${versionId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          }
        });
        const versionInfo = await versionResponse.json();
        setVersionData(versionInfo);
        setEditableTitle(versionInfo.chart_title || 'CODIFICAREA STRUCTURILOR DIN ANEXA LA OMTI NR. 48/23.01.2026');
        
        // Fetch special units (consiliu, director_general, legend)
        const units = await apiClient.listUnits(versionId);
        const consiliu = units.find(u => u.stas_code === '330' || u.unit_type === 'consiliu');
        setConsiliuUnit(consiliu);
        
        const directorGeneral = units.find(u => u.unit_type === 'director_general');
        setDirectorGeneralUnit(directorGeneral);
        
        const legend = units.find(u => u.unit_type === 'legend');
        setLegendUnit(legend);
      } catch (error) {
        console.error('Failed to fetch layout:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchLayout();
  }, [versionId]);

  // Keyboard listener for R key to rotate selected unit
  useEffect(() => {
    const handleKeyPress = async (e) => {
      // ESC key to deselect
      if (e.key === 'Escape') {
        setSelectedNode(null);
        return;
      }
      
      console.log('Key pressed:', e.key, 'Selected node:', selectedNode);
      if (e.key === 'r' || e.key === 'R') {
        if (selectedNode && !isReadOnly) {
          console.log('Rotating unit:', selectedNode.unit_id);
          try {
            // Toggle rotation
            const newRotation = !selectedNode.unit.is_rotated;
            console.log('New rotation state:', newRotation);
            
            const response = await fetch(`http://localhost:8000/api/units/${selectedNode.unit_id}`, {
              method: 'PATCH',
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ is_rotated: newRotation })
            });
            
            console.log('Response status:', response.status);
            
            if (response.ok) {
              // Refresh layout
              const layoutResponse = await fetch(`http://localhost:8000/api/layout/${versionId}`);
              const data = await layoutResponse.json();
              setLayoutData(data);
              
              const aggMap = {};
              data.layout.forEach(node => {
                if (node.aggregates) {
                  aggMap[node.unit_id] = node.aggregates;
                }
              });
              setAggregates(aggMap);
              
              // Update selected node
              const updatedNode = data.layout.find(n => n.unit_id === selectedNode.unit_id);
              if (updatedNode) {
                setSelectedNode(updatedNode);
              }
            }
          } catch (error) {
            console.error('Failed to rotate unit:', error);
          }
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [selectedNode, versionId, isReadOnly]);

  const findNearestNode = (x, y, excludeId) => {
    if (!layoutData) return null;
    
    let nearest = null;
    let minDistance = SNAP_DISTANCE;
    
    layoutData.layout.forEach(node => {
      if (node.unit_id === excludeId) return;
      
      // Calculate distance from dragged node center to this node center
      const nodeCenterX = node.x + node.width / 2;
      const nodeCenterY = node.y + node.height / 2;
      const distance = Math.sqrt(
        Math.pow(x - nodeCenterX, 2) + Math.pow(y - nodeCenterY, 2)
      );
      
      if (distance < minDistance) {
        minDistance = distance;
        nearest = node;
      }
    });
    
    return nearest;
  };

  const handleMouseDown = (e, node) => {
    if (isReadOnly) return;
    
    // Right click - open edit panel
    if (e.button === 2) {
      e.stopPropagation();
      e.preventDefault();
      if (onSelectUnit) {
        onSelectUnit(node.unit);
      }
      return;
    }
    
    // Left click - select or start drag
    if (e.button === 0) {
      e.stopPropagation();
      e.preventDefault();
      
      const svg = e.currentTarget.closest('svg');
      if (!svg) return;
      
      const svgRect = svg.getBoundingClientRect();
      const mouseX = e.clientX - svgRect.left;
      const mouseY = e.clientY - svgRect.top;
      
      setDraggedNode(node);
      setIsDragging(false);
      setDragOffset({
        x: mouseX - node.x,
        y: mouseY - node.y
      });
      setTempPosition({ x: node.x, y: node.y });
    }
  };

  const handleMouseMove = (e) => {
    if (!draggedNode) return;
    
    e.preventDefault();
    
    setIsDragging(true);
    
    const svgRect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - svgRect.left;
    const mouseY = e.clientY - svgRect.top;
    
    const rawX = mouseX - dragOffset.x;
    const rawY = mouseY - dragOffset.y;
    
    // Snap to grid
    const newX = snapToGrid(rawX);
    const newY = snapToGrid(rawY);
    
    setTempPosition({ x: newX, y: newY });
    
    // Find nearest node for snap preview
    const centerX = newX + draggedNode.width / 2;
    const centerY = newY + draggedNode.height / 2;
    const nearest = findNearestNode(centerX, centerY, draggedNode.unit_id);
    setNearestParent(nearest);
  };

  const handleMouseUp = async () => {
    if (!draggedNode || !tempPosition) return;
    
    const wasDragging = isDragging;
    
    // If was actually dragging (not just a click), save position
    if (wasDragging) {
      try {
        // Always save the custom position
        const updateData = {
          custom_x: Math.round(tempPosition.x),
          custom_y: Math.round(tempPosition.y)
        };
        
        // If near another node, also update parent
        if (nearestParent) {
          updateData.parent_unit_id = nearestParent.unit_id;
        }
        
        const response = await fetch(`http://localhost:8000/api/units/${draggedNode.unit_id}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(updateData)
        });
        
        if (response.ok) {
          // Refresh layout
          const layoutResponse = await fetch(`http://localhost:8000/api/layout/${versionId}`);
          const data = await layoutResponse.json();
          setLayoutData(data);
          
          const aggMap = {};
          data.layout.forEach(node => {
            if (node.aggregates) {
              aggMap[node.unit_id] = node.aggregates;
            }
          });
          setAggregates(aggMap);
        }
      } catch (error) {
        console.error('Failed to update position:', error);
      }
    } else {
      // Was just a click, select the node (highlight it)
      setSelectedNode(draggedNode);
    }
    
    setDraggedNode(null);
    setTempPosition(null);
    setNearestParent(null);
    setIsDragging(false);
  };

  // Fixed elements drag handlers
  const handleFixedElementMouseDown = (e, elementKey) => {
    if (isReadOnly) return;
    
    e.stopPropagation();
    e.preventDefault();
    
    const svg = e.currentTarget.closest('svg');
    if (!svg) return;
    
    const svgRect = svg.getBoundingClientRect();
    const mouseX = e.clientX - svgRect.left;
    const mouseY = e.clientY - svgRect.top;
    
    const element = fixedElements[elementKey];
    setDraggedFixedElement(elementKey);
    setIsDragging(false);
    setDragOffset({
      x: mouseX - element.x,
      y: mouseY - element.y
    });
    setTempPosition({ x: element.x, y: element.y });
  };

  const handleFixedElementMouseMove = (e) => {
    if (!draggedFixedElement) return;
    
    e.preventDefault();
    setIsDragging(true);
    
    const svgRect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - svgRect.left;
    const mouseY = e.clientY - svgRect.top;
    
    const rawX = mouseX - dragOffset.x;
    const rawY = mouseY - dragOffset.y;
    
    // Snap to grid
    const newX = snapToGrid(rawX);
    const newY = snapToGrid(rawY);
    
    setTempPosition({ x: newX, y: newY });
  };

  const handleFixedElementMouseUp = async () => {
    if (!draggedFixedElement) return;
    
    const wasDragging = isDragging;
    
    if (wasDragging && tempPosition) {
      // Save new position
      const newPositions = {
        ...fixedElements,
        [draggedFixedElement]: {
          ...fixedElements[draggedFixedElement],
          x: tempPosition.x,
          y: tempPosition.y
        }
      };
      setFixedElements(newPositions);
      localStorage.setItem(`fixed_elements_${versionId}`, JSON.stringify(newPositions));
    } else if (!wasDragging) {
      // Was just a click, open panel for consiliu, director, or customLegend
      if (draggedFixedElement === 'consiliu' && onSelectUnit) {
        try {
          const units = await apiClient.listUnits(versionId);
          const consiliu = units.find(u => u.stas_code === '330' || u.unit_type === 'consiliu');
          
          if (consiliu) {
            onSelectUnit(consiliu);
          }
        } catch (error) {
          console.error('Error fetching consiliu unit:', error);
        }
      } else if (draggedFixedElement === 'director' && onSelectUnit) {
        try {
          const units = await apiClient.listUnits(versionId);
          const directorGeneral = units.find(u => u.unit_type === 'director_general');
          
          if (directorGeneral) {
            onSelectUnit(directorGeneral);
          }
        } catch (error) {
          console.error('Error fetching director_general unit:', error);
        }
      } else if (draggedFixedElement === 'customLegend' && onSelectUnit) {
        try {
          const units = await apiClient.listUnits(versionId);
          const legend = units.find(u => u.unit_type === 'legend');
          
          if (legend) {
            onSelectUnit(legend);
          }
        } catch (error) {
          console.error('Error fetching legend unit:', error);
        }
      }
    }
    
    setDraggedFixedElement(null);
    setTempPosition(null);
    setIsDragging(false);
  };
  
  // Refresh special units data when needed (called from parent after save)
  const refreshSpecialUnitsData = async () => {
    try {
      const units = await apiClient.listUnits(versionId);
      const consiliu = units.find(u => u.stas_code === '330' || u.unit_type === 'consiliu');
      setConsiliuUnit(consiliu);
      
      const directorGeneral = units.find(u => u.unit_type === 'director_general');
      setDirectorGeneralUnit(directorGeneral);
      
      const legend = units.find(u => u.unit_type === 'legend');
      setLegendUnit(legend);
    } catch (error) {
      console.error('Error refreshing special units:', error);
    }
  };

  // Fixed elements resize handlers
  const handleFixedElementResizeMouseDown = (e, elementKey) => {
    if (isReadOnly) return;
    
    e.stopPropagation();
    e.preventDefault();
    
    const svgRect = e.currentTarget.closest('svg').getBoundingClientRect();
    const mouseX = e.clientX - svgRect.left;
    const mouseY = e.clientY - svgRect.top;
    
    const element = fixedElements[elementKey];
    setResizingFixedElement(elementKey);
    setIsResizing(false);
    setTempHeight(element.height);
    setTempWidth(element.width);
    setResizeStartPos({ x: mouseX, y: mouseY });
  };

  const handleFixedElementResizeMouseMove = (e) => {
    if (!resizingFixedElement) return;
    
    e.preventDefault();
    setIsResizing(true);
    
    const svgRect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - svgRect.left;
    const mouseY = e.clientY - svgRect.top;
    
    const deltaX = mouseX - resizeStartPos.x;
    const deltaY = mouseY - resizeStartPos.y;
    
    const element = fixedElements[resizingFixedElement];
    const newWidth = element.width + deltaX;
    const newHeight = element.height + deltaY;
    
    // Snap to grid and enforce minimums
    const snappedWidth = Math.max(100, snapToGrid(newWidth));
    const snappedHeight = Math.max(40, snapToGrid(newHeight));
    
    setTempWidth(snappedWidth);
    setTempHeight(snappedHeight);
  };

  const handleFixedElementResizeMouseUp = () => {
    if (!resizingFixedElement || !tempHeight || !tempWidth) return;
    
    const wasResizing = isResizing;
    
    if (wasResizing) {
      const newPositions = {
        ...fixedElements,
        [resizingFixedElement]: {
          ...fixedElements[resizingFixedElement],
          width: tempWidth,
          height: tempHeight
        }
      };
      setFixedElements(newPositions);
      localStorage.setItem(`fixed_elements_${versionId}`, JSON.stringify(newPositions));
    }
    
    setResizingFixedElement(null);
    setTempHeight(null);
    setTempWidth(null);
    setIsResizing(false);
  };

  const handleResizeMouseDown = (e, node) => {
    if (isReadOnly) return;
    
    e.stopPropagation();
    e.preventDefault();
    
    const svgRect = e.currentTarget.closest('svg').getBoundingClientRect();
    const mouseX = e.clientX - svgRect.left;
    const mouseY = e.clientY - svgRect.top;
    
    setResizingNode(node);
    setIsResizing(false);
    setTempHeight(node.height);
    setTempWidth(node.width);
    // Store initial mouse position for delta calculation
    setResizeStartPos({ x: mouseX, y: mouseY });
  };

  const handleResizeMouseMove = (e) => {
    if (!resizingNode) return;
    
    e.preventDefault();
    setIsResizing(true);
    
    const svgRect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - svgRect.left;
    const mouseY = e.clientY - svgRect.top;
    
    // Calculate delta from initial mouse position
    let deltaX = mouseX - resizeStartPos.x;
    let deltaY = mouseY - resizeStartPos.y;
    
    console.log('Original deltas:', deltaX, deltaY, 'Is rotated:', resizingNode.unit.is_rotated);
    
    // If unit is rotated -90 degrees:
    // - Visual right = original down (height increases with deltaX)
    // - Visual down = original left (width decreases with deltaY, so negate it)
    let newWidth, newHeight;
    if (resizingNode.unit.is_rotated) {
      newWidth = resizingNode.width - deltaY;  // Visual down = original left (inverted)
      newHeight = resizingNode.height + deltaX; // Visual right = original down
      console.log('Adjusted for rotation - newWidth:', newWidth, 'newHeight:', newHeight);
    } else {
      newWidth = resizingNode.width + deltaX;
      newHeight = resizingNode.height + deltaY;
    }
    
    console.log('New dimensions:', newWidth, 'x', newHeight);
    
    // Snap to grid (20px increments) and enforce minimums
    const snappedWidth = Math.max(200, snapToGrid(newWidth));  // Minimum 200px width
    const snappedHeight = Math.max(40, snapToGrid(newHeight)); // Minimum 40px height (2 grid cells)
    
    setTempWidth(snappedWidth);
    setTempHeight(snappedHeight);
  };

  const handleResizeMouseUp = async () => {
    if (!resizingNode || !tempHeight || !tempWidth) return;
    
    const wasResizing = isResizing;
    
    if (wasResizing) {
      try {
        const response = await fetch(`http://localhost:8000/api/units/${resizingNode.unit_id}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            custom_height: tempHeight,
            custom_width: tempWidth
          })
        });
        
        if (response.ok) {
          // Refresh layout
          const layoutResponse = await fetch(`http://localhost:8000/api/layout/${versionId}`);
          const data = await layoutResponse.json();
          setLayoutData(data);
          
          const aggMap = {};
          data.layout.forEach(node => {
            if (node.aggregates) {
              aggMap[node.unit_id] = node.aggregates;
            }
          });
          setAggregates(aggMap);
        }
      } catch (error) {
        console.error('Failed to update dimensions:', error);
      }
    }
    
    setResizingNode(null);
    setTempHeight(null);
    setTempWidth(null);
    setIsResizing(false);
  };

  const saveChartTitle = async (newTitle) => {
    try {
      const response = await fetch(`http://localhost:8000/api/versions/${versionId}/chart-title?title=${encodeURIComponent(newTitle)}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to save chart title');
      }
      
      const data = await response.json();
      setEditableTitle(data.chart_title);
    } catch (error) {
      console.error('Failed to save chart title:', error);
      // Revert to previous title on error
      setEditableTitle(versionData?.chart_title || 'CODIFICAREA STRUCTURILOR DIN ANEXA LA OMTI NR. 48/23.01.2026');
    }
  };

  const getUnitColor = (unit) => {
    // Default colors mapping - exact colors from the image
    const colorMap = {
      '#86C67C': { bg: '#86C67C', border: '#6BA85C', text: '#000000', stripOnly: true },
      '#86C67C-full': { bg: '#86C67C', border: '#6BA85C', text: '#000000', stripOnly: false },
      '#E8B4D4': { bg: '#E8B4D4', border: '#D89CC4', text: '#000000', stripOnly: true },
      '#E8B4D4-full': { bg: '#E8B4D4', border: '#D89CC4', text: '#000000', stripOnly: false },
      '#F4E03C': { bg: '#F4E03C', border: '#E4D02C', text: '#000000', stripOnly: true },
      '#F4E03C-full': { bg: '#F4E03C', border: '#E4D02C', text: '#000000', stripOnly: false },
      '#8CB4D4': { bg: '#8CB4D4', border: '#6C94B4', text: '#000000', stripOnly: true },
      '#8CB4D4-full': { bg: '#8CB4D4', border: '#6C94B4', text: '#000000', stripOnly: false },
      '#F4A43C': { bg: '#F4A43C', border: '#E4942C', text: '#000000', stripOnly: true },
      '#F4A43C-full': { bg: '#F4A43C', border: '#E4942C', text: '#000000', stripOnly: false },
    };
    
    // If unit has a color set, use it
    if (unit.color && colorMap[unit.color]) {
      return colorMap[unit.color];
    }
    
    // Default color for director_general - dark green
    if (unit.unit_type === 'director_general') {
      return { bg: '#4A7C4E', border: '#3A6C3E', text: '#ffffff', stripOnly: false };
    }
    
    // Default fallback - white
    return { bg: '#ffffff', border: '#d1d5db', text: '#000000', stripOnly: true };
  };

  // Calculate canvas size - ensure minimum width for consiliu
  const consiliu_height = 150;
  const minWidth = 1400;
  const maxX = layoutData && layoutData.layout.length > 0 
    ? Math.max(minWidth, ...layoutData.layout.map(n => n.x + n.width + 100))
    : minWidth;
  const maxY = layoutData && layoutData.layout.length > 0 
    ? Math.max(...layoutData.layout.map(n => n.y + n.height)) + 100 
    : 900;

  // Draw edges with proper parent-children grouping (orgchart style)
  const drawEdges = () => {
    if (!layoutData.edges) return null;
    
    const edgeElements = [];
    
    // Handle consiliu to DG edge separately
    const consiliuEdge = layoutData.edges.find(e => e.from === 'consiliu');
    if (consiliuEdge) {
      const dgNode = layoutData.layout.find(n => n.unit.unit_type === 'director_general');
      if (dgNode) {
        const isDGDragged = draggedNode?.unit_id === dgNode.unit_id;
        const isDGResized = resizingNode?.unit_id === dgNode.unit_id;
        const dgX = isDGDragged && tempPosition ? tempPosition.x : dgNode.x;
        const dgY = isDGDragged && tempPosition ? tempPosition.y : dgNode.y;
        const dgWidth = isDGResized && tempWidth ? tempWidth : dgNode.width;
        
        const consiliu = draggedFixedElement === 'consiliu' && tempPosition 
          ? { 
              x: tempPosition.x, 
              y: fixedElements.consiliu.y,
              width: resizingFixedElement === 'consiliu' && tempWidth ? tempWidth : fixedElements.consiliu.width,
              height: resizingFixedElement === 'consiliu' && tempHeight ? tempHeight : fixedElements.consiliu.height
            }
          : {
              x: fixedElements.consiliu.x,
              y: fixedElements.consiliu.y,
              width: resizingFixedElement === 'consiliu' && tempWidth ? tempWidth : fixedElements.consiliu.width,
              height: resizingFixedElement === 'consiliu' && tempHeight ? tempHeight : fixedElements.consiliu.height
            };
        
        const consiliuCenterX = consiliu.x + consiliu.width / 2;
        const consiliuBottomY = consiliu.y + consiliu.height;
        const dgCenterX = dgX + dgWidth / 2;
        const dgTopY = dgY;
        
        // Short vertical line from consiliu, then horizontal, then short vertical to DG
        const verticalGap = 30; // Short vertical segment
        const horizontalY = consiliuBottomY + verticalGap;
        
        edgeElements.push(
          <g key="consiliu-dg">
            {/* Short vertical from consiliu */}
            <line x1={consiliuCenterX} y1={consiliuBottomY} x2={consiliuCenterX} y2={horizontalY} stroke="#94a3b8" strokeWidth="2" />
            {/* Horizontal line */}
            <line x1={consiliuCenterX} y1={horizontalY} x2={dgCenterX} y2={horizontalY} stroke="#94a3b8" strokeWidth="2" />
            {/* Short vertical to DG */}
            <line x1={dgCenterX} y1={horizontalY} x2={dgCenterX} y2={dgTopY} stroke="#94a3b8" strokeWidth="2" />
          </g>
        );
      }
    }
    
    // Group edges by parent
    const edgesByParent = {};
    layoutData.edges.forEach(edge => {
      if (edge.from === 'consiliu') return; // Skip consiliu edge
      if (!edgesByParent[edge.from]) {
        edgesByParent[edge.from] = [];
      }
      edgesByParent[edge.from].push(edge);
    });
    
    // Draw edges for each parent group
    Object.entries(edgesByParent).forEach(([parentId, edges]) => {
      if (edges.length === 0) return;
      
      // Get parent node
      const parentNode = layoutData.layout.find(n => n.unit_id === parentId);
      if (!parentNode) return;
      
      const isParentDragged = draggedNode?.unit_id === parentId;
      const isParentResized = resizingNode?.unit_id === parentId;
      const parentX = isParentDragged && tempPosition ? tempPosition.x : parentNode.x;
      const parentY = isParentDragged && tempPosition ? tempPosition.y : parentNode.y;
      const parentWidth = isParentResized && tempWidth ? tempWidth : parentNode.width;
      const parentHeight = isParentResized && tempHeight ? tempHeight : parentNode.height;
      
      const parentCenterX = parentX + parentWidth / 2;
      const parentBottomY = parentY + parentHeight;
      const parentCenterY = parentY + parentHeight / 2;
      const parentRight = parentX + parentWidth;
      const parentLeft = parentX;
      
      // Get all children positions
      const children = edges.map(edge => {
        const childNode = layoutData.layout.find(n => n.unit_id === edge.to);
        if (!childNode) return null;
        
        const isChildDragged = draggedNode?.unit_id === childNode.unit_id;
        const isChildResized = resizingNode?.unit_id === childNode.unit_id;
        const childX = isChildDragged && tempPosition ? tempPosition.x : childNode.x;
        const childY = isChildDragged && tempPosition ? tempPosition.y : childNode.y;
        const childWidth = isChildResized && tempWidth ? tempWidth : childNode.width;
        const childHeight = isChildResized && tempHeight ? tempHeight : childNode.height;
        
        return {
          id: edge.to,
          centerX: childX + childWidth / 2,
          centerY: childY + childHeight / 2,
          topY: childY,
          left: childX,
          right: childX + childWidth
        };
      }).filter(c => c !== null);
      
      if (children.length === 0) return;
      
      // Determine direction: where are children relative to parent?
      const childrenCenterX = children.reduce((sum, c) => sum + c.centerX, 0) / children.length;
      const childrenCenterY = children.reduce((sum, c) => sum + c.centerY, 0) / children.length;
      
      const isBelow = childrenCenterY > (parentY + parentHeight);
      const isRight = !isBelow && childrenCenterX > (parentX + parentWidth);
      const isLeft = !isBelow && !isRight && childrenCenterX < parentX;
      
      const verticalGap = 30;
      
      if (children.length === 1) {
        const child = children[0];
        
        if (isBelow) {
          // Child below
          if (Math.abs(parentCenterX - child.centerX) < 5) {
            edgeElements.push(
              <line
                key={`${parentId}-${child.id}`}
                x1={parentCenterX}
                y1={parentBottomY}
                x2={child.centerX}
                y2={child.topY}
                stroke="#94a3b8"
                strokeWidth="2"
              />
            );
          } else {
            const horizontalY = parentBottomY + verticalGap;
            edgeElements.push(
              <g key={`${parentId}-${child.id}`}>
                <line x1={parentCenterX} y1={parentBottomY} x2={parentCenterX} y2={horizontalY} stroke="#94a3b8" strokeWidth="2" />
                <line x1={parentCenterX} y1={horizontalY} x2={child.centerX} y2={horizontalY} stroke="#94a3b8" strokeWidth="2" />
                <line x1={child.centerX} y1={horizontalY} x2={child.centerX} y2={child.topY} stroke="#94a3b8" strokeWidth="2" />
              </g>
            );
          }
        } else if (isRight) {
          // Child to the right
          if (Math.abs(parentCenterY - child.centerY) < 5) {
            edgeElements.push(
              <line
                key={`${parentId}-${child.id}`}
                x1={parentRight}
                y1={parentCenterY}
                x2={child.left}
                y2={child.centerY}
                stroke="#94a3b8"
                strokeWidth="2"
              />
            );
          } else {
            const verticalX = parentRight + verticalGap;
            edgeElements.push(
              <g key={`${parentId}-${child.id}`}>
                <line x1={parentRight} y1={parentCenterY} x2={verticalX} y2={parentCenterY} stroke="#94a3b8" strokeWidth="2" />
                <line x1={verticalX} y1={parentCenterY} x2={verticalX} y2={child.centerY} stroke="#94a3b8" strokeWidth="2" />
                <line x1={verticalX} y1={child.centerY} x2={child.left} y2={child.centerY} stroke="#94a3b8" strokeWidth="2" />
              </g>
            );
          }
        } else if (isLeft) {
          // Child to the left
          if (Math.abs(parentCenterY - child.centerY) < 5) {
            edgeElements.push(
              <line
                key={`${parentId}-${child.id}`}
                x1={parentLeft}
                y1={parentCenterY}
                x2={child.right}
                y2={child.centerY}
                stroke="#94a3b8"
                strokeWidth="2"
              />
            );
          } else {
            const verticalX = parentLeft - verticalGap;
            edgeElements.push(
              <g key={`${parentId}-${child.id}`}>
                <line x1={parentLeft} y1={parentCenterY} x2={verticalX} y2={parentCenterY} stroke="#94a3b8" strokeWidth="2" />
                <line x1={verticalX} y1={parentCenterY} x2={verticalX} y2={child.centerY} stroke="#94a3b8" strokeWidth="2" />
                <line x1={verticalX} y1={child.centerY} x2={child.right} y2={child.centerY} stroke="#94a3b8" strokeWidth="2" />
              </g>
            );
          }
        }
      } else {
        // Multiple children
        
        if (isBelow) {
          // Children below: vertical short, horizontal long, verticals short
          const childrenX = children.map(c => c.centerX);
          const leftmostX = Math.min(...childrenX);
          const rightmostX = Math.max(...childrenX);
          const horizontalY = parentBottomY + verticalGap;
          const horizontalStartX = Math.min(leftmostX, parentCenterX);
          const horizontalEndX = Math.max(rightmostX, parentCenterX);
          
          edgeElements.push(
            <line
              key={`${parentId}-main`}
              x1={parentCenterX}
              y1={parentBottomY}
              x2={parentCenterX}
              y2={horizontalY}
              stroke="#94a3b8"
              strokeWidth="2"
            />
          );
          
          edgeElements.push(
            <line
              key={`${parentId}-dist`}
              x1={horizontalStartX}
              y1={horizontalY}
              x2={horizontalEndX}
              y2={horizontalY}
              stroke="#94a3b8"
              strokeWidth="2"
            />
          );
          
          children.forEach(child => {
            edgeElements.push(
              <line
                key={`${parentId}-${child.id}`}
                x1={child.centerX}
                y1={horizontalY}
                x2={child.centerX}
                y2={child.topY}
                stroke="#94a3b8"
                strokeWidth="2"
              />
            );
          });
        } else if (isRight) {
          // Children to the right: horizontal short, vertical long, horizontals short
          const childrenY = children.map(c => c.centerY);
          const topmostY = Math.min(...childrenY);
          const bottommostY = Math.max(...childrenY);
          const verticalX = parentRight + verticalGap;
          const verticalStartY = Math.min(topmostY, parentCenterY);
          const verticalEndY = Math.max(bottommostY, parentCenterY);
          
          edgeElements.push(
            <line
              key={`${parentId}-main`}
              x1={parentRight}
              y1={parentCenterY}
              x2={verticalX}
              y2={parentCenterY}
              stroke="#94a3b8"
              strokeWidth="2"
            />
          );
          
          edgeElements.push(
            <line
              key={`${parentId}-dist`}
              x1={verticalX}
              y1={verticalStartY}
              x2={verticalX}
              y2={verticalEndY}
              stroke="#94a3b8"
              strokeWidth="2"
            />
          );
          
          children.forEach(child => {
            edgeElements.push(
              <line
                key={`${parentId}-${child.id}`}
                x1={verticalX}
                y1={child.centerY}
                x2={child.left}
                y2={child.centerY}
                stroke="#94a3b8"
                strokeWidth="2"
              />
            );
          });
        } else if (isLeft) {
          // Children to the left: horizontal short, vertical long, horizontals short
          const childrenY = children.map(c => c.centerY);
          const topmostY = Math.min(...childrenY);
          const bottommostY = Math.max(...childrenY);
          const verticalX = parentLeft - verticalGap;
          const verticalStartY = Math.min(topmostY, parentCenterY);
          const verticalEndY = Math.max(bottommostY, parentCenterY);
          
          edgeElements.push(
            <line
              key={`${parentId}-main`}
              x1={parentLeft}
              y1={parentCenterY}
              x2={verticalX}
              y2={parentCenterY}
              stroke="#94a3b8"
              strokeWidth="2"
            />
          );
          
          edgeElements.push(
            <line
              key={`${parentId}-dist`}
              x1={verticalX}
              y1={verticalStartY}
              x2={verticalX}
              y2={verticalEndY}
              stroke="#94a3b8"
              strokeWidth="2"
            />
          );
          
          children.forEach(child => {
            edgeElements.push(
              <line
                key={`${parentId}-${child.id}`}
                x1={verticalX}
                y1={child.centerY}
                x2={child.right}
                y2={child.centerY}
                stroke="#94a3b8"
                strokeWidth="2"
              />
            );
          });
        }
      }
    });
    
    return edgeElements;
  };

  return (
    <div className="w-full h-full overflow-hidden bg-white">
      <div className="w-full h-full overflow-auto p-4">
        {!layoutData || !layoutData.layout.length ? (
          <div className="p-8 text-center text-gray-500">
            Nu există structură organizațională. Adaugă unități pentru a construi organigrama.
          </div>
        ) : (
          <div style={{ position: 'relative' }}>
            {/* Editing overlay */}
            {isEditingTitle && (
              <div style={{ 
                position: 'absolute', 
                top: '14px', 
                left: '50%', 
                transform: 'translateX(-50%)',
                zIndex: 10
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
                      setEditableTitle(versionData?.chart_title || 'CODIFICAREA STRUCTURILOR DIN ANEXA LA OMTI NR. 48/23.01.2026');
                      setIsEditingTitle(false);
                    }
                  }}
                  onBlur={() => {
                    saveChartTitle(editableTitle);
                    setIsEditingTitle(false);
                  }}
                  autoFocus
                  className="text-center text-[10px] border border-blue-500 px-2 py-1 rounded outline-none bg-white"
                  style={{ width: '600px' }}
                />
              </div>
            )}
            
            <svg 
              ref={svgRef}
              width="100%" 
              height="100%" 
              viewBox={`0 0 ${maxX} ${maxY}`}
              preserveAspectRatio="xMidYMin meet"
              className="bg-white"
              onClick={(e) => {
                // Deselect if clicking on canvas (not on a unit)
                if (e.target === e.currentTarget || e.target.tagName === 'svg') {
                  setSelectedNode(null);
                }
              }}
              onMouseMove={(e) => {
                handleMouseMove(e);
                handleFixedElementMouseMove(e);
                handleFixedElementResizeMouseMove(e);
                handleResizeMouseMove(e);
              }}
              onMouseUp={() => {
                handleMouseUp();
                handleFixedElementMouseUp();
                handleFixedElementResizeMouseUp();
                handleResizeMouseUp();
              }}
              onMouseLeave={() => {
                handleMouseUp();
                handleFixedElementMouseUp();
                handleFixedElementResizeMouseUp();
                handleResizeMouseUp();
              }}
            >
              {/* Grid pattern */}
              <defs>
                <pattern
                  id="grid"
                  width={GRID_SIZE}
                  height={GRID_SIZE}
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d={`M ${GRID_SIZE} 0 L 0 0 0 ${GRID_SIZE}`}
                    fill="none"
                    stroke="#9ca3af"
                    strokeWidth="1"
                  />
                </pattern>
              </defs>
              
              {/* Grid background - show when dragging or resizing */}
              {(draggedNode || draggedFixedElement || resizingNode || resizingFixedElement) && (
                <rect
                  x="0"
                  y="0"
                  width={maxX}
                  height={maxY}
                  fill="url(#grid)"
                />
              )}

              {/* Legend - draggable and resizable box */}
              <g>
                <g
                  onMouseDown={(e) => handleFixedElementMouseDown(e, 'legend')}
                  style={{ cursor: isReadOnly ? 'default' : 'move' }}
                >
                  <rect
                    x={draggedFixedElement === 'legend' && tempPosition ? tempPosition.x : fixedElements.legend.x}
                    y={draggedFixedElement === 'legend' && tempPosition ? tempPosition.y : fixedElements.legend.y}
                    width={resizingFixedElement === 'legend' && tempWidth ? tempWidth : fixedElements.legend.width}
                    height={resizingFixedElement === 'legend' && tempHeight ? tempHeight : fixedElements.legend.height}
                    fill="transparent"
                    stroke={draggedFixedElement === 'legend' || resizingFixedElement === 'legend' ? '#3b82f6' : 'transparent'}
                    strokeWidth="2"
                  />
                  <foreignObject 
                    x={draggedFixedElement === 'legend' && tempPosition ? tempPosition.x : fixedElements.legend.x} 
                    y={draggedFixedElement === 'legend' && tempPosition ? tempPosition.y : fixedElements.legend.y} 
                    width={resizingFixedElement === 'legend' && tempWidth ? tempWidth : fixedElements.legend.width} 
                    height={resizingFixedElement === 'legend' && tempHeight ? tempHeight : fixedElements.legend.height}
                    style={{ pointerEvents: 'none' }}
                  >
                    <div className="border-2 border-gray-800 p-2 bg-gray-50 h-full overflow-hidden flex items-center justify-center" style={{ fontSize: `${getDynamicFontSize('legend', 14)}px` }}>
                      <div className="text-center">
                        {(() => {
                          // Calculate totals from all units (exclude consiliu)
                          let totalLeadership = 0;
                          let totalExecution = 0;
                          let dgCount = 0;
                          let directorCount = 0;
                          let inspectorCount = 0;
                          let serviceCount = 0;

                          layoutData.layout.forEach(node => {
                            // Skip consiliu unit
                            if (node.unit.unit_type === 'consiliu' || node.unit.stas_code === '330') {
                              return;
                            }
                            
                            const agg = aggregates[node.unit_id] || { leadership_positions_count: 0, execution_positions_count: 0 };
                            totalLeadership += agg.leadership_positions_count;
                            totalExecution += agg.execution_positions_count;

                            // Count by type
                            if (node.unit.unit_type === 'director_general') dgCount += agg.leadership_positions_count;
                            else if (node.unit.unit_type === 'directie') directorCount += agg.leadership_positions_count;
                            else if (node.unit.unit_type === 'serviciu') serviceCount += agg.leadership_positions_count;
                            else if (node.unit.unit_type === 'inspectorat') inspectorCount += agg.leadership_positions_count;
                          });

                          const totalPosts = totalLeadership + totalExecution;

                          return (
                            <>
                              <div className="font-bold mb-1">TOTAL POSTURI: {totalPosts}</div>
                              <div className="mb-0.5">Funcții de conducere: {totalLeadership}</div>
                              <div className="ml-2">- Director general: {dgCount}</div>
                              <div className="ml-2">- Director: {directorCount}</div>
                              <div className="ml-2">- Inspector șef: {inspectorCount}</div>
                              <div className="ml-2">- Șef serviciu: {serviceCount}</div>
                              <div className="mt-0.5">Posturi de execuție: {totalExecution}</div>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </foreignObject>
                </g>
                
                {/* Resize handles for legend */}
                {!isReadOnly && (
                  <>
                    {/* Corner handle - resize both width and height */}
                    <path
                      d={`M ${(draggedFixedElement === 'legend' && tempPosition ? tempPosition.x : fixedElements.legend.x) + (resizingFixedElement === 'legend' && tempWidth ? tempWidth : fixedElements.legend.width) - 10} ${(draggedFixedElement === 'legend' && tempPosition ? tempPosition.y : fixedElements.legend.y) + (resizingFixedElement === 'legend' && tempHeight ? tempHeight : fixedElements.legend.height)} 
                           L ${(draggedFixedElement === 'legend' && tempPosition ? tempPosition.x : fixedElements.legend.x) + (resizingFixedElement === 'legend' && tempWidth ? tempWidth : fixedElements.legend.width)} ${(draggedFixedElement === 'legend' && tempPosition ? tempPosition.y : fixedElements.legend.y) + (resizingFixedElement === 'legend' && tempHeight ? tempHeight : fixedElements.legend.height)} 
                           L ${(draggedFixedElement === 'legend' && tempPosition ? tempPosition.x : fixedElements.legend.x) + (resizingFixedElement === 'legend' && tempWidth ? tempWidth : fixedElements.legend.width)} ${(draggedFixedElement === 'legend' && tempPosition ? tempPosition.y : fixedElements.legend.y) + (resizingFixedElement === 'legend' && tempHeight ? tempHeight : fixedElements.legend.height) - 10} Z`}
                      fill="#9ca3af"
                      stroke="none"
                      style={{ cursor: 'nwse-resize' }}
                      onMouseDown={(e) => handleFixedElementResizeMouseDown(e, 'legend')}
                    />
                  </>
                )}
              </g>

              {/* Director - draggable and resizable box */}
              <g>
                <g
                  onMouseDown={(e) => handleFixedElementMouseDown(e, 'director')}
                  style={{ cursor: isReadOnly ? 'default' : 'move' }}
                >
                  <rect
                    x={draggedFixedElement === 'director' && tempPosition ? tempPosition.x : fixedElements.director.x}
                    y={draggedFixedElement === 'director' && tempPosition ? tempPosition.y : fixedElements.director.y}
                    width={resizingFixedElement === 'director' && tempWidth ? tempWidth : fixedElements.director.width}
                    height={resizingFixedElement === 'director' && tempHeight ? tempHeight : fixedElements.director.height}
                    fill="white"
                    stroke={draggedFixedElement === 'director' || resizingFixedElement === 'director' ? '#3b82f6' : '#d1d5db'}
                    strokeWidth="2"
                  />
                  <text
                    x={(draggedFixedElement === 'director' && tempPosition ? tempPosition.x : fixedElements.director.x) + (resizingFixedElement === 'director' && tempWidth ? tempWidth : fixedElements.director.width) / 2}
                    y={(draggedFixedElement === 'director' && tempPosition ? tempPosition.y : fixedElements.director.y) + (resizingFixedElement === 'director' && tempHeight ? tempHeight : fixedElements.director.height) / 3}
                    fontSize={getDynamicFontSize('director', 14)}
                    fontWeight="bold"
                    textAnchor="middle"
                    fill="#000000"
                    style={{ pointerEvents: 'none' }}
                  >
                    {directorGeneralUnit?.director_title || 'DIRECTOR GENERAL'}
                  </text>
                  <text
                    x={(draggedFixedElement === 'director' && tempPosition ? tempPosition.x : fixedElements.director.x) + (resizingFixedElement === 'director' && tempWidth ? tempWidth : fixedElements.director.width) / 2}
                    y={(draggedFixedElement === 'director' && tempPosition ? tempPosition.y : fixedElements.director.y) + 2 * (resizingFixedElement === 'director' && tempHeight ? tempHeight : fixedElements.director.height) / 3}
                    fontSize={getDynamicFontSize('director', 14)}
                    fontWeight="bold"
                    textAnchor="middle"
                    fill="#000000"
                    style={{ pointerEvents: 'none' }}
                  >
                    {directorGeneralUnit?.director_name || 'Petru BOGDAN'}
                  </text>
                </g>
                
                {/* Resize handle for director */}
                {!isReadOnly && (
                  <path
                    d={`M ${(draggedFixedElement === 'director' && tempPosition ? tempPosition.x : fixedElements.director.x) + (resizingFixedElement === 'director' && tempWidth ? tempWidth : fixedElements.director.width) - 10} ${(draggedFixedElement === 'director' && tempPosition ? tempPosition.y : fixedElements.director.y) + (resizingFixedElement === 'director' && tempHeight ? tempHeight : fixedElements.director.height)} 
                         L ${(draggedFixedElement === 'director' && tempPosition ? tempPosition.x : fixedElements.director.x) + (resizingFixedElement === 'director' && tempWidth ? tempWidth : fixedElements.director.width)} ${(draggedFixedElement === 'director' && tempPosition ? tempPosition.y : fixedElements.director.y) + (resizingFixedElement === 'director' && tempHeight ? tempHeight : fixedElements.director.height)} 
                         L ${(draggedFixedElement === 'director' && tempPosition ? tempPosition.x : fixedElements.director.x) + (resizingFixedElement === 'director' && tempWidth ? tempWidth : fixedElements.director.width)} ${(draggedFixedElement === 'director' && tempPosition ? tempPosition.y : fixedElements.director.y) + (resizingFixedElement === 'director' && tempHeight ? tempHeight : fixedElements.director.height) - 10} Z`}
                    fill="#9ca3af"
                    stroke="none"
                    style={{ cursor: 'nwse-resize' }}
                    onMouseDown={(e) => handleFixedElementResizeMouseDown(e, 'director')}
                  />
                )}
              </g>

              {/* Header 1 - draggable and resizable */}
              <g>
                <g
                  onMouseDown={(e) => handleFixedElementMouseDown(e, 'header1')}
                  style={{ cursor: isReadOnly ? 'default' : 'move' }}
                >
                  <rect
                    x={draggedFixedElement === 'header1' && tempPosition ? tempPosition.x : fixedElements.header1.x}
                    y={draggedFixedElement === 'header1' && tempPosition ? tempPosition.y : fixedElements.header1.y}
                    width={resizingFixedElement === 'header1' && tempWidth ? tempWidth : fixedElements.header1.width}
                    height={resizingFixedElement === 'header1' && tempHeight ? tempHeight : fixedElements.header1.height}
                    fill="transparent"
                    stroke={draggedFixedElement === 'header1' || resizingFixedElement === 'header1' ? '#3b82f6' : 'transparent'}
                    strokeWidth="2"
                  />
                  <text
                    x={(draggedFixedElement === 'header1' && tempPosition ? tempPosition.x : fixedElements.header1.x) + (resizingFixedElement === 'header1' && tempWidth ? tempWidth : fixedElements.header1.width) / 2}
                    y={(draggedFixedElement === 'header1' && tempPosition ? tempPosition.y : fixedElements.header1.y) + (resizingFixedElement === 'header1' && tempHeight ? tempHeight : fixedElements.header1.height) / 2 + 4}
                    fontSize={getDynamicFontSize('header1', 14)}
                    fontWeight="bold"
                    textAnchor="middle"
                    fill="#000000"
                    style={{ pointerEvents: 'none' }}
                  >
                    AUTORITATEA DE SIGURANȚĂ FEROVIARĂ ROMÂNĂ - ASFR
                  </text>
                </g>
                
                {/* Resize handle for header1 */}
                {!isReadOnly && (
                  <path
                    d={`M ${(draggedFixedElement === 'header1' && tempPosition ? tempPosition.x : fixedElements.header1.x) + (resizingFixedElement === 'header1' && tempWidth ? tempWidth : fixedElements.header1.width) - 10} ${(draggedFixedElement === 'header1' && tempPosition ? tempPosition.y : fixedElements.header1.y) + (resizingFixedElement === 'header1' && tempHeight ? tempHeight : fixedElements.header1.height)} 
                         L ${(draggedFixedElement === 'header1' && tempPosition ? tempPosition.x : fixedElements.header1.x) + (resizingFixedElement === 'header1' && tempWidth ? tempWidth : fixedElements.header1.width)} ${(draggedFixedElement === 'header1' && tempPosition ? tempPosition.y : fixedElements.header1.y) + (resizingFixedElement === 'header1' && tempHeight ? tempHeight : fixedElements.header1.height)} 
                         L ${(draggedFixedElement === 'header1' && tempPosition ? tempPosition.x : fixedElements.header1.x) + (resizingFixedElement === 'header1' && tempWidth ? tempWidth : fixedElements.header1.width)} ${(draggedFixedElement === 'header1' && tempPosition ? tempPosition.y : fixedElements.header1.y) + (resizingFixedElement === 'header1' && tempHeight ? tempHeight : fixedElements.header1.height) - 10} Z`}
                    fill="#9ca3af"
                    stroke="none"
                    style={{ cursor: 'nwse-resize' }}
                    onMouseDown={(e) => handleFixedElementResizeMouseDown(e, 'header1')}
                  />
                )}
              </g>
              
              {/* Header 2 - draggable, resizable and editable title */}
              <g>
                <g
                  onMouseDown={(e) => handleFixedElementMouseDown(e, 'header2')}
                  style={{ cursor: isReadOnly ? 'default' : 'move' }}
                >
                  <rect
                    x={draggedFixedElement === 'header2' && tempPosition ? tempPosition.x : fixedElements.header2.x}
                    y={draggedFixedElement === 'header2' && tempPosition ? tempPosition.y : fixedElements.header2.y}
                    width={resizingFixedElement === 'header2' && tempWidth ? tempWidth : fixedElements.header2.width}
                    height={resizingFixedElement === 'header2' && tempHeight ? tempHeight : fixedElements.header2.height}
                    fill="transparent"
                    stroke={draggedFixedElement === 'header2' || resizingFixedElement === 'header2' ? '#3b82f6' : 'transparent'}
                    strokeWidth="2"
                  />
                  {!isReadOnly && (
                    <rect
                      x={(draggedFixedElement === 'header2' && tempPosition ? tempPosition.x : fixedElements.header2.x)}
                      y={(draggedFixedElement === 'header2' && tempPosition ? tempPosition.y : fixedElements.header2.y)}
                      width={resizingFixedElement === 'header2' && tempWidth ? tempWidth : fixedElements.header2.width}
                      height={resizingFixedElement === 'header2' && tempHeight ? tempHeight : fixedElements.header2.height}
                      fill="transparent"
                      className="hover:fill-gray-100"
                      style={{ cursor: 'pointer', pointerEvents: 'all' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsEditingTitle(true);
                      }}
                    />
                  )}
                  <text
                    x={(draggedFixedElement === 'header2' && tempPosition ? tempPosition.x : fixedElements.header2.x) + (resizingFixedElement === 'header2' && tempWidth ? tempWidth : fixedElements.header2.width) / 2}
                    y={(draggedFixedElement === 'header2' && tempPosition ? tempPosition.y : fixedElements.header2.y) + (resizingFixedElement === 'header2' && tempHeight ? tempHeight : fixedElements.header2.height) / 2 + 4}
                    fontSize={getDynamicFontSize('header2', 14)}
                    fontWeight="bold"
                    textAnchor="middle"
                    fill="#000000"
                    style={{ 
                      opacity: isEditingTitle ? 0 : 1,
                      pointerEvents: 'none'
                    }}
                  >
                    {editableTitle}
                  </text>
                  {!isReadOnly && !isEditingTitle && (
                    <title>Click pentru a edita</title>
                  )}
                </g>
                
                {/* Resize handle for header2 */}
                {!isReadOnly && (
                  <path
                    d={`M ${(draggedFixedElement === 'header2' && tempPosition ? tempPosition.x : fixedElements.header2.x) + (resizingFixedElement === 'header2' && tempWidth ? tempWidth : fixedElements.header2.width) - 10} ${(draggedFixedElement === 'header2' && tempPosition ? tempPosition.y : fixedElements.header2.y) + (resizingFixedElement === 'header2' && tempHeight ? tempHeight : fixedElements.header2.height)} 
                         L ${(draggedFixedElement === 'header2' && tempPosition ? tempPosition.x : fixedElements.header2.x) + (resizingFixedElement === 'header2' && tempWidth ? tempWidth : fixedElements.header2.width)} ${(draggedFixedElement === 'header2' && tempPosition ? tempPosition.y : fixedElements.header2.y) + (resizingFixedElement === 'header2' && tempHeight ? tempHeight : fixedElements.header2.height)} 
                         L ${(draggedFixedElement === 'header2' && tempPosition ? tempPosition.x : fixedElements.header2.x) + (resizingFixedElement === 'header2' && tempWidth ? tempWidth : fixedElements.header2.width)} ${(draggedFixedElement === 'header2' && tempPosition ? tempPosition.y : fixedElements.header2.y) + (resizingFixedElement === 'header2' && tempHeight ? tempHeight : fixedElements.header2.height) - 10} Z`}
                    fill="#9ca3af"
                    stroke="none"
                    style={{ cursor: 'nwse-resize' }}
                    onMouseDown={(e) => handleFixedElementResizeMouseDown(e, 'header2')}
                  />
                )}
              </g>
            
            {/* Custom Legend - draggable and resizable box with 3 columns */}
            {fixedElements.customLegend && (
            <g>
              <g
                onMouseDown={(e) => handleFixedElementMouseDown(e, 'customLegend')}
                style={{ cursor: isReadOnly ? 'default' : 'move' }}
              >
                {/* Main box */}
                <rect
                  x={draggedFixedElement === 'customLegend' && tempPosition ? tempPosition.x : fixedElements.customLegend.x}
                  y={draggedFixedElement === 'customLegend' && tempPosition ? tempPosition.y : fixedElements.customLegend.y}
                  width={resizingFixedElement === 'customLegend' && tempWidth ? tempWidth : fixedElements.customLegend.width}
                  height={resizingFixedElement === 'customLegend' && tempHeight ? tempHeight : fixedElements.customLegend.height}
                  fill="white"
                  stroke={draggedFixedElement === 'customLegend' || resizingFixedElement === 'customLegend' ? '#3b82f6' : '#1f2937'}
                  strokeWidth="2"
                />
                
                {/* Header row */}
                <rect
                  x={draggedFixedElement === 'customLegend' && tempPosition ? tempPosition.x : fixedElements.customLegend.x}
                  y={draggedFixedElement === 'customLegend' && tempPosition ? tempPosition.y : fixedElements.customLegend.y}
                  width={resizingFixedElement === 'customLegend' && tempWidth ? tempWidth : fixedElements.customLegend.width}
                  height={(resizingFixedElement === 'customLegend' && tempHeight ? tempHeight : fixedElements.customLegend.height) * 0.15}
                  fill="white"
                  stroke="#1f2937"
                  strokeWidth="2"
                  style={{ pointerEvents: 'none' }}
                />
                <text
                  x={(draggedFixedElement === 'customLegend' && tempPosition ? tempPosition.x : fixedElements.customLegend.x) + (resizingFixedElement === 'customLegend' && tempWidth ? tempWidth : fixedElements.customLegend.width) / 2}
                  y={(draggedFixedElement === 'customLegend' && tempPosition ? tempPosition.y : fixedElements.customLegend.y) + (resizingFixedElement === 'customLegend' && tempHeight ? tempHeight : fixedElements.customLegend.height) * 0.075 + 5}
                  fontSize={getDynamicFontSize('customLegend', 18)}
                  fontWeight="bold"
                  textAnchor="middle"
                  fill="#000000"
                  style={{ pointerEvents: 'none' }}
                >
                  Legendă
                </text>
                
                {/* Column 1 */}
                <line
                  x1={(draggedFixedElement === 'customLegend' && tempPosition ? tempPosition.x : fixedElements.customLegend.x) + (resizingFixedElement === 'customLegend' && tempWidth ? tempWidth : fixedElements.customLegend.width) / 3}
                  y1={(draggedFixedElement === 'customLegend' && tempPosition ? tempPosition.y : fixedElements.customLegend.y) + (resizingFixedElement === 'customLegend' && tempHeight ? tempHeight : fixedElements.customLegend.height) * 0.15}
                  x2={(draggedFixedElement === 'customLegend' && tempPosition ? tempPosition.x : fixedElements.customLegend.x) + (resizingFixedElement === 'customLegend' && tempWidth ? tempWidth : fixedElements.customLegend.width) / 3}
                  y2={(draggedFixedElement === 'customLegend' && tempPosition ? tempPosition.y : fixedElements.customLegend.y) + (resizingFixedElement === 'customLegend' && tempHeight ? tempHeight : fixedElements.customLegend.height)}
                  stroke="#1f2937"
                  strokeWidth="2"
                  style={{ pointerEvents: 'none' }}
                />
                <text
                  x={(draggedFixedElement === 'customLegend' && tempPosition ? tempPosition.x : fixedElements.customLegend.x) + (resizingFixedElement === 'customLegend' && tempWidth ? tempWidth : fixedElements.customLegend.width) / 6}
                  y={(draggedFixedElement === 'customLegend' && tempPosition ? tempPosition.y : fixedElements.customLegend.y) + (resizingFixedElement === 'customLegend' && tempHeight ? tempHeight : fixedElements.customLegend.height) * 0.15 + ((resizingFixedElement === 'customLegend' && tempHeight ? tempHeight : fixedElements.customLegend.height) * 0.85) / 2}
                  fontSize={getDynamicFontSize('customLegend', 16)}
                  fontWeight="bold"
                  textAnchor="middle"
                  fill="#000000"
                  style={{ pointerEvents: 'none' }}
                  transform={`rotate(-90, ${(draggedFixedElement === 'customLegend' && tempPosition ? tempPosition.x : fixedElements.customLegend.x) + (resizingFixedElement === 'customLegend' && tempWidth ? tempWidth : fixedElements.customLegend.width) / 6}, ${(draggedFixedElement === 'customLegend' && tempPosition ? tempPosition.y : fixedElements.customLegend.y) + (resizingFixedElement === 'customLegend' && tempHeight ? tempHeight : fixedElements.customLegend.height) * 0.15 + ((resizingFixedElement === 'customLegend' && tempHeight ? tempHeight : fixedElements.customLegend.height) * 0.85) / 2})`}
                >
                  {legendUnit?.legend_col1 || 'NUMĂR POSTURI CONDUCERE'}
                </text>
                
                {/* Column 2 */}
                <line
                  x1={(draggedFixedElement === 'customLegend' && tempPosition ? tempPosition.x : fixedElements.customLegend.x) + 2 * (resizingFixedElement === 'customLegend' && tempWidth ? tempWidth : fixedElements.customLegend.width) / 3}
                  y1={(draggedFixedElement === 'customLegend' && tempPosition ? tempPosition.y : fixedElements.customLegend.y) + (resizingFixedElement === 'customLegend' && tempHeight ? tempHeight : fixedElements.customLegend.height) * 0.15}
                  x2={(draggedFixedElement === 'customLegend' && tempPosition ? tempPosition.x : fixedElements.customLegend.x) + 2 * (resizingFixedElement === 'customLegend' && tempWidth ? tempWidth : fixedElements.customLegend.width) / 3}
                  y2={(draggedFixedElement === 'customLegend' && tempPosition ? tempPosition.y : fixedElements.customLegend.y) + (resizingFixedElement === 'customLegend' && tempHeight ? tempHeight : fixedElements.customLegend.height)}
                  stroke="#1f2937"
                  strokeWidth="2"
                  style={{ pointerEvents: 'none' }}
                />
                <text
                  x={(draggedFixedElement === 'customLegend' && tempPosition ? tempPosition.x : fixedElements.customLegend.x) + (resizingFixedElement === 'customLegend' && tempWidth ? tempWidth : fixedElements.customLegend.width) / 2}
                  y={(draggedFixedElement === 'customLegend' && tempPosition ? tempPosition.y : fixedElements.customLegend.y) + (resizingFixedElement === 'customLegend' && tempHeight ? tempHeight : fixedElements.customLegend.height) * 0.15 + ((resizingFixedElement === 'customLegend' && tempHeight ? tempHeight : fixedElements.customLegend.height) * 0.85) / 2}
                  fontSize={getDynamicFontSize('customLegend', 15)}
                  fontWeight="bold"
                  textAnchor="middle"
                  fill="#000000"
                  style={{ pointerEvents: 'none' }}
                  transform={`rotate(-90, ${(draggedFixedElement === 'customLegend' && tempPosition ? tempPosition.x : fixedElements.customLegend.x) + (resizingFixedElement === 'customLegend' && tempWidth ? tempWidth : fixedElements.customLegend.width) / 2}, ${(draggedFixedElement === 'customLegend' && tempPosition ? tempPosition.y : fixedElements.customLegend.y) + (resizingFixedElement === 'customLegend' && tempHeight ? tempHeight : fixedElements.customLegend.height) * 0.15 + ((resizingFixedElement === 'customLegend' && tempHeight ? tempHeight : fixedElements.customLegend.height) * 0.85) / 2})`}
                >
                  {legendUnit?.legend_col2 || 'TOTAL POSTURI INCLUS CONDUCERE'}
                </text>
                
                {/* Column 3 */}
                <text
                  x={(draggedFixedElement === 'customLegend' && tempPosition ? tempPosition.x : fixedElements.customLegend.x) + 5 * (resizingFixedElement === 'customLegend' && tempWidth ? tempWidth : fixedElements.customLegend.width) / 6}
                  y={(draggedFixedElement === 'customLegend' && tempPosition ? tempPosition.y : fixedElements.customLegend.y) + (resizingFixedElement === 'customLegend' && tempHeight ? tempHeight : fixedElements.customLegend.height) * 0.15 + ((resizingFixedElement === 'customLegend' && tempHeight ? tempHeight : fixedElements.customLegend.height) * 0.85) / 2}
                  fontSize={getDynamicFontSize('customLegend', 16)}
                  fontWeight="bold"
                  textAnchor="middle"
                  fill="#000000"
                  style={{ pointerEvents: 'none' }}
                  transform={`rotate(-90, ${(draggedFixedElement === 'customLegend' && tempPosition ? tempPosition.x : fixedElements.customLegend.x) + 5 * (resizingFixedElement === 'customLegend' && tempWidth ? tempWidth : fixedElements.customLegend.width) / 6}, ${(draggedFixedElement === 'customLegend' && tempPosition ? tempPosition.y : fixedElements.customLegend.y) + (resizingFixedElement === 'customLegend' && tempHeight ? tempHeight : fixedElements.customLegend.height) * 0.15 + ((resizingFixedElement === 'customLegend' && tempHeight ? tempHeight : fixedElements.customLegend.height) * 0.85) / 2})`}
                >
                  {legendUnit?.legend_col3 || 'DENUMIRE STRUCTURĂ'}
                </text>
              </g>
              
              {/* Resize handle for customLegend */}
              {!isReadOnly && (
                <path
                  d={`M ${(draggedFixedElement === 'customLegend' && tempPosition ? tempPosition.x : fixedElements.customLegend.x) + (resizingFixedElement === 'customLegend' && tempWidth ? tempWidth : fixedElements.customLegend.width) - 10} ${(draggedFixedElement === 'customLegend' && tempPosition ? tempPosition.y : fixedElements.customLegend.y) + (resizingFixedElement === 'customLegend' && tempHeight ? tempHeight : fixedElements.customLegend.height)} 
                       L ${(draggedFixedElement === 'customLegend' && tempPosition ? tempPosition.x : fixedElements.customLegend.x) + (resizingFixedElement === 'customLegend' && tempWidth ? tempWidth : fixedElements.customLegend.width)} ${(draggedFixedElement === 'customLegend' && tempPosition ? tempPosition.y : fixedElements.customLegend.y) + (resizingFixedElement === 'customLegend' && tempHeight ? tempHeight : fixedElements.customLegend.height)} 
                       L ${(draggedFixedElement === 'customLegend' && tempPosition ? tempPosition.x : fixedElements.customLegend.x) + (resizingFixedElement === 'customLegend' && tempWidth ? tempWidth : fixedElements.customLegend.width)} ${(draggedFixedElement === 'customLegend' && tempPosition ? tempPosition.y : fixedElements.customLegend.y) + (resizingFixedElement === 'customLegend' && tempHeight ? tempHeight : fixedElements.customLegend.height) - 10} Z`}
                  fill="#9ca3af"
                  stroke="none"
                  style={{ cursor: 'nwse-resize' }}
                  onMouseDown={(e) => handleFixedElementResizeMouseDown(e, 'customLegend')}
                />
              )}
            </g>
            )}
            
            {/* Consiliu - draggable and resizable box */}
            <g>
              <g
                onMouseDown={(e) => handleFixedElementMouseDown(e, 'consiliu')}
                style={{ cursor: isReadOnly ? 'default' : 'move' }}
              >
                <rect
                  x={draggedFixedElement === 'consiliu' && tempPosition ? tempPosition.x : fixedElements.consiliu.x}
                  y={draggedFixedElement === 'consiliu' && tempPosition ? tempPosition.y : fixedElements.consiliu.y}
                  width={resizingFixedElement === 'consiliu' && tempWidth ? tempWidth : fixedElements.consiliu.width}
                  height={resizingFixedElement === 'consiliu' && tempHeight ? tempHeight : fixedElements.consiliu.height}
                  fill="white"
                  stroke={draggedFixedElement === 'consiliu' || resizingFixedElement === 'consiliu' ? '#3b82f6' : '#1f2937'}
                  strokeWidth="2"
                />
                <text
                  x={(draggedFixedElement === 'consiliu' && tempPosition ? tempPosition.x : fixedElements.consiliu.x) + (resizingFixedElement === 'consiliu' && tempWidth ? tempWidth : fixedElements.consiliu.width) / 2}
                  y={(draggedFixedElement === 'consiliu' && tempPosition ? tempPosition.y : fixedElements.consiliu.y) + (resizingFixedElement === 'consiliu' && tempHeight ? tempHeight : fixedElements.consiliu.height) / 2 + 8}
                  fontSize={getDynamicFontSize('consiliu', 28)}
                  fontWeight="bold"
                  textAnchor="middle"
                  fill="#000000"
                  style={{ pointerEvents: 'none' }}
                >
                  {consiliuUnit?.name || 'CONSILIUL DE CONDUCERE'}
                </text>
              </g>
              
              {/* Resize handle for consiliu */}
              {!isReadOnly && (
                <path
                  d={`M ${(draggedFixedElement === 'consiliu' && tempPosition ? tempPosition.x : fixedElements.consiliu.x) + (resizingFixedElement === 'consiliu' && tempWidth ? tempWidth : fixedElements.consiliu.width) - 10} ${(draggedFixedElement === 'consiliu' && tempPosition ? tempPosition.y : fixedElements.consiliu.y) + (resizingFixedElement === 'consiliu' && tempHeight ? tempHeight : fixedElements.consiliu.height)} 
                       L ${(draggedFixedElement === 'consiliu' && tempPosition ? tempPosition.x : fixedElements.consiliu.x) + (resizingFixedElement === 'consiliu' && tempWidth ? tempWidth : fixedElements.consiliu.width)} ${(draggedFixedElement === 'consiliu' && tempPosition ? tempPosition.y : fixedElements.consiliu.y) + (resizingFixedElement === 'consiliu' && tempHeight ? tempHeight : fixedElements.consiliu.height)} 
                       L ${(draggedFixedElement === 'consiliu' && tempPosition ? tempPosition.x : fixedElements.consiliu.x) + (resizingFixedElement === 'consiliu' && tempWidth ? tempWidth : fixedElements.consiliu.width)} ${(draggedFixedElement === 'consiliu' && tempPosition ? tempPosition.y : fixedElements.consiliu.y) + (resizingFixedElement === 'consiliu' && tempHeight ? tempHeight : fixedElements.consiliu.height) - 10} Z`}
                  fill="#9ca3af"
                  stroke="none"
                  style={{ cursor: 'nwse-resize' }}
                  onMouseDown={(e) => handleFixedElementResizeMouseDown(e, 'consiliu')}
                />
              )}
            </g>
            
            {/* Draw edges (including consiliu to DG) */}
            {drawEdges()}
            
            {/* Draw nodes */}
            {layoutData.layout.map(node => {
              const agg = aggregates[node.unit_id] || {
                leadership_positions_count: 0,
                execution_positions_count: 0,
                total_positions: 0
              };
              
              const colors = getUnitColor(node.unit);
              
              // Use temp position if this node is being dragged
              const isBeingDragged = draggedNode?.unit_id === node.unit_id;
              const x = isBeingDragged && tempPosition ? tempPosition.x : node.x;
              const y = isBeingDragged && tempPosition ? tempPosition.y : node.y;
              
              // Use temp dimensions if this node is being resized
              const isBeingResized = resizingNode?.unit_id === node.unit_id;
              const height = isBeingResized && tempHeight ? tempHeight : node.height;
              const width = isBeingResized && tempWidth ? tempWidth : node.width;
              
              // Check if rotated
              const isRotated = node.unit.is_rotated;
              
              // Calculate font size dynamically based on available space
              const text_length = node.unit.name.length;
              const availableWidth = width - 91; // 75px left strip + 16px padding
              const availableHeight = height - 12;
              
              let fontSize = '6px';
              let lineHeight = '1.1';
              
              // Estimate how many characters fit per line at different font sizes
              const estimateLines = (fontPx, charWidth) => {
                const charsPerLine = Math.floor(availableWidth / charWidth);
                return Math.ceil(text_length / charsPerLine);
              };
              
              // Define font sizes with their properties - extended range for smaller sizes
              const fontSizes = [
                { size: 16, charWidth: 8, lineHeight: 1.3 },
                { size: 14, charWidth: 7, lineHeight: 1.3 },
                { size: 13, charWidth: 6.5, lineHeight: 1.2 },
                { size: 12, charWidth: 6, lineHeight: 1.2 },
                { size: 11, charWidth: 5.5, lineHeight: 1.2 },
                { size: 10, charWidth: 5, lineHeight: 1.2 },
                { size: 9, charWidth: 4.5, lineHeight: 1.15 },
                { size: 8, charWidth: 4, lineHeight: 1.1 },
                { size: 7, charWidth: 3.5, lineHeight: 1.1 },
                { size: 6, charWidth: 3, lineHeight: 1.1 },
                { size: 5, charWidth: 2.5, lineHeight: 1.05 },
                { size: 4, charWidth: 2, lineHeight: 1.05 }
              ];
              
              // Find the largest font where text fits in available space
              let selectedFont = fontSizes[fontSizes.length - 1]; // Default to smallest
              
              for (const font of fontSizes) {
                const lines = estimateLines(font.size, font.charWidth);
                const totalHeight = lines * font.size * font.lineHeight;
                
                // Check if this font size fits
                if (totalHeight <= availableHeight) {
                  selectedFont = font;
                  break; // Found the largest that fits
                }
              }
              
              fontSize = `${selectedFont.size}px`;
              lineHeight = `${selectedFont.lineHeight}`;
              
              // Highlight if this is the nearest parent
              const isNearestParent = nearestParent?.unit_id === node.unit_id;
              
              // Check if this node is selected
              const isSelected = selectedNode?.unit_id === node.unit_id;
              
              // Calculate rotation transform
              const rotationTransform = isRotated 
                ? `rotate(-90, ${x + width / 2}, ${y + height / 2})` 
                : '';
              
              return (
                <g
                  key={node.unit_id}
                  data-unit-id={node.unit_id}
                  transform={rotationTransform}
                  onMouseDown={(e) => {
                    if (!isReadOnly) {
                      handleMouseDown(e, node);
                    }
                  }}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    if (!isReadOnly && onSelectUnit) {
                      onSelectUnit(node.unit);
                    }
                  }}
                  style={{ 
                    cursor: !isReadOnly ? 'move' : 'default',
                    pointerEvents: 'all'
                  }}
                >
                  {/* Main box - colored or white background with thick black border */}
                  <rect
                    x={x}
                    y={y}
                    width={width}
                    height={height}
                    fill={colors.stripOnly ? "#ffffff" : colors.bg}
                    stroke={isSelected ? "#3b82f6" : (isNearestParent ? "#10b981" : "#000000")}
                    strokeWidth={isSelected ? "5" : (isNearestParent ? "4" : "3")}
                    rx="6"
                    opacity={isBeingDragged ? 0.7 : 1}
                  />
                  
                  {/* Left colored strip - vertical with 3 columns of numbers (only if stripOnly) */}
                  {colors.stripOnly && (
                    <rect
                      x={x + 1.5}
                      y={y + 1.5}
                      width="73.5"
                      height={height - 3}
                      fill={colors.bg}
                      stroke="none"
                      rx="4.5"
                      opacity={isBeingDragged ? 0.7 : 1}
                    />
                  )}
                  
                  {/* Vertical line between code and leadership count - full height */}
                  <line
                    x1={x + 25}
                    y1={y}
                    x2={x + 25}
                    y2={y + height}
                    stroke="#000000"
                    strokeWidth="1"
                  />
                  
                  {/* Vertical line between leadership and execution count - full height */}
                  <line
                    x1={x + 50}
                    y1={y}
                    x2={x + 50}
                    y2={y + height}
                    stroke="#000000"
                    strokeWidth="1"
                  />
                  
                  {/* Vertical line between numbers and name - full height */}
                  <line
                    x1={x + 75}
                    y1={y}
                    x2={x + 75}
                    y2={y + height}
                    stroke="#000000"
                    strokeWidth="1"
                  />
                  
                  {/* Code - first column in left strip (narrower, vertical text centered) */}
                  <text
                    x={x + 12.5}
                    y={y + height / 2}
                    fontSize="11"
                    fontWeight="bold"
                    fill="#000000"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    transform={`rotate(-90, ${x + 12.5}, ${y + height / 2})`}
                  >
                    {node.unit.stas_code}
                  </text>
                  
                  {/* Leadership count - second column in left strip */}
                  <text
                    x={x + 37.5}
                    y={y + height / 2 + 4}
                    fontSize="12"
                    fontWeight="bold"
                    fill="#000000"
                    textAnchor="middle"
                  >
                    {agg.leadership_positions_count}
                  </text>
                  
                  {/* Execution count - third column in left strip */}
                  <text
                    x={x + 62.5}
                    y={y + height / 2 + 4}
                    fontSize="12"
                    fontWeight="bold"
                    fill="#000000"
                    textAnchor="middle"
                  >
                    {agg.recursive_total_subordinates > agg.total_positions
                      ? agg.recursive_total_subordinates - agg.leadership_positions_count
                      : agg.execution_positions_count}
                  </text>
                  
                  {/* Unit name - dynamic font size based on available space */}
                  <foreignObject
                    x={x + 79}
                    y={y + 3}
                    width={width - 83}
                    height={height - 6}
                  >
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textAlign: 'center',
                        fontSize: fontSize,
                        fontWeight: '600',
                        color: '#000000',
                        lineHeight: lineHeight,
                        padding: '6px 8px',
                        wordWrap: 'break-word',
                        overflow: 'hidden',
                        hyphens: 'auto',
                        opacity: isBeingDragged ? 0.7 : 1
                      }}
                    >
                      {node.unit.name}
                    </div>
                  </foreignObject>
                  
                  {/* Resize handle - bottom right corner as colored triangle */}
                  {!isReadOnly && (
                    <g
                      onMouseDown={(e) => handleResizeMouseDown(e, node)}
                      style={{ cursor: 'nwse-resize' }}
                    >
                      {/* Colored triangle matching unit color */}
                      <path
                        d={`M ${x + width - 20} ${y + height} L ${x + width} ${y + height} L ${x + width} ${y + height - 20} Z`}
                        fill={colors.bg}
                        opacity="0.8"
                        style={{ pointerEvents: 'all' }}
                      />
                      {/* Small grip lines for visual feedback */}
                      <line
                        x1={x + width - 6}
                        y1={y + height - 3}
                        x2={x + width - 3}
                        y2={y + height - 6}
                        stroke="#ffffff"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                      <line
                        x1={x + width - 10}
                        y1={y + height - 3}
                        x2={x + width - 3}
                        y2={y + height - 10}
                        stroke="#ffffff"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </g>
                  )}
                </g>
              );
            })}
          </svg>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeterministicOrgChart;
