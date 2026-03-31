import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import UnitNode from './UnitNode';

function makeUnit(overrides = {}) {
  return {
    id: 'u1',
    stas_code: '1000',
    name: 'Direcția Generală',
    unit_type: 'directie',
    color: '#86C67C',
    is_rotated: false,
    custom_x: 100,
    custom_y: 200,
    custom_width: 320,
    custom_height: 45,
    ...overrides,
  };
}

const defaultProps = {
  aggregates: {
    leadership_positions_count: 3,
    execution_positions_count: 10,
    total_positions: 13,
    recursive_total_subordinates: 0,
  },
  isSelected: false,
  isDragging: false,
  isReadOnly: false,
  position: { x: 100, y: 200 },
  size: { width: 320, height: 45 },
  onMouseDown: vi.fn(),
  onContextMenu: vi.fn(),
  onResizeHandleMouseDown: vi.fn(),
};

function renderNode(unitOverrides = {}, propOverrides = {}) {
  const unit = makeUnit(unitOverrides);
  const props = { ...defaultProps, unit, ...propOverrides };
  return render(
    <svg>
      <UnitNode {...props} />
    </svg>
  );
}

describe('UnitNode', () => {
  it('renders without crashing', () => {
    const { container } = renderNode();
    expect(container.querySelector('g')).toBeTruthy();
  });

  it('renders the unit name', () => {
    const { container } = renderNode();
    expect(container.textContent).toContain('Direcția Generală');
  });

  it('renders the stas_code', () => {
    const { container } = renderNode();
    const texts = Array.from(container.querySelectorAll('text')).map(t => t.textContent);
    expect(texts).toContain('1000');
  });

  it('applies translate transform from position prop', () => {
    const { container } = renderNode({}, { position: { x: 50, y: 75 } });
    const g = container.querySelector('g');
    expect(g.getAttribute('transform')).toContain('translate(50, 75)');
  });

  it('applies rotation when is_rotated is true', () => {
    const { container } = renderNode({ is_rotated: true });
    const g = container.querySelector('g');
    expect(g.getAttribute('transform')).toContain('rotate(-90');
  });

  it('shows resize handle when not read-only', () => {
    const { container } = renderNode({}, { isReadOnly: false });
    const paths = container.querySelectorAll('path');
    expect(paths.length).toBeGreaterThan(0);
  });

  it('hides resize handle when read-only', () => {
    const { container } = renderNode({}, { isReadOnly: true });
    const paths = container.querySelectorAll('path');
    expect(paths.length).toBe(0);
  });
});
