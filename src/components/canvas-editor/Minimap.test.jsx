import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Minimap from './Minimap';

const makeUnit = (id, x, y, w = 320, h = 45, color = '#86C67C') => ({
  id,
  custom_x: x,
  custom_y: y,
  custom_width: w,
  custom_height: h,
  color,
});

const defaultViewport = { panX: 0, panY: 0, zoom: 1 };
const defaultCanvasSize = { width: 1200, height: 800 };
const defaultSize = { width: 200, height: 150 };

describe('Minimap', () => {
  it('renders nothing when units is empty', () => {
    const { container } = render(
      <Minimap
        units={[]}
        viewport={defaultViewport}
        canvasSize={defaultCanvasSize}
        onNavigate={vi.fn()}
      />
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders nothing when units is null', () => {
    const { container } = render(
      <Minimap
        units={null}
        viewport={defaultViewport}
        canvasSize={defaultCanvasSize}
        onNavigate={vi.fn()}
      />
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders the minimap container with correct styles', () => {
    const units = [makeUnit('u1', 100, 100)];
    render(
      <Minimap
        units={units}
        viewport={defaultViewport}
        canvasSize={defaultCanvasSize}
        onNavigate={vi.fn()}
      />
    );
    const minimap = screen.getByTestId('minimap');
    expect(minimap).toBeTruthy();
    expect(minimap.style.width).toBe('200px');
    expect(minimap.style.height).toBe('150px');
    expect(minimap.style.position).toBe('absolute');
  });

  it('renders a rect for each unit', () => {
    const units = [
      makeUnit('u1', 100, 100),
      makeUnit('u2', 500, 300),
      makeUnit('u3', 200, 600),
    ];
    render(
      <Minimap
        units={units}
        viewport={defaultViewport}
        canvasSize={defaultCanvasSize}
        onNavigate={vi.fn()}
      />
    );
    const svg = screen.getByTestId('minimap').querySelector('svg');
    // 3 unit rects + 1 viewport rect = 4 total
    const rects = svg.querySelectorAll('rect');
    expect(rects.length).toBe(4);
  });

  it('renders the viewport indicator', () => {
    const units = [makeUnit('u1', 100, 100)];
    render(
      <Minimap
        units={units}
        viewport={defaultViewport}
        canvasSize={defaultCanvasSize}
        onNavigate={vi.fn()}
      />
    );
    const vpRect = screen.getByTestId('minimap-viewport');
    expect(vpRect).toBeTruthy();
  });

  it('strips -full suffix from unit colors', () => {
    const units = [makeUnit('u1', 100, 100, 320, 45, '#86C67C-full')];
    render(
      <Minimap
        units={units}
        viewport={defaultViewport}
        canvasSize={defaultCanvasSize}
        onNavigate={vi.fn()}
      />
    );
    const svg = screen.getByTestId('minimap').querySelector('svg');
    const unitRect = svg.querySelectorAll('rect')[0];
    expect(unitRect.getAttribute('fill')).toBe('#86C67C');
  });

  it('uses default color when unit has no color', () => {
    const units = [makeUnit('u1', 100, 100, 320, 45, null)];
    render(
      <Minimap
        units={units}
        viewport={defaultViewport}
        canvasSize={defaultCanvasSize}
        onNavigate={vi.fn()}
      />
    );
    const svg = screen.getByTestId('minimap').querySelector('svg');
    const unitRect = svg.querySelectorAll('rect')[0];
    expect(unitRect.getAttribute('fill')).toBe('#94a3b8');
  });

  it('calls onNavigate when clicking on the minimap', () => {
    const onNavigate = vi.fn();
    const units = [makeUnit('u1', 0, 0, 1000, 800)];
    render(
      <Minimap
        units={units}
        viewport={defaultViewport}
        canvasSize={defaultCanvasSize}
        onNavigate={onNavigate}
      />
    );
    const minimap = screen.getByTestId('minimap');

    // Simulate a click — getBoundingClientRect returns 0,0 in jsdom
    fireEvent.mouseDown(minimap, { clientX: 100, clientY: 75 });
    expect(onNavigate).toHaveBeenCalled();
    const [panX, panY] = onNavigate.mock.calls[0];
    expect(typeof panX).toBe('number');
    expect(typeof panY).toBe('number');
  });

  it('supports custom size prop', () => {
    const units = [makeUnit('u1', 100, 100)];
    render(
      <Minimap
        units={units}
        viewport={defaultViewport}
        canvasSize={defaultCanvasSize}
        onNavigate={vi.fn()}
        size={{ width: 300, height: 200 }}
      />
    );
    const minimap = screen.getByTestId('minimap');
    expect(minimap.style.width).toBe('300px');
    expect(minimap.style.height).toBe('200px');
  });

  it('handles drag on minimap (mousedown + mousemove + mouseup)', () => {
    const onNavigate = vi.fn();
    const units = [makeUnit('u1', 0, 0, 1000, 800)];
    render(
      <Minimap
        units={units}
        viewport={defaultViewport}
        canvasSize={defaultCanvasSize}
        onNavigate={onNavigate}
      />
    );
    const minimap = screen.getByTestId('minimap');

    fireEvent.mouseDown(minimap, { clientX: 50, clientY: 50 });
    expect(onNavigate).toHaveBeenCalledTimes(1);

    fireEvent.mouseMove(minimap, { clientX: 60, clientY: 60 });
    expect(onNavigate).toHaveBeenCalledTimes(2);

    fireEvent.mouseUp(minimap);
    // After mouseUp, further moves should not trigger navigate
    fireEvent.mouseMove(minimap, { clientX: 70, clientY: 70 });
    expect(onNavigate).toHaveBeenCalledTimes(2);
  });

  it('stops dragging on mouse leave', () => {
    const onNavigate = vi.fn();
    const units = [makeUnit('u1', 0, 0, 1000, 800)];
    render(
      <Minimap
        units={units}
        viewport={defaultViewport}
        canvasSize={defaultCanvasSize}
        onNavigate={onNavigate}
      />
    );
    const minimap = screen.getByTestId('minimap');

    fireEvent.mouseDown(minimap, { clientX: 50, clientY: 50 });
    fireEvent.mouseLeave(minimap);
    fireEvent.mouseMove(minimap, { clientX: 70, clientY: 70 });
    // Only the initial mouseDown navigate call
    expect(onNavigate).toHaveBeenCalledTimes(1);
  });
});
