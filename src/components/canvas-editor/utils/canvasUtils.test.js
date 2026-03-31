import { describe, it, expect } from 'vitest';
import {
  GRID_SIZE,
  DEFAULT_UNIT_WIDTH,
  DEFAULT_UNIT_HEIGHT,
  MIN_UNIT_WIDTH,
  MIN_UNIT_HEIGHT,
  ZOOM_MIN,
  ZOOM_MAX,
  ZOOM_STEP,
  SMART_GUIDE_THRESHOLD,
  CONNECTOR_VERTICAL_GAP,
  NEW_UNIT_VERTICAL_OFFSET,
  NEW_UNIT_HORIZONTAL_GAP,
  snapToGrid,
  screenToCanvas,
  canvasToScreen,
  calculateBoundingBox,
  calculateNewUnitPosition,
  isFullColor,
  calculateBoxHeight,
  detectOverlap,
} from './canvasUtils';

describe('Constants', () => {
  it('exports correct constant values', () => {
    expect(GRID_SIZE).toBe(20);
    expect(DEFAULT_UNIT_WIDTH).toBe(320);
    expect(DEFAULT_UNIT_HEIGHT).toBe(45);
    expect(MIN_UNIT_WIDTH).toBe(100);
    expect(MIN_UNIT_HEIGHT).toBe(40);
    expect(ZOOM_MIN).toBe(0.1);
    expect(ZOOM_MAX).toBe(3.0);
    expect(ZOOM_STEP).toBe(0.1);
    expect(SMART_GUIDE_THRESHOLD).toBe(5);
    expect(CONNECTOR_VERTICAL_GAP).toBe(20);
    expect(NEW_UNIT_VERTICAL_OFFSET).toBe(100);
    expect(NEW_UNIT_HORIZONTAL_GAP).toBe(40);
  });
});

describe('snapToGrid', () => {
  it('snaps exact multiples to themselves', () => {
    expect(snapToGrid(0)).toBe(0);
    expect(snapToGrid(20)).toBe(20);
    expect(snapToGrid(100)).toBe(100);
  });

  it('snaps values to nearest multiple of 20', () => {
    expect(snapToGrid(9)).toBe(0);
    expect(snapToGrid(11)).toBe(20);
    expect(snapToGrid(25)).toBe(20);
    expect(snapToGrid(35)).toBe(40);
  });

  it('handles negative values', () => {
    expect(snapToGrid(-10)).toBe(-0);
    expect(snapToGrid(-15)).toBe(-20);
    expect(snapToGrid(-30)).toBe(-20);
  });
});

describe('screenToCanvas', () => {
  it('converts with identity viewport', () => {
    const vp = { panX: 0, panY: 0, zoom: 1 };
    expect(screenToCanvas(100, 200, vp)).toEqual({ x: 100, y: 200 });
  });

  it('accounts for pan offset', () => {
    const vp = { panX: 50, panY: 100, zoom: 1 };
    expect(screenToCanvas(150, 300, vp)).toEqual({ x: 100, y: 200 });
  });

  it('accounts for zoom', () => {
    const vp = { panX: 0, panY: 0, zoom: 2 };
    expect(screenToCanvas(200, 400, vp)).toEqual({ x: 100, y: 200 });
  });

  it('accounts for both pan and zoom', () => {
    const vp = { panX: 50, panY: 100, zoom: 2 };
    expect(screenToCanvas(250, 500, vp)).toEqual({ x: 100, y: 200 });
  });
});

describe('canvasToScreen', () => {
  it('converts with identity viewport', () => {
    const vp = { panX: 0, panY: 0, zoom: 1 };
    expect(canvasToScreen(100, 200, vp)).toEqual({ x: 100, y: 200 });
  });

  it('accounts for pan and zoom', () => {
    const vp = { panX: 50, panY: 100, zoom: 2 };
    expect(canvasToScreen(100, 200, vp)).toEqual({ x: 250, y: 500 });
  });
});

describe('screenToCanvas / canvasToScreen round-trip', () => {
  it('round-trips correctly', () => {
    const vp = { panX: 30, panY: -50, zoom: 1.5 };
    const screen = canvasToScreen(100, 200, vp);
    const canvas = screenToCanvas(screen.x, screen.y, vp);
    expect(canvas.x).toBeCloseTo(100, 5);
    expect(canvas.y).toBeCloseTo(200, 5);
  });
});

describe('calculateBoundingBox', () => {
  it('returns zeros for empty array', () => {
    expect(calculateBoundingBox([])).toEqual({ minX: 0, minY: 0, maxX: 0, maxY: 0 });
  });

  it('returns zeros for null/undefined', () => {
    expect(calculateBoundingBox(null)).toEqual({ minX: 0, minY: 0, maxX: 0, maxY: 0 });
  });

  it('calculates bounding box for single unit', () => {
    const units = [{ custom_x: 10, custom_y: 20, custom_width: 100, custom_height: 50 }];
    expect(calculateBoundingBox(units)).toEqual({ minX: 10, minY: 20, maxX: 110, maxY: 70 });
  });

  it('uses default dimensions when not specified', () => {
    const units = [{ custom_x: 0, custom_y: 0 }];
    const bb = calculateBoundingBox(units);
    expect(bb.maxX).toBe(DEFAULT_UNIT_WIDTH);
    expect(bb.maxY).toBe(DEFAULT_UNIT_HEIGHT);
  });

  it('calculates bounding box for multiple units', () => {
    const units = [
      { custom_x: 10, custom_y: 20, custom_width: 100, custom_height: 50 },
      { custom_x: 200, custom_y: 300, custom_width: 80, custom_height: 40 },
    ];
    expect(calculateBoundingBox(units)).toEqual({ minX: 10, minY: 20, maxX: 280, maxY: 340 });
  });
});

