import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import ConnectorLayer from './ConnectorLayer';

/** Helper: wrap SVG content in an <svg> so the DOM is valid */
function renderInSvg(ui) {
  return render(<svg>{ui}</svg>);
}

describe('ConnectorLayer', () => {
  it('renders an empty <g> when units is empty', () => {
    const { container } = renderInSvg(<ConnectorLayer units={[]} positions={{}} />);
    const g = container.querySelector('g.connector-layer');
    expect(g).toBeTruthy();
    expect(g.children.length).toBe(0);
  });

  it('renders an empty <g> when units is null', () => {
    const { container } = renderInSvg(<ConnectorLayer units={null} positions={{}} />);
    const g = container.querySelector('g.connector-layer');
    expect(g).toBeTruthy();
    expect(g.children.length).toBe(0);
  });

  it('renders an empty <g> when no director_general unit exists', () => {
    const units = [
      { id: 'root', parent_unit_id: null, unit_type: 'compartiment', name: 'Root' },
    ];
    const positions = { root: { x: 0, y: 0, width: 320, height: 45 } };
    const { container } = renderInSvg(<ConnectorLayer units={units} positions={positions} />);
    const g = container.querySelector('g.connector-layer');
    expect(g).toBeTruthy();
    expect(g.children.length).toBe(0);
  });

  it('renders without crashing with a director_general and children', () => {
    const units = [
      { id: 'dir', parent_unit_id: null, unit_type: 'director_general', name: 'Director' },
      { id: 'child1', parent_unit_id: 'dir', unit_type: 'compartiment', name: 'Child 1' },
    ];
    const positions = {
      dir: { x: 600, y: 300, width: 200, height: 60 },
      child1: { x: 100, y: 200, width: 200, height: 60 },
    };
    const { container } = renderInSvg(
      <ConnectorLayer units={units} positions={positions} />
    );
    const g = container.querySelector('g.connector-layer');
    expect(g).toBeTruthy();
    // Should have rendered some connector lines
    const lineElements = g.querySelectorAll('line');
    expect(lineElements.length).toBeGreaterThan(0);
  });

  it('renders the consiliu-to-director connector when consiliuPosition is provided', () => {
    const units = [
      { id: 'dir', parent_unit_id: null, unit_type: 'director_general', name: 'Director' },
    ];
    const positions = {
      dir: { x: 600, y: 300, width: 200, height: 60 },
    };
    const consiliuPosition = { x: 600, y: 180, width: 300, height: 60 };
    const { container } = renderInSvg(
      <ConnectorLayer units={units} positions={positions} consiliuPosition={consiliuPosition} />
    );
    const g = container.querySelector('g.connector-layer');
    const lineElements = g.querySelectorAll('line');
    // At least the consiliu-director line
    expect(lineElements.length).toBeGreaterThanOrEqual(1);
    // Check stroke attributes on first line
    expect(lineElements[0].getAttribute('stroke')).toBe('#374151');
    expect(lineElements[0].getAttribute('stroke-width')).toBe('2');
  });

  it('handles circular references without infinite loops', () => {
    const units = [
      { id: 'dir', parent_unit_id: null, unit_type: 'director_general', name: 'Director' },
      { id: 'a', parent_unit_id: 'dir', unit_type: 'compartiment', name: 'A' },
      { id: 'b', parent_unit_id: 'a', unit_type: 'compartiment', name: 'B' },
      { id: 'c', parent_unit_id: 'b', unit_type: 'compartiment', name: 'C' },
    ];
    // Make c's parent_unit_id point back to a (circular)
    units[3].parent_unit_id = 'a';

    const positions = {
      dir: { x: 600, y: 300, width: 200, height: 60 },
      a: { x: 100, y: 200, width: 200, height: 60 },
      b: { x: 50, y: 100, width: 200, height: 60 },
      c: { x: 150, y: 100, width: 200, height: 60 },
    };
    // Should not throw or hang
    const { container } = renderInSvg(
      <ConnectorLayer units={units} positions={positions} />
    );
    const g = container.querySelector('g.connector-layer');
    expect(g).toBeTruthy();
  });
});
