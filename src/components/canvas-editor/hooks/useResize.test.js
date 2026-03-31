import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useResize } from './useResize';

function makeSvgMouseEvent(clientX, clientY) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.getBoundingClientRect = () => ({
    left: 0, top: 0, right: 800, bottom: 600, width: 800, height: 600, x: 0, y: 0,
    toJSON() {},
  });

  const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  svg.appendChild(rect);

  return {
    clientX,
    clientY,
    stopPropagation: vi.fn(),
    currentTarget: rect,
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

describe('useResize', () => {
  it('returns initial state with no resize active', () => {
    const { result } = renderHook(() =>
      useResize({ isReadOnly: false, onResizeEnd: vi.fn() })
    );

    expect(result.current.resizeState.isResizing).toBe(false);
    expect(result.current.resizeState.unitId).toBeNull();
    expect(result.current.resizeState.handle).toBeNull();
  });

  it('does nothing on handleMouseDown when isReadOnly is true', () => {
    const { result } = renderHook(() =>
      useResize({ isReadOnly: true, onResizeEnd: vi.fn() })
    );

    const e = makeSvgMouseEvent(200, 100);
    act(() => {
      result.current.handlers.onHandleMouseDown(e, 'unit-1', 'se', 320, 45);
    });

    expect(result.current.resizeState.isResizing).toBe(false);
    expect(e.stopPropagation).not.toHaveBeenCalled();
  });

  it('starts resizing on handleMouseDown when not read-only', () => {
    const { result } = renderHook(() =>
      useResize({ isReadOnly: false, onResizeEnd: vi.fn() })
    );

    const e = makeSvgMouseEvent(320, 45);
    act(() => {
      result.current.handlers.onHandleMouseDown(e, 'unit-1', 'se', 320, 45);
    });

    expect(result.current.resizeState.isResizing).toBe(true);
    expect(result.current.resizeState.unitId).toBe('unit-1');
    expect(result.current.resizeState.handle).toBe('se');
    expect(result.current.resizeState.startSize).toEqual({ width: 320, height: 45 });
    expect(result.current.resizeState.currentSize).toEqual({ width: 320, height: 45 });
    expect(e.stopPropagation).toHaveBeenCalled();
  });

  it('updates currentSize on mousemove with SE handle', () => {
    const { result } = renderHook(() =>
      useResize({ isReadOnly: false, onResizeEnd: vi.fn() })
    );

    // Start resize at (300, 100) with initial size 320x60
    act(() => {
      result.current.handlers.onHandleMouseDown(
        makeSvgMouseEvent(300, 100), 'unit-1', 'se', 320, 60
      );
    });

    // Move mouse to (360, 140) → delta (60, 40) → new size 380x100 → snapped 380x100
    act(() => {
      result.current.handlers.onMouseMove(makeCanvasMouseEvent(360, 140));
    });

    expect(result.current.resizeState.currentSize).toEqual({ width: 380, height: 100 });
  });

  it('updates currentSize on mousemove with E handle (width only)', () => {
    const { result } = renderHook(() =>
      useResize({ isReadOnly: false, onResizeEnd: vi.fn() })
    );

    act(() => {
      result.current.handlers.onHandleMouseDown(
        makeSvgMouseEvent(300, 100), 'unit-1', 'e', 320, 60
      );
    });

    // Move mouse right by 40px
    act(() => {
      result.current.handlers.onMouseMove(makeCanvasMouseEvent(340, 100));
    });

    // Width: 320 + 40 = 360, snapped to 360. Height unchanged: 60, snapped to 60
    expect(result.current.resizeState.currentSize).toEqual({ width: 360, height: 60 });
  });

  it('updates currentSize on mousemove with S handle (height only)', () => {
    const { result } = renderHook(() =>
      useResize({ isReadOnly: false, onResizeEnd: vi.fn() })
    );

    act(() => {
      result.current.handlers.onHandleMouseDown(
        makeSvgMouseEvent(200, 100), 'unit-1', 's', 320, 60
      );
    });

    // Move mouse down by 40px
    act(() => {
      result.current.handlers.onMouseMove(makeCanvasMouseEvent(200, 140));
    });

    // Width unchanged: 320, snapped 320. Height: 60 + 40 = 100, snapped 100
    expect(result.current.resizeState.currentSize).toEqual({ width: 320, height: 100 });
  });

  it('updates currentSize on mousemove with W handle (shrink width)', () => {
    const { result } = renderHook(() =>
      useResize({ isReadOnly: false, onResizeEnd: vi.fn() })
    );

    act(() => {
      result.current.handlers.onHandleMouseDown(
        makeSvgMouseEvent(100, 100), 'unit-1', 'w', 320, 60
      );
    });

    // Move mouse right by 20px → width decreases: 320 - 20 = 300
    act(() => {
      result.current.handlers.onMouseMove(makeCanvasMouseEvent(120, 100));
    });

    expect(result.current.resizeState.currentSize).toEqual({ width: 300, height: 60 });
  });

  it('updates currentSize on mousemove with N handle (shrink height)', () => {
    const { result } = renderHook(() =>
      useResize({ isReadOnly: false, onResizeEnd: vi.fn() })
    );

    act(() => {
      result.current.handlers.onHandleMouseDown(
        makeSvgMouseEvent(200, 100), 'unit-1', 'n', 320, 200
      );
    });

    // Move mouse down by 40px → height decreases: 200 - 40 = 160
    act(() => {
      result.current.handlers.onMouseMove(makeCanvasMouseEvent(200, 140));
    });

    expect(result.current.resizeState.currentSize).toEqual({ width: 320, height: 160 });
  });

  it('clamps width to MIN_UNIT_WIDTH (100)', () => {
    const { result } = renderHook(() =>
      useResize({ isReadOnly: false, onResizeEnd: vi.fn() })
    );

    act(() => {
      result.current.handlers.onHandleMouseDown(
        makeSvgMouseEvent(300, 100), 'unit-1', 'w', 120, 60
      );
    });

    // Move mouse right by 100px → width: 120 - 100 = 20 → clamped to 100
    act(() => {
      result.current.handlers.onMouseMove(makeCanvasMouseEvent(400, 100));
    });

    expect(result.current.resizeState.currentSize.width).toBe(100);
  });

  it('clamps height to MIN_UNIT_HEIGHT (40)', () => {
    const { result } = renderHook(() =>
      useResize({ isReadOnly: false, onResizeEnd: vi.fn() })
    );

    act(() => {
      result.current.handlers.onHandleMouseDown(
        makeSvgMouseEvent(200, 100), 'unit-1', 'n', 320, 60
      );
    });

    // Move mouse down by 100px → height: 60 - 100 = -40 → clamped to 40
    act(() => {
      result.current.handlers.onMouseMove(makeCanvasMouseEvent(200, 200));
    });

    expect(result.current.resizeState.currentSize.height).toBe(40);
  });

  it('snaps dimensions to grid', () => {
    const { result } = renderHook(() =>
      useResize({ isReadOnly: false, onResizeEnd: vi.fn() })
    );

    act(() => {
      result.current.handlers.onHandleMouseDown(
        makeSvgMouseEvent(300, 100), 'unit-1', 'se', 320, 60
      );
    });

    // Move by (13, 7) → raw: 333x67 → snapped: 340x60
    act(() => {
      result.current.handlers.onMouseMove(makeCanvasMouseEvent(313, 107));
    });

    expect(result.current.resizeState.currentSize).toEqual({ width: 340, height: 60 });
  });

  it('calls onResizeEnd on mouseUp and resets state', async () => {
    const onResizeEnd = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      useResize({ isReadOnly: false, onResizeEnd })
    );

    act(() => {
      result.current.handlers.onHandleMouseDown(
        makeSvgMouseEvent(300, 100), 'unit-1', 'se', 320, 60
      );
    });

    act(() => {
      result.current.handlers.onMouseMove(makeCanvasMouseEvent(360, 140));
    });

    await act(async () => {
      await result.current.handlers.onMouseUp();
    });

    expect(onResizeEnd).toHaveBeenCalledWith('unit-1', 380, 100);
    expect(result.current.resizeState.isResizing).toBe(false);
    expect(result.current.resizeState.unitId).toBeNull();
    expect(result.current.resizeState.handle).toBeNull();
  });

  it('getNodeSize returns currentSize for resizing unit', () => {
    const { result } = renderHook(() =>
      useResize({ isReadOnly: false, onResizeEnd: vi.fn() })
    );

    const defaultSize = { width: 320, height: 45 };

    // Before resize, returns default
    expect(result.current.getNodeSize('unit-1', defaultSize)).toEqual(defaultSize);

    // Start resize
    act(() => {
      result.current.handlers.onHandleMouseDown(
        makeSvgMouseEvent(300, 100), 'unit-1', 'se', 320, 45
      );
    });

    // During resize, returns currentSize
    expect(result.current.getNodeSize('unit-1', defaultSize)).toEqual({ width: 320, height: 45 });
  });

  it('getNodeSize returns defaultSize for non-resizing unit', () => {
    const { result } = renderHook(() =>
      useResize({ isReadOnly: false, onResizeEnd: vi.fn() })
    );

    // Start resize on unit-1
    act(() => {
      result.current.handlers.onHandleMouseDown(
        makeSvgMouseEvent(300, 100), 'unit-1', 'se', 320, 45
      );
    });

    const defaultSize = { width: 200, height: 60 };
    expect(result.current.getNodeSize('unit-2', defaultSize)).toEqual(defaultSize);
  });

  it('does nothing on mousemove when not resizing', () => {
    const { result } = renderHook(() =>
      useResize({ isReadOnly: false, onResizeEnd: vi.fn() })
    );

    act(() => {
      result.current.handlers.onMouseMove(makeCanvasMouseEvent(100, 100));
    });

    expect(result.current.resizeState.isResizing).toBe(false);
  });

  it('does nothing on mouseUp when not resizing', async () => {
    const onResizeEnd = vi.fn();
    const { result } = renderHook(() =>
      useResize({ isReadOnly: false, onResizeEnd })
    );

    await act(async () => {
      await result.current.handlers.onMouseUp();
    });

    expect(onResizeEnd).not.toHaveBeenCalled();
  });

  it('handles NW handle correctly (both width and height decrease)', () => {
    const { result } = renderHook(() =>
      useResize({ isReadOnly: false, onResizeEnd: vi.fn() })
    );

    act(() => {
      result.current.handlers.onHandleMouseDown(
        makeSvgMouseEvent(100, 100), 'unit-1', 'nw', 320, 200
      );
    });

    // Move mouse right 40px and down 60px → width: 320-40=280, height: 200-60=140
    act(() => {
      result.current.handlers.onMouseMove(makeCanvasMouseEvent(140, 160));
    });

    expect(result.current.resizeState.currentSize).toEqual({ width: 280, height: 140 });
  });

  it('handles NE handle correctly (width increases, height decreases)', () => {
    const { result } = renderHook(() =>
      useResize({ isReadOnly: false, onResizeEnd: vi.fn() })
    );

    act(() => {
      result.current.handlers.onHandleMouseDown(
        makeSvgMouseEvent(300, 100), 'unit-1', 'ne', 320, 200
      );
    });

    // Move mouse right 40px and down 60px → width: 320+40=360, height: 200-60=140
    act(() => {
      result.current.handlers.onMouseMove(makeCanvasMouseEvent(340, 160));
    });

    expect(result.current.resizeState.currentSize).toEqual({ width: 360, height: 140 });
  });

  it('handles SW handle correctly (width decreases, height increases)', () => {
    const { result } = renderHook(() =>
      useResize({ isReadOnly: false, onResizeEnd: vi.fn() })
    );

    act(() => {
      result.current.handlers.onHandleMouseDown(
        makeSvgMouseEvent(100, 200), 'unit-1', 'sw', 320, 200
      );
    });

    // Move mouse right 40px and down 60px → width: 320-40=280, height: 200+60=260
    act(() => {
      result.current.handlers.onMouseMove(makeCanvasMouseEvent(140, 260));
    });

    expect(result.current.resizeState.currentSize).toEqual({ width: 280, height: 260 });
  });
});
