import { describe, it, expect } from 'vitest';
import React from 'react';
import { render } from '@testing-library/react';
import SmartGuides from './SmartGuides';

function renderInSvg(ui) {
  const { container } = render(<svg>{ui}</svg>);
  return container;
}

describe('SmartGuides', () => {
  it('renders nothing when draggedUnit is null', () => {
    const container = renderInSvg(
      <SmartGuides draggedUnit={null} allUnits={[]} />
    );
    expect(container.querySelector('[data-testid="smart-guides"]')).toBeNull();
  });

  it('renders nothing when no other units align', () => {
    const dragged = { id: '1', x: 0, y: 0, width: 100, height: 50 };
    const allUnits = [
      { id: '1', custom_x: 0, custom_y: 0, custom_width: 100, custom_height: 50 },
      { id: '2', custom_x: 500, custom_y: 500, custom_width: 100, custom_height: 50 },
    ];
    const container = renderInSvg(
      <SmartGuides draggedUnit={dragged} allUnits={allUnits} />
    );
    expect(container.querySelector('[data-testid="smart-guides"]')).toBeNull();
  });

  it('renders horizontal guide when centers align vertically', () => {
    // Both units have centerY = 25
    const dragged = { id: '1', x: 0, y: 0, width: 100, height: 50 };
    const allUnits = [
      { id: '1', custom_x: 0, custom_y: 0, custom_width: 100, custom_height: 50 },
      { id: '2', custom_x: 300, custom_y: 0, custom_width: 100, custom_height: 50 },
    ];
    const container = renderInSvg(
      <SmartGuides draggedUnit={dragged} allUnits={allUnits} />
    );
    const lines = container.querySelectorAll('line');
    expect(lines.length).toBeGreaterThan(0);
    // Should have a horizontal line at y=25 (center)
    const hLine = Array.from(lines).find(
      (l) => l.getAttribute('y1') === '25' && l.getAttribute('y2') === '25'
    );
    expect(hLine).toBeTruthy();
  });

  it('renders vertical guide when centers align horizontally', () => {
    // Both units have centerX = 50
    const dragged = { id: '1', x: 0, y: 0, width: 100, height: 50 };
    const allUnits = [
      { id: '1', custom_x: 0, custom_y: 0, custom_width: 100, custom_height: 50 },
      { id: '2', custom_x: 0, custom_y: 300, custom_width: 100, custom_height: 50 },
    ];
    const container = renderInSvg(
      <SmartGuides draggedUnit={dragged} allUnits={allUnits} />
    );
    const lines = container.querySelectorAll('line');
    const vLine = Array.from(lines).find(
      (l) => l.getAttribute('x1') === '50' && l.getAttribute('x2') === '50'
    );
    expect(vLine).toBeTruthy();
  });

  it('renders guide when top edges align within threshold', () => {
    const dragged = { id: '1', x: 0, y: 10, width: 100, height: 50 };
    const allUnits = [
      { id: '1', custom_x: 0, custom_y: 10, custom_width: 100, custom_height: 50 },
      { id: '2', custom_x: 300, custom_y: 12, custom_width: 100, custom_height: 50 },
    ];
    const container = renderInSvg(
      <SmartGuides draggedUnit={dragged} allUnits={allUnits} threshold={5} />
    );
    const lines = container.querySelectorAll('line');
    // Top of other unit is 12, dragged top is 10, diff=2 < 5
    const hLine = Array.from(lines).find(
      (l) => l.getAttribute('y1') === '12' && l.getAttribute('y2') === '12'
    );
    expect(hLine).toBeTruthy();
  });

  it('renders guide when left edges align within threshold', () => {
    const dragged = { id: '1', x: 20, y: 0, width: 100, height: 50 };
    const allUnits = [
      { id: '1', custom_x: 20, custom_y: 0, custom_width: 100, custom_height: 50 },
      { id: '2', custom_x: 22, custom_y: 300, custom_width: 100, custom_height: 50 },
    ];
    const container = renderInSvg(
      <SmartGuides draggedUnit={dragged} allUnits={allUnits} threshold={5} />
    );
    const lines = container.querySelectorAll('line');
    const vLine = Array.from(lines).find(
      (l) => l.getAttribute('x1') === '22' && l.getAttribute('x2') === '22'
    );
    expect(vLine).toBeTruthy();
  });

  it('deduplicates guide lines at the same position', () => {
    // Two other units both at same Y center → only one horizontal guide
    const dragged = { id: '1', x: 0, y: 0, width: 100, height: 50 };
    const allUnits = [
      { id: '1', custom_x: 0, custom_y: 0, custom_width: 100, custom_height: 50 },
      { id: '2', custom_x: 200, custom_y: 0, custom_width: 100, custom_height: 50 },
      { id: '3', custom_x: 400, custom_y: 0, custom_width: 100, custom_height: 50 },
    ];
    const container = renderInSvg(
      <SmartGuides draggedUnit={dragged} allUnits={allUnits} />
    );
    const lines = container.querySelectorAll('line');
    // centerY=25 for all → should appear only once as horizontal
    const hLines = Array.from(lines).filter(
      (l) => l.getAttribute('y1') === '25' && l.getAttribute('y2') === '25'
    );
    expect(hLines.length).toBe(1);
  });

  it('uses default dimensions when custom_width/height are null', () => {
    // Default width=320, height=45 → centerX=160, centerY=22.5
    const dragged = { id: '1', x: 0, y: 0, width: 320, height: 45 };
    const allUnits = [
      { id: '1', custom_x: 0, custom_y: 0 },
      { id: '2', custom_x: 500, custom_y: 0 }, // centerY = 22.5 with defaults
    ];
    const container = renderInSvg(
      <SmartGuides draggedUnit={dragged} allUnits={allUnits} />
    );
    const lines = container.querySelectorAll('line');
    // Should detect horizontal alignment at centerY=22.5
    const hLine = Array.from(lines).find(
      (l) => l.getAttribute('y1') === '22.5' && l.getAttribute('y2') === '22.5'
    );
    expect(hLine).toBeTruthy();
  });

  it('applies correct SVG styling to guide lines', () => {
    const dragged = { id: '1', x: 0, y: 0, width: 100, height: 50 };
    const allUnits = [
      { id: '1', custom_x: 0, custom_y: 0, custom_width: 100, custom_height: 50 },
      { id: '2', custom_x: 300, custom_y: 0, custom_width: 100, custom_height: 50 },
    ];
    const container = renderInSvg(
      <SmartGuides draggedUnit={dragged} allUnits={allUnits} />
    );
    const line = container.querySelector('line');
    expect(line).toBeTruthy();
    expect(line.getAttribute('stroke')).toBe('#2563eb');
    expect(line.getAttribute('stroke-width')).toBe('0.5');
    expect(line.getAttribute('stroke-dasharray')).toBe('4 2');
    expect(line.getAttribute('opacity')).toBe('0.6');
  });

  it('skips the dragged unit itself in allUnits', () => {
    // Only the dragged unit in allUnits → no guides
    const dragged = { id: '1', x: 0, y: 0, width: 100, height: 50 };
    const allUnits = [
      { id: '1', custom_x: 0, custom_y: 0, custom_width: 100, custom_height: 50 },
    ];
    const container = renderInSvg(
      <SmartGuides draggedUnit={dragged} allUnits={allUnits} />
    );
    expect(container.querySelector('[data-testid="smart-guides"]')).toBeNull();
  });
});
