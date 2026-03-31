import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useViewport } from './useViewport';
import { ZOOM_MIN, ZOOM_MAX, ZOOM_STEP } from '../utils/canvasUtils';

const DEFAULT_ZOOM = 0.5;

describe('useViewport', () => {
  it('returns correct initial state', () => {
    const { result } = renderHook(() => useViewport());

    expect(result.current.viewport).toEqual({ panX: 0, panY: 0, zoom: DEFAULT_ZOOM });
    expect(result.current.isPanning).toBe(false);
    expect(result.current.svgTransform).toBe('translate(0, 0) scale(0.5)');
  });

  it('resetZoom sets zoom to default, panX=0, panY=0', () => {
    const { result } = renderHook(() => useViewport());

    act(() => { result.current.actions.zoomIn(); });
    act(() => { result.current.actions.panTo(100, 200); });

    act(() => { result.current.actions.resetZoom(); });

    expect(result.current.viewport).toEqual({ panX: 0, panY: 0, zoom: DEFAULT_ZOOM });
  });

  it('zoomIn increases zoom by ZOOM_STEP, clamped to ZOOM_MAX', () => {
    const { result } = renderHook(() => useViewport());

    act(() => { result.current.actions.zoomIn(); });
    expect(result.current.viewport.zoom).toBeCloseTo(DEFAULT_ZOOM + ZOOM_STEP);

    for (let i = 0; i < 50; i++) {
      act(() => { result.current.actions.zoomIn(); });
    }
    expect(result.current.viewport.zoom).toBeCloseTo(ZOOM_MAX);
  });

  it('zoomOut decreases zoom by ZOOM_STEP, clamped to ZOOM_MIN', () => {
    const { result } = renderHook(() => useViewport());

    act(() => { result.current.actions.zoomOut(); });
    expect(result.current.viewport.zoom).toBeCloseTo(DEFAULT_ZOOM - ZOOM_STEP);

    for (let i = 0; i < 50; i++) {
      act(() => { result.current.actions.zoomOut(); });
    }
    expect(result.current.viewport.zoom).toBeCloseTo(ZOOM_MIN);
  });

  it('panTo sets panX and panY directly', () => {
    const { result } = renderHook(() => useViewport());

    act(() => { result.current.actions.panTo(150, -75); });

    expect(result.current.viewport.panX).toBe(150);
    expect(result.current.viewport.panY).toBe(-75);
  });

  it('svgTransform reflects current viewport state', () => {
    const { result } = renderHook(() => useViewport());

    act(() => { result.current.actions.panTo(10, 20); });
    act(() => { result.current.actions.zoomIn(); });

    const expectedZoom = DEFAULT_ZOOM + ZOOM_STEP;
    expect(result.current.svgTransform).toBe(`translate(10, 20) scale(${expectedZoom})`);
  });

  it('fitToContent adjusts zoom and pan to show all units', () => {
    const { result } = renderHook(() => useViewport());

    const units = [
      { custom_x: 0, custom_y: 0, custom_width: 320, custom_height: 45 },
      { custom_x: 400, custom_y: 200, custom_width: 320, custom_height: 45 },
    ];

    act(() => { result.current.actions.fitToContent(units, 800, 600); });

    const { zoom, panX, panY } = result.current.viewport;
    expect(zoom).toBeGreaterThanOrEqual(ZOOM_MIN);
    expect(zoom).toBeLessThanOrEqual(ZOOM_MAX);
    expect(typeof panX).toBe('number');
    expect(typeof panY).toBe('number');
  });

  it('fitToContent with empty units resets zoom', () => {
    const { result } = renderHook(() => useViewport());

    act(() => { result.current.actions.zoomIn(); });
    act(() => { result.current.actions.fitToContent([], 800, 600); });

    expect(result.current.viewport).toEqual({ panX: 0, panY: 0, zoom: DEFAULT_ZOOM });
  });

  it('fitToContent with null units resets zoom', () => {
    const { result } = renderHook(() => useViewport());

    act(() => { result.current.actions.panTo(50, 50); });
    act(() => { result.current.actions.fitToContent(null, 800, 600); });

    expect(result.current.viewport).toEqual({ panX: 0, panY: 0, zoom: DEFAULT_ZOOM });
  });

  it('onMouseDown with left button starts panning', () => {
    const { result } = renderHook(() => useViewport());

    act(() => {
      result.current.handlers.onMouseDown({ button: 0, clientX: 100, clientY: 200 });
    });

    expect(result.current.isPanning).toBe(true);
  });

  it('onMouseDown with non-left button does not start panning', () => {
    const { result } = renderHook(() => useViewport());

    act(() => {
      result.current.handlers.onMouseDown({ button: 2, clientX: 100, clientY: 200 });
    });

    expect(result.current.isPanning).toBe(false);
  });

  it('onMouseUp stops panning', () => {
    const { result } = renderHook(() => useViewport());

    act(() => {
      result.current.handlers.onMouseDown({ button: 0, clientX: 100, clientY: 200 });
    });
    expect(result.current.isPanning).toBe(true);

    act(() => { result.current.handlers.onMouseUp(); });
    expect(result.current.isPanning).toBe(false);
  });
});
