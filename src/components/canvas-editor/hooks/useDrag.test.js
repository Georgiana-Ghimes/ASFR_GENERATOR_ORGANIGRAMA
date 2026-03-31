import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDrag } from './useDrag';

function makeUnit(overrides = {}) {
  return {
    id: 'unit-1',
    custom_x: 100,
    custom_y: 200,
    custom_width: 320,
    custom_height: 45,
    ...overrides,
  };
}

const defaultViewport = { panX: 0, panY: 0, zoom: 1 };

function makeSvgMouseEvent(clientX, clientY) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.getBoundingClientRect = () => ({
    left: 0, top: 0, right: 800, bottom: 600, width: 800, height: 600, x: 0, y: 0,
    toJSON() {},
  });

  const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  svg.appendChild(g);

  return {
    clientX,
    clientY,
    stopPropagation: vi.fn(),
    currentTarget: g,
    getBoundingClientRect: undefined,
  };
}

function makeCanvasMouseEvent(clientX, clientY) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.getBoundingClientRect = () => ({
    left: 0, top: 0, right: 800, bottom: 600, width: 800, height: 600, x: 0, y: 0,
    toJSON() {},
  });

  return {
    clientX,
    clientY,
    currentTarget: svg,
  };
}

describe('useDrag', () => {
  it('returns initial state with no drag active', () => {
    const { result } = renderHook(() =>
      useDrag({ units: [], viewport: defaultViewport, isReadOnly: false, onDragEnd: vi.fn() })
    );

    expect(result.current.dragState.isDragging).toBe(false);
    expect(result.current.dragState.unitId).toBeNull();
  });

  it('does nothing on mousedown when isReadOnly is true', () => {
    const unit = makeUnit();
    const { result } = renderHook(() =>
      useDrag({ units: [unit], viewport: defaultViewport, isReadOnly: true, onDragEnd: vi.fn() })
    );

    const e = makeSvgMouseEvent(150, 220);
    act(() => {
      result.current.handlers.onNodeMouseDown(e, unit);
    });

    expect(result.current.dragState.isDragging).toBe(false);
    expect(e.stopPropagation).not.toHaveBeenCalled();
  });

  it('starts dragging on mousedown when not read-only', () => {
    const unit = makeUnit();
    const { result } = renderHook(() =>
      useDrag({ units: [unit], viewport: defaultViewport, isReadOnly: false, onDragEnd: vi.fn() })
    );

    const e = makeSvgMouseEvent(150, 220);
    act(() => {
      result.current.handlers.onNodeMouseDown(e, unit);
    });

    expect(result.current.dragState.isDragging).toBe(true);
    expect(result.current.dragState.unitId).toBe('unit-1');
    expect(result.current.dragState.startPos).toEqual({ x: 100, y: 200 });
    expect(e.stopPropagation).toHaveBeenCalled();
  });

  it('updates currentPos on mousemove with snap to grid', () => {
    const unit = makeUnit({ custom_x: 0, custom_y: 0 });
    const { result } = renderHook(() =>
      useDrag({ units: [unit], viewport: defaultViewport, isReadOnly: false, onDragEnd: vi.fn() })
    );

    // Start drag at unit origin
    act(() => {
      result.current.handlers.onNodeMouseDown(makeSvgMouseEvent(0, 0), unit);
    });

    // Move to (33, 47) — should snap to (40, 40) since offset is (0,0)
    act(() => {
      result.current.handlers.onCanvasMouseMove(makeCanvasMouseEvent(33, 47));
    });

    expect(result.current.dragState.currentPos).toEqual({ x: 40, y: 40 });
  });

  it('getNodePosition returns currentPos for dragged unit', () => {
    const unit = makeUnit();
    const { result } = renderHook(() =>
      useDrag({ units: [unit], viewport: defaultViewport, isReadOnly: false, onDragEnd: vi.fn() })
    );

    // Before drag, returns DB position
    expect(result.current.getNodePosition('unit-1')).toEqual({ x: 100, y: 200 });

    // Start drag
    act(() => {
      result.current.handlers.onNodeMouseDown(makeSvgMouseEvent(100, 200), unit);
    });

    // During drag, returns currentPos (startPos initially)
    expect(result.current.getNodePosition('unit-1')).toEqual({ x: 100, y: 200 });
  });

  it('getNodePosition returns DB position for non-dragged units', () => {
    const unit1 = makeUnit({ id: 'unit-1', custom_x: 100, custom_y: 200 });
    const unit2 = makeUnit({ id: 'unit-2', custom_x: 300, custom_y: 400 });
    const { result } = renderHook(() =>
      useDrag({ units: [unit1, unit2], viewport: defaultViewport, isReadOnly: false, onDragEnd: vi.fn() })
    );

    expect(result.current.getNodePosition('unit-2')).toEqual({ x: 300, y: 400 });
  });

  it('getNodePosition returns {0,0} for unknown unit', () => {
    const { result } = renderHook(() =>
      useDrag({ units: [], viewport: defaultViewport, isReadOnly: false, onDragEnd: vi.fn() })
    );

    expect(result.current.getNodePosition('unknown')).toEqual({ x: 0, y: 0 });
  });

  it('calls onDragEnd on mouseup and resets drag state', async () => {
    const unit = makeUnit({ custom_x: 0, custom_y: 0 });
    const onDragEnd = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      useDrag({ units: [unit], viewport: defaultViewport, isReadOnly: false, onDragEnd })
    );

    act(() => {
      result.current.handlers.onNodeMouseDown(makeSvgMouseEvent(0, 0), unit);
    });

    act(() => {
      result.current.handlers.onCanvasMouseMove(makeCanvasMouseEvent(60, 80));
    });

    await act(async () => {
      await result.current.handlers.onCanvasMouseUp();
    });

    expect(onDragEnd).toHaveBeenCalledWith('unit-1', 60, 80);
    expect(result.current.dragState.isDragging).toBe(false);
    expect(result.current.dragState.unitId).toBeNull();
  });

  it('does nothing on mousemove when not dragging', () => {
    const { result } = renderHook(() =>
      useDrag({ units: [], viewport: defaultViewport, isReadOnly: false, onDragEnd: vi.fn() })
    );

    // Should not throw
    act(() => {
      result.current.handlers.onCanvasMouseMove(makeCanvasMouseEvent(100, 100));
    });

    expect(result.current.dragState.isDragging).toBe(false);
  });

  it('does nothing on mouseup when not dragging', async () => {
    const onDragEnd = vi.fn();
    const { result } = renderHook(() =>
      useDrag({ units: [], viewport: defaultViewport, isReadOnly: false, onDragEnd })
    );

    await act(async () => {
      await result.current.handlers.onCanvasMouseUp();
    });

    expect(onDragEnd).not.toHaveBeenCalled();
  });

  it('handles unit with null custom_x/custom_y', () => {
    const unit = makeUnit({ custom_x: null, custom_y: null });
    const { result } = renderHook(() =>
      useDrag({ units: [unit], viewport: defaultViewport, isReadOnly: false, onDragEnd: vi.fn() })
    );

    expect(result.current.getNodePosition('unit-1')).toEqual({ x: 0, y: 0 });
  });
});
