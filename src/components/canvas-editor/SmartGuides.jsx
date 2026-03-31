import React from 'react';
import { SMART_GUIDE_THRESHOLD, DEFAULT_UNIT_WIDTH, DEFAULT_UNIT_HEIGHT } from './utils/canvasUtils';

/**
 * SmartGuides — SVG component that shows alignment guide lines during drag.
 *
 * Detects center-center and edge-edge alignment between the dragged unit
 * and all other units, rendering dashed guide lines when within threshold.
 */
/** @param {Record<string, any>} props */
function SmartGuidesInner({
  draggedUnit,
  allUnits,
  threshold = SMART_GUIDE_THRESHOLD,
}) {
  if (!draggedUnit) return null;

  const guides = [];
  const seen = new Set();

  const dX = draggedUnit.x;
  const dY = draggedUnit.y;
  const dW = draggedUnit.width;
  const dH = draggedUnit.height;

  const dCenterX = dX + dW / 2;
  const dCenterY = dY + dH / 2;
  const dTop = dY;
  const dBottom = dY + dH;
  const dLeft = dX;
  const dRight = dX + dW;

  for (const unit of allUnits) {
    if (unit.id === draggedUnit.id) continue;

    const oX = unit.custom_x ?? 0;
    const oY = unit.custom_y ?? 0;
    const oW = unit.custom_width ?? DEFAULT_UNIT_WIDTH;
    const oH = unit.custom_height ?? DEFAULT_UNIT_HEIGHT;

    const oCenterX = oX + oW / 2;
    const oCenterY = oY + oH / 2;
    const oTop = oY;
    const oBottom = oY + oH;
    const oLeft = oX;
    const oRight = oX + oW;

    // Horizontal alignment checks (shared Y value → horizontal line)
    const hChecks = [
      { dragVal: dCenterY, otherVal: oCenterY },
      { dragVal: dTop, otherVal: oTop },
      { dragVal: dBottom, otherVal: oBottom },
    ];

    for (const { dragVal, otherVal } of hChecks) {
      if (Math.abs(dragVal - otherVal) < threshold) {
        const key = `h:${otherVal}`;
        if (!seen.has(key)) {
          seen.add(key);
          guides.push({ type: 'horizontal', value: otherVal });
        }
      }
    }

    // Vertical alignment checks (shared X value → vertical line)
    const vChecks = [
      { dragVal: dCenterX, otherVal: oCenterX },
      { dragVal: dLeft, otherVal: oLeft },
      { dragVal: dRight, otherVal: oRight },
    ];

    for (const { dragVal, otherVal } of vChecks) {
      if (Math.abs(dragVal - otherVal) < threshold) {
        const key = `v:${otherVal}`;
        if (!seen.has(key)) {
          seen.add(key);
          guides.push({ type: 'vertical', value: otherVal });
        }
      }
    }
  }

  if (guides.length === 0) return null;

  return (
    <g className="smart-guides" data-testid="smart-guides">
      {guides.map((guide, i) =>
        guide.type === 'horizontal' ? (
          <line
            key={`h-${guide.value}-${i}`}
            x1={-99999}
            x2={99999}
            y1={guide.value}
            y2={guide.value}
            stroke="#2563eb"
            strokeWidth={0.5}
            strokeDasharray="4 2"
            opacity={0.6}
          />
        ) : (
          <line
            key={`v-${guide.value}-${i}`}
            x1={guide.value}
            x2={guide.value}
            y1={-99999}
            y2={99999}
            stroke="#2563eb"
            strokeWidth={0.5}
            strokeDasharray="4 2"
            opacity={0.6}
          />
        )
      )}
    </g>
  );
}

const SmartGuides = React.memo(SmartGuidesInner);

export default SmartGuides;
