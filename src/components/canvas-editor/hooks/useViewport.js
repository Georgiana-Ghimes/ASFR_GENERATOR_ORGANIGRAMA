import { useState, useCallback } from 'react';
import { ZOOM_MIN, ZOOM_MAX, ZOOM_STEP, calculateBoundingBox, DEFAULT_UNIT_WIDTH, DEFAULT_UNIT_HEIGHT } from '../utils/canvasUtils';

/**
 * Custom hook for managing canvas viewport state (pan, zoom).
 * Provides handlers for mouse/wheel interactions and actions for programmatic control.
 */
export function useViewport() {
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [zoom, setZoom] = useState(1.0);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // --- Handlers ---

  const onWheel = useCallback((e) => {
    e.preventDefault();
    const direction = e.deltaY < 0 ? 1 : -1;
    const newZoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, zoom + direction * ZOOM_STEP));

    if (newZoom === zoom) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Point on canvas under cursor before zoom
    const canvasX = (mouseX - panX) / zoom;
    const canvasY = (mouseY - panY) / zoom;

    // After zoom change, adjust pan to keep same canvas point under cursor
    const newPanX = mouseX - canvasX * newZoom;
    const newPanY = mouseY - canvasY * newZoom;

    setZoom(newZoom);
    setPanX(newPanX);
    setPanY(newPanY);
  }, [zoom, panX, panY]);

  const onMouseDown = useCallback((e) => {
    if (e.button !== 0) return;
    setIsPanning(true);
    setPanStart({ x: e.clientX - panX, y: e.clientY - panY });
  }, [panX, panY]);

  const onMouseMove = useCallback((e) => {
    if (!isPanning) return;
    setPanX(e.clientX - panStart.x);
    setPanY(e.clientY - panStart.y);
  }, [isPanning, panStart]);

  const onMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  // --- Actions ---

  const resetZoom = useCallback(() => {
    setZoom(1.0);
    setPanX(0);
    setPanY(0);
  }, []);

  const fitToContent = useCallback((units, containerWidth = 800, containerHeight = 600) => {
    if (!units || units.length === 0) {
      resetZoom();
      return;
    }

    const bbox = calculateBoundingBox(units);
    const contentWidth = bbox.maxX - bbox.minX;
    const contentHeight = bbox.maxY - bbox.minY;

    if (contentWidth === 0 && contentHeight === 0) {
      resetZoom();
      return;
    }

    const padding = 40;
    const availableWidth = containerWidth - padding * 2;
    const availableHeight = containerHeight - padding * 2;

    const scaleX = availableWidth / contentWidth;
    const scaleY = availableHeight / contentHeight;
    const newZoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.min(scaleX, scaleY)));

    const newPanX = padding + (availableWidth - contentWidth * newZoom) / 2 - bbox.minX * newZoom;
    const newPanY = padding + (availableHeight - contentHeight * newZoom) / 2 - bbox.minY * newZoom;

    setZoom(newZoom);
    setPanX(newPanX);
    setPanY(newPanY);
  }, [resetZoom]);

  const zoomIn = useCallback(() => {
    setZoom((prev) => Math.min(ZOOM_MAX, prev + ZOOM_STEP));
  }, []);

  const zoomOut = useCallback(() => {
    setZoom((prev) => Math.max(ZOOM_MIN, prev - ZOOM_STEP));
  }, []);

  const panTo = useCallback((x, y) => {
    setPanX(x);
    setPanY(y);
  }, []);

  // --- Computed ---

  const svgTransform = `translate(${panX}, ${panY}) scale(${zoom})`;

  return {
    viewport: { panX, panY, zoom },
    handlers: { onWheel, onMouseDown, onMouseMove, onMouseUp },
    actions: { resetZoom, fitToContent, zoomIn, zoomOut, panTo },
    svgTransform,
    isPanning,
  };
}
