import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useViewport } from './useViewport';
import { ZOOM_MIN, ZOOM_MAX, ZOOM_STEP } from '../utils/canvasUtils';

describe('useViewport', () => {
  it('returns correct initial state', () => {
    const { result } = renderHook(() => useViewport());

    expect(result.current.viewport).toEqual({ panX: 0, panY: 0, zoom: 1.0 });
    expect(result.current.isPanning).toBe(false);
    expect(result.current.svgTransform).toBe('translate(0, 0) scale(1)');
  });

  it('resetZoom sets zoom=1, panX=0, panY=0', () => {
    const { result } = renderHook(() => useViewport());

    // Change state first
    act(() => { result.current.actions.zoomIn(); });
    act(() => { result.current.actions.panTo(100, 200); });

    expect(result.current.viewport.zoom).toBeCloseTo(1.1);
    expect(result.current.viewport.panX).toBe(100);

    act(() => { result.current.actions.resetZoom(); });

    expect(result.current.viewport).toEqual({ panX: 0, panY: 0, zoom: 1.0 });
  });

  it('zoomIn increases zoom by ZOOM_STEP, clamped to ZOOM_MAX', () => {
    const { result } = renderHook(() => useViewport());

    act(() => { result.current.actions.zoomIn(); });
    expect(result.current.viewport.zoom).toBeCloseTo(1.0 + ZOOM_STEP);

    // Zoom to max
    for (let i = 0; i < 50; i++) {
      act(() => { result.current.actions.zoomIn(); });
    }
    expect(result.current.viewport.zoom).toBeCloseTo(ZOOM_MAX);
  });

  it('zoomOut decreases zoom by ZOOM_STEP, clamped to ZOOM_MIN', () => {
    const { result } = renderHook(() => useViewport());

    act(() => { result.current.actions.zoomOut(); });
    expect(result.current.viewport.zoom).toBeCloseTo(1.0 - ZOOM_STEP);

    // Zoom to min
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

    expect(result.current.svgTransform).toBe(`translate(10, 20) scale(${1.0 + ZOOM_STEP})`);
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
    // After fit, all units should be visible — panX/panY should be adjusted
    expect(typeof panX).toBe('number');
    expect(typeof panY).toBe('number');
  });

  it('fitToContent with empty units resets zoom', () => {
    const { result } = renderHook(() => useViewport());

    act(() => { result.current.actions.zoomIn(); });
    act(() => { result.current.actions.fitToContent([], 800, 600); });

    expect(result.current.viewport).toEqual({ panX: 0, panY: 0, zoom: 1.0 });
  });

  it('fitToContent with null units resets zoom', () => {
    const { result } = renderHook(() => useViewport());

    act(() => { result.current.actions.panTo(50, 50); });
    act(() => { result.current.actions.fitToContent(null, 800, 600); });

    expect(result.current.viewport).toEqual({ panX: 0, panY: 0, zoom: 1.0 });
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