describe('calculateNewUnitPosition', () => {
  it('places under parent when no siblings', () => {
    const parent = { custom_x: 100, custom_y: 50, custom_width: 320, custom_height: 45 };
    const viewport = { panX: 0, panY: 0, zoom: 1, width: 1000, height: 800 };
    const pos = calculateNewUnitPosition(parent, [], viewport);
    expect(pos.x).toBe(100 + 320 / 2 - DEFAULT_UNIT_WIDTH / 2);
    expect(pos.y).toBe(50 + 45 + NEW_UNIT_VERTICAL_OFFSET);
  });

  it('places to the right of last sibling', () => {
    const parent = { custom_x: 100, custom_y: 50, custom_width: 320, custom_height: 45 };
    const siblings = [
      { custom_x: 50, custom_y: 200, custom_width: 200, custom_height: 45 },
      { custom_x: 300, custom_y: 200, custom_width: 200, custom_height: 45 },
    ];
    const viewport = { panX: 0, panY: 0, zoom: 1, width: 1000, height: 800 };
    const pos = calculateNewUnitPosition(parent, siblings, viewport);
    expect(pos.x).toBe(300 + 200 + NEW_UNIT_HORIZONTAL_GAP);
    expect(pos.y).toBe(50 + 45 + NEW_UNIT_VERTICAL_OFFSET);
  });

  it('places at viewport center when no parent', () => {
    const viewport = { panX: 0, panY: 0, zoom: 1, width: 1000, height: 800 };
    const pos = calculateNewUnitPosition(null, [], viewport);
    expect(pos.x).toBe(500 - DEFAULT_UNIT_WIDTH / 2);
    expect(pos.y).toBe(400 - DEFAULT_UNIT_HEIGHT / 2);
  });
});

describe('isFullColor', () => {
  it('returns true for colors ending with -full', () => {
    expect(isFullColor('#86C67C-full')).toBe(true);
    expect(isFullColor('red-full')).toBe(true);
  });

  it('returns false for regular colors', () => {
    expect(isFullColor('#86C67C')).toBe(false);
    expect(isFullColor('red')).toBe(false);
  });

  it('returns false for null/undefined/empty', () => {
    expect(isFullColor(null)).toBe(false);
    expect(isFullColor(undefined)).toBe(false);
    expect(isFullColor('')).toBe(false);
  });
});

describe('calculateBoxHeight', () => {
  it('returns 40 for short names (<=35 chars)', () => {
    expect(calculateBoxHeight('Short name')).toBe(40);
  });

  it('returns 40 for medium names (<=50 chars)', () => {
    expect(calculateBoxHeight('A medium length name that is about forty chars!!')).toBe(40);
  });

  it('returns 60 for long names (>50 chars)', () => {
    expect(calculateBoxHeight('A very long unit name that definitely exceeds fifty characters in total length')).toBe(60);
  });

  it('returns DEFAULT_UNIT_HEIGHT for null/undefined', () => {
    expect(calculateBoxHeight(null)).toBe(DEFAULT_UNIT_HEIGHT);
    expect(calculateBoxHeight(undefined)).toBe(DEFAULT_UNIT_HEIGHT);
  });
});

describe('detectOverlap', () => {
  it('detects overlapping rectangles', () => {
    const a = { x: 0, y: 0, width: 100, height: 100 };
    const b = { x: 50, y: 50, width: 100, height: 100 };
    expect(detectOverlap(a, b)).toBe(true);
  });

  it('returns false for non-overlapping rectangles', () => {
    const a = { x: 0, y: 0, width: 100, height: 100 };
    const b = { x: 200, y: 200, width: 100, height: 100 };
    expect(detectOverlap(a, b)).toBe(false);
  });

  it('returns false for touching edges (no area overlap)', () => {
    const a = { x: 0, y: 0, width: 100, height: 100 };
    const b = { x: 100, y: 0, width: 100, height: 100 };
    expect(detectOverlap(a, b)).toBe(false);
  });

  it('detects containment as overlap', () => {
    const a = { x: 0, y: 0, width: 200, height: 200 };
    const b = { x: 50, y: 50, width: 50, height: 50 };
    expect(detectOverlap(a, b)).toBe(true);
  });

  it('returns false for null inputs', () => {
    expect(detectOverlap(null, { x: 0, y: 0, width: 10, height: 10 })).toBe(false);
    expect(detectOverlap({ x: 0, y: 0, width: 10, height: 10 }, null)).toBe(false);
  });
});
