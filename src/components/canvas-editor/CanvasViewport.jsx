import React from 'react';
import UnitNode from './UnitNode';
import FixedNode from './FixedNode';
import ConnectorLayer from './ConnectorLayer';
import SmartGuides from './SmartGuides';
import { GRID_SIZE, DEFAULT_UNIT_WIDTH, DEFAULT_UNIT_HEIGHT } from './utils/canvasUtils';

/**
 * CanvasViewport — the main SVG element that renders the canvas with all visual layers.
 *
 * Layers (bottom to top):
 *   1. Background grid pattern
 *   2. ConnectorLayer (lowest z-index within canvas content)
 *   3. UnitNode-s
 *   4. FixedNode-s
 *   5. SmartGuides (highest z-index within canvas content)
 */

/** @param {Record<string, any>} props */
/** @param {any} ref */
function CanvasViewportInner(
  {
    units,
    fixedNodes,
    aggregatesMap,
    svgTransform,
    selectedUnitId,
    isReadOnly,
    positions,
    sizes,
    dragState,
    isPanning,
    onViewportMouseDown,
    onViewportMouseMove,
    onViewportMouseUp,
    onViewportWheel,
    onNodeMouseDown,
    onNodeContextMenu,
    onResizeHandleMouseDown,
    onFixedNodeMouseDown,
    onFixedNodeClick,
    onFixedResizeMouseDown,
    orgType,
  },
  ref
) {
  return (
    <svg
      ref={ref}
      width="100%"
      height="100%"
      style={{ cursor: isPanning ? 'grabbing' : 'default', userSelect: 'none' }}
      onMouseDown={onViewportMouseDown}
      onMouseMove={onViewportMouseMove}
      onMouseUp={onViewportMouseUp}
      onWheel={onViewportWheel}
    >
      {/* Background grid pattern */}
      <defs>
        <pattern
          id="grid"
          width={GRID_SIZE}
          height={GRID_SIZE}
          patternUnits="userSpaceOnUse"
          patternTransform={svgTransform}
        >
          <path
            d={`M ${GRID_SIZE} 0 L 0 0 0 ${GRID_SIZE}`}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="0.5"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" />

      {/* Transformed content group */}
      <g transform={svgTransform}>
        {/* Layer 1: Connectors (lowest z-index) */}
        <ConnectorLayer
          units={units}
          positions={positions}
          consiliuPosition={
            fixedNodes?.find(fn => fn.type === 'consiliu')?.position || null
          }
        />

        {/* Layer 2: Unit nodes */}
        {units.map((unit) => {
          const pos = positions[unit.id] || {
            x: unit.custom_x ?? 0,
            y: unit.custom_y ?? 0,
          };
          const size = sizes[unit.id] || {
            width: unit.custom_width ?? DEFAULT_UNIT_WIDTH,
            height: unit.custom_height ?? DEFAULT_UNIT_HEIGHT,
          };
          return (
            <UnitNode
              key={unit.id}
              unit={unit}
              aggregates={aggregatesMap?.[unit.id]}
              isSelected={selectedUnitId === unit.id}
              isDragging={dragState.isDragging && dragState.unitId === unit.id}
              isReadOnly={isReadOnly}
              position={pos}
              size={size}
              onMouseDown={onNodeMouseDown}
              onContextMenu={onNodeContextMenu}
              onResizeHandleMouseDown={onResizeHandleMouseDown}
              orgType={orgType}
            />
          );
        })}

        {/* Layer 3: Fixed nodes */}
        {fixedNodes.map((fn, i) => (
          // @ts-ignore - React.memo type inference limitation in JSX
          <FixedNode
            key={fn.type + '-' + i}
            type={fn.type}
            unit={fn.unit}
            position={fn.position}
            isReadOnly={isReadOnly}
            onMouseDown={(e) => onFixedNodeMouseDown(e, fn.type)}
            onClick={onFixedNodeClick}
            onResizeMouseDown={onFixedResizeMouseDown}
            units={fn.units}
            aggregatesMap={fn.aggregatesMap}
            orgType={orgType}
          />
        ))}

        {/* Layer 4: Smart guides (highest z-index within canvas) */}
        {dragState.isDragging && (
          // @ts-ignore - React.memo type inference limitation in JSX
          <SmartGuides
            draggedUnit={{
              id: dragState.unitId,
              ...positions[dragState.unitId],
            }}
            allUnits={units}
          />
        )}
      </g>
    </svg>
  );
}

const CanvasViewport = React.memo(React.forwardRef(CanvasViewportInner));
CanvasViewport.displayName = 'CanvasViewport';

export default CanvasViewport;
