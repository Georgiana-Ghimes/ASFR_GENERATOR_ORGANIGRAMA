import React, { useCallback, useRef, useState } from 'react';
import { DEFAULT_UNIT_WIDTH, DEFAULT_UNIT_HEIGHT } from './utils/canvasUtils';

const MINIMAP_PADDING = 50;

/**
 * Minimap — renders a miniature overview of the canvas in the bottom-right corner.
 */
/** @param {Record<string, any>} props */
function MinimapInner({
  units,
  positions,
  viewport,
  canvasSize,
  onNavigate,
  size = { width: 200, height: 150 },
}) {
  const containerRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const unitList = units || [];
  const posMap = positions || {};

  // Calculate bounding box from positions map (accounts for live drag positions)
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const unit of unitList) {
    const p = posMap[unit.id];
    const ux = p ? p.x : (unit.custom_x ?? 0);
    const uy = p ? p.y : (unit.custom_y ?? 0);
    const uw = p ? p.width : (unit.custom_width ?? DEFAULT_UNIT_WIDTH);
    const uh = p ? p.height : (unit.custom_height ?? DEFAULT_UNIT_HEIGHT);
    if (ux < minX) minX = ux;
    if (uy < minY) minY = uy;
    if (ux + uw > maxX) maxX = ux + uw;
    if (uy + uh > maxY) maxY = uy + uh;
  }
  if (!isFinite(minX)) { minX = 0; minY = 0; maxX = 0; maxY = 0; }

  const paddedMinX = minX - MINIMAP_PADDING;
  const paddedMinY = minY - MINIMAP_PADDING;
  const paddedMaxX = maxX + MINIMAP_PADDING;
  const paddedMaxY = maxY + MINIMAP_PADDING;

  const contentWidth = paddedMaxX - paddedMinX || 1;
  const contentHeight = paddedMaxY - paddedMinY || 1;

  const scale = Math.min(size.width / contentWidth, size.height / contentHeight);

  const canvasToMinimap = useCallback((cx, cy) => ({
    x: (cx - paddedMinX) * scale,
    y: (cy - paddedMinY) * scale,
  }), [paddedMinX, paddedMinY, scale]);

  const minimapToCanvas = useCallback((mx, my) => ({
    x: mx / scale + paddedMinX,
    y: my / scale + paddedMinY,
  }), [paddedMinX, paddedMinY, scale]);

  // Visible area
  const visibleX = -viewport.panX / viewport.zoom;
  const visibleY = -viewport.panY / viewport.zoom;
  const visibleW = canvasSize.width / viewport.zoom;
  const visibleH = canvasSize.height / viewport.zoom;
  const vpMinimap = canvasToMinimap(visibleX, visibleY);
  const vpWidth = visibleW * scale;
  const vpHeight = visibleH * scale;

  const navigateToMinimapPoint = useCallback((e) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const canvasPoint = minimapToCanvas(mx, my);
    const newPanX = -(canvasPoint.x * viewport.zoom - canvasSize.width / 2);
    const newPanY = -(canvasPoint.y * viewport.zoom - canvasSize.height / 2);
    onNavigate(newPanX, newPanY);
  }, [minimapToCanvas, viewport.zoom, canvasSize, onNavigate]);

  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    navigateToMinimapPoint(e);
  }, [navigateToMinimapPoint]);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return;
    e.preventDefault();
    navigateToMinimapPoint(e);
  }, [isDragging, navigateToMinimapPoint]);

  const handleMouseUp = useCallback(() => { setIsDragging(false); }, []);
  const handleMouseLeave = useCallback(() => { setIsDragging(false); }, []);

  if (unitList.length === 0) return null;

  return (
    <div
      ref={containerRef}
      data-testid="minimap"
      style={{
        position: 'absolute',
        bottom: 16,
        right: 16,
        width: size.width,
        height: size.height,
        backgroundColor: 'white',
        border: '1px solid #d1d5db',
        borderRadius: 8,
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        overflow: 'hidden',
        cursor: 'crosshair',
        zIndex: 20,
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
    >
      <svg width={size.width} height={size.height} viewBox={`0 0 ${size.width} ${size.height}`}>
        {unitList.map((unit) => {
          const p = posMap[unit.id];
          const ux = p ? p.x : (unit.custom_x ?? 0);
          const uy = p ? p.y : (unit.custom_y ?? 0);
          const uw = p ? p.width : (unit.custom_width ?? DEFAULT_UNIT_WIDTH);
          const uh = p ? p.height : (unit.custom_height ?? DEFAULT_UNIT_HEIGHT);

          const pos = canvasToMinimap(ux, uy);
          const w = Math.max(uw * scale, 1);
          const h = Math.max(uh * scale, 1);

          let fill = unit.color || '#94a3b8';
          if (typeof fill === 'string' && fill.endsWith('-full')) {
            fill = fill.slice(0, -5);
          }

          const isRotated = unit.is_rotated;
          const cx = pos.x + w / 2;
          const cy = pos.y + h / 2;

          return (
            <rect
              key={unit.id}
              x={pos.x}
              y={pos.y}
              width={w}
              height={h}
              fill={fill}
              stroke="#374151"
              strokeWidth={0.5}
              opacity={0.9}
              rx={0.5}
              transform={isRotated ? `rotate(-90, ${cx}, ${cy})` : undefined}
            />
          );
        })}

        <rect
          data-testid="minimap-viewport"
          x={vpMinimap.x}
          y={vpMinimap.y}
          width={vpWidth}
          height={vpHeight}
          fill="rgba(59, 130, 246, 0.15)"
          stroke="rgba(59, 130, 246, 0.7)"
          strokeWidth={1.5}
          rx={2}
        />
      </svg>
    </div>
  );
}

const Minimap = React.memo(MinimapInner);

export default Minimap;
