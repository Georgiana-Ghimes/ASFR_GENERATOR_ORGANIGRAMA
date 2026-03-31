import { useState, useCallback, useRef } from 'react';
import { snapToGrid, screenToCanvas, DEFAULT_UNIT_WIDTH, DEFAULT_UNIT_HEIGHT } from '../utils/canvasUtils';

/**
 * Custom hook for managing drag & drop of org units on the canvas.
 * Completely disabled when isReadOnly is true.
 *
 * @param {Object} params
 * @param {Array} params.units - Array of OrgUnit objects
 * @param {Object} params.viewport - { panX, panY, zoom }
 * @param {boolean} params.isReadOnly - Whether editing is disabled
 * @param {Function} params.onDragEnd - async function(unitId, newX, newY) called when drag finishes
 */
export function useDrag({ units, viewport, isReadOnly, onDragEnd }) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragUnitId, setDragUnitId] = useState(null);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [currentPos, setCurrentPos] = useState({ x: 0, y: 0 });
  const offsetRef = useRef({ x: 0, y: 0 });

  const onNodeMouseDown = useCallback((e, unit) => {
    if (isReadOnly) return;
    e.stopPropagation();

    const rect = e.currentTarget.closest('svg').getBoundingClientRect();
    const canvasCoords = screenToCanvas(
      e.clientX - rect.left,
      e.clientY - rect.top,
      viewport
    );

    const unitX = unit.custom_x ?? 0;
    const unitY = unit.custom_y ?? 0;

    offsetRef.current = {
      x: canvasCoords.x - unitX,
      y: canvasCoords.y - unitY,
    };

    setDragUnitId(unit.id);
    setStartPos({ x: unitX, y: unitY });
    setCurrentPos({ x: unitX, y: unitY });
    setIsDragging(true);
  }, [isReadOnly, viewport]);

  const onCanvasMouseMove = useCallback((e) => {
    if (!isDragging) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const canvasCoords = screenToCanvas(
      e.clientX - rect.left,
      e.clientY - rect.top,
      viewport
    );

    const rawX = canvasCoords.x - offsetRef.current.x;
    const rawY = canvasCoords.y - offsetRef.current.y;

    setCurrentPos({
      x: snapToGrid(rawX),
      y: snapToGrid(rawY),
    });
  }, [isDragging, viewport]);

  const onCanvasMouseUp = useCallback(async () => {
    if (!isDragging) return;

    const unitId = dragUnitId;
    const savedStartPos = { ...startPos };
    const finalPos = { ...currentPos };

    // Reset drag state immediately
    setIsDragging(false);
    setDragUnitId(null);

    try {
      await onDragEnd(unitId, finalPos.x, finalPos.y);
    } catch {
      // Rollback to original position on error
      setCurrentPos(savedStartPos);
    }
  }, [isDragging, dragUnitId, startPos, currentPos, onDragEnd]);

  const getNodePosition = useCallback((unitId) => {
    if (isDragging && unitId === dragUnitId) {
      return { x: currentPos.x, y: currentPos.y };
    }
    const unit = units.find((u) => u.id === unitId);
    if (unit) {
      return { x: unit.custom_x ?? 0, y: unit.custom_y ?? 0 };
    }
    return { x: 0, y: 0 };
  }, [isDragging, dragUnitId, currentPos, units]);

  return {
    dragState: {
      isDragging,
      unitId: dragUnitId,
      startPos,
      currentPos,
    },
    handlers: {
      onNodeMouseDown,
      onCanvasMouseMove,
      onCanvasMouseUp,
    },
    getNodePosition,
  };
}
