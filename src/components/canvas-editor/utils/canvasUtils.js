// Layout constants
export const GRID_SIZE = 20;
export const DEFAULT_UNIT_WIDTH = 320;
export const DEFAULT_UNIT_HEIGHT = 45;
export const MIN_UNIT_WIDTH = 100;
export const MIN_UNIT_HEIGHT = 40;
export const ZOOM_MIN = 0.1;
export const ZOOM_MAX = 3.0;
export const ZOOM_STEP = 0.1;
export const SMART_GUIDE_THRESHOLD = 5;
export const CONNECTOR_VERTICAL_GAP = 20;
export const NEW_UNIT_VERTICAL_OFFSET = 100;
export const NEW_UNIT_HORIZONTAL_GAP = 40;

/**
 * Snap a value to the nearest multiple of GRID_SIZE (20px).
 */
export function snapToGrid(value) {
  return Math.round(value / GRID_SIZE) * GRID_SIZE;
}

/**
 * Convert screen coordinates to canvas coordinates accounting for pan/zoom.
 */
export function screenToCanvas(screenX, screenY, viewport) {
  return {
    x: (screenX - viewport.panX) / viewport.zoom,
    y: (screenY - viewport.panY) / viewport.zoom,
  };
}

/**
 * Convert canvas coordinates to screen coordinates.
 */
export function canvasToScreen(canvasX, canvasY, viewport) {
  return {
    x: canvasX * viewport.zoom + viewport.panX,
    y: canvasY * viewport.zoom + viewport.panY,
  };
}

/**
 * Calculate the bounding box of all units.
 * Returns { minX, minY, maxX, maxY }.
 */
export function calculateBoundingBox(units) {
  if (!units || units.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const unit of units) {
    const x = unit.custom_x ?? 0;
    const y = unit.custom_y ?? 0;
    const w = unit.custom_width ?? DEFAULT_UNIT_WIDTH;
    const h = unit.custom_height ?? DEFAULT_UNIT_HEIGHT;

    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x + w > maxX) maxX = x + w;
    if (y + h > maxY) maxY = y + h;
  }

  return { minX, minY, maxX, maxY };
}

/**
 * Calculate position for a new unit.
 * - If parentUnit exists and no siblings: centered under parent, offset 100px vertical.
 * - If parentUnit exists with siblings: to the right of the last sibling + 40px gap.
 * - If no parentUnit: center of the current viewport.
 */
export function calculateNewUnitPosition(parentUnit, siblingUnits, viewport) {
  if (parentUnit) {
    const parentX = parentUnit.custom_x ?? 0;
    const parentY = parentUnit.custom_y ?? 0;
    const parentW = parentUnit.custom_width ?? DEFAULT_UNIT_WIDTH;
    const parentH = parentUnit.custom_height ?? DEFAULT_UNIT_HEIGHT;

    if (!siblingUnits || siblingUnits.length === 0) {
      // Centered under parent, offset vertical
      return {
        x: parentX + parentW / 2 - DEFAULT_UNIT_WIDTH / 2,
        y: parentY + parentH + NEW_UNIT_VERTICAL_OFFSET,
      };
    }

    // To the right of the last sibling
    let maxRight = -Infinity;
    for (const sibling of siblingUnits) {
      const sx = sibling.custom_x ?? 0;
      const sw = sibling.custom_width ?? DEFAULT_UNIT_WIDTH;
      const right = sx + sw;
      if (right > maxRight) maxRight = right;
    }

    return {
      x: maxRight + NEW_UNIT_HORIZONTAL_GAP,
      y: parentY + parentH + NEW_UNIT_VERTICAL_OFFSET,
    };
  }

  // No parent — center of viewport
  const centerCanvas = screenToCanvas(
    viewport.width / 2,
    viewport.height / 2,
    viewport
  );
  return {
    x: centerCanvas.x - DEFAULT_UNIT_WIDTH / 2,
    y: centerCanvas.y - DEFAULT_UNIT_HEIGHT / 2,
  };
}

/**
 * Returns true if the color string ends with "-full".
 */
export function isFullColor(color) {
  if (!color || typeof color !== 'string') return false;
  return color.endsWith('-full');
}

/**
 * Calculate box height based on text length.
 * <=35 chars → 40, <=50 → 40, else 60.
 */
export function calculateBoxHeight(unitName) {
  if (!unitName) return DEFAULT_UNIT_HEIGHT;
  const len = unitName.length;
  if (len <= 50) return 40;
  return 60;
}

/**
 * Detect if two rectangles {x, y, width, height} overlap
 * (have non-zero intersection area).
 */
export function detectOverlap(rectA, rectB) {
  if (!rectA || !rectB) return false;

  const aLeft = rectA.x;
  const aRight = rectA.x + rectA.width;
  const aTop = rectA.y;
  const aBottom = rectA.y + rectA.height;

  const bLeft = rectB.x;
  const bRight = rectB.x + rectB.width;
  const bTop = rectB.y;
  const bBottom = rectB.y + rectB.height;

  // Overlap exists when there's positive intersection on both axes
  return aLeft < bRight && aRight > bLeft && aTop < bBottom && aBottom > bTop;
}
