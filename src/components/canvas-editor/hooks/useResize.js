import { useState, useCallback } from 'react';
import { MIN_UNIT_WIDTH, MIN_UNIT_HEIGHT, snapToGrid } from '../utils/canvasUtils';

/**
 * Custom hook for managing resize of org units on the canvas.
 * Completely disabled when isReadOnly is true.
 *
 * @param {Object} params
 * @param {boolean} params.isReadOnly - Whether editing is disabled
 * @param {Function} params.onResizeEnd - async function(unitId, newWidth, newHeight) called when resize finishes
 */
export function useResize({ isReadOnly, onResizeEnd }) {
  const [isResizing, setIsResizing] = useState(false);
  const [unitId, setUnitId] = useState(null);
  const [handle, setHandle] = useState(null);
  const [startSize, setStartSize] = useState({ width: 0, height: 0 });
  const [currentSize, setCurrentSize] = useState({ width: 0, height: 0 });
  const [resizeStartPos, setResizeStartPos] = useState({ x: 0, y: 0 });

  const onHandleMouseDown = useCallback((e, resizeUnitId, resizeHandle, currentWidth, currentHeight) => {
    if (isReadOnly) return;
    e.stopPropagation();

    const rect = e.currentTarget.closest('svg').getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    setUnitId(resizeUnitId);
    setHandle(resizeHandle);
    setStartSize({ width: currentWidth, height: currentHeight });
    setCurrentSize({ width: currentWidth, height: currentHeight });
    setResizeStartPos({ x: mouseX, y: mouseY });
    setIsResizing(true);
  }, [isReadOnly]);

  const onMouseMove = useCallback((e) => {
    if (!isResizing) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const deltaX = mouseX - resizeStartPos.x;
    const deltaY = mouseY - resizeStartPos.y;

    let newWidth = startSize.width;
    let newHeight = startSize.height;

    // Apply delta based on handle direction
    if (handle === 'e' || handle === 'se' || handle === 'ne') {
      newWidth = startSize.width + deltaX;
    }
    if (handle === 'w' || handle === 'sw' || handle === 'nw') {
      newWidth = startSize.width - deltaX;
    }
    if (handle === 's' || handle === 'se' || handle === 'sw') {
      newHeight = startSize.height + deltaY;
    }
    if (handle === 'n' || handle === 'ne' || handle === 'nw') {
      newHeight = startSize.height - deltaY;
    }

    // Clamp to minimum dimensions
    newWidth = Math.max(newWidth, MIN_UNIT_WIDTH);
    newHeight = Math.max(newHeight, MIN_UNIT_HEIGHT);

    // Snap to grid
    newWidth = snapToGrid(newWidth);
    newHeight = snapToGrid(newHeight);

    setCurrentSize({ width: newWidth, height: newHeight });
  }, [isResizing, handle, startSize, resizeStartPos]);

  const onMouseUp = useCallback(async () => {
    if (!isResizing) return;

    const savedUnitId = unitId;
    const finalSize = { ...currentSize };

    // Reset state immediately
    setIsResizing(false);
    setUnitId(null);
    setHandle(null);

    await onResizeEnd(savedUnitId, finalSize.width, finalSize.height);
  }, [isResizing, unitId, currentSize, onResizeEnd]);

  const getNodeSize = useCallback((nodeUnitId, defaultSize) => {
    if (isResizing && nodeUnitId === unitId) {
      return { width: currentSize.width, height: currentSize.height };
    }
    return defaultSize;
  }, [isResizing, unitId, currentSize]);

  return {
    resizeState: {
      isResizing,
      unitId,
      handle,
      startSize,
      currentSize,
    },
    handlers: {
      onHandleMouseDown,
      onMouseMove,
      onMouseUp,
    },
    getNodeSize,
  };
}
