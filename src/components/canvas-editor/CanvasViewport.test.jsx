import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CanvasViewport from './CanvasViewport';

// Minimal stubs so child components render without crashing
vi.mock('./ConnectorLayer', () => ({
  default: React.memo(function ConnectorLayer() {
    return <g data-testid="connector-layer" />;
  }),
}));

vi.mock('./SmartGuides', () => ({
  default: React.memo(function SmartGuides() {
    return <g data-testid="smart-guides" />;
  }),
}));

const noop = () => {};

function makeUnit(overrides = {}) {
  return {
    id: 'u1',
    name: 'Unit 1',
    stas_code: '100',
    color: '#86C67C',
    custom_x: 40,
    custom_y: 60,
    custom_width: 320,
    custom_height: 45,
    is_rotated: false,
    parent_unit_id: null,
    leadership_count: 2,
    execution_count: 5,
    ...overrides,
  };
}

const defaultProps = {
  units: [],
  fixedNodes: [],
  aggregatesMap: {},
  svgTransform: 'translate(0, 0) scale(1)',
  selectedUnitId: null,
  isReadOnly: false,
  positions: {},
  sizes: {},
  dragState: { isDragging: false, unitId: null, currentPos: null },
  isPanning: false,
  onViewportMouseDown: noop,
  onViewportMouseMove: noop,
  onViewportMouseUp: noop,
  onViewportWheel: noop,
  onNodeMouseDown: noop,
  onNodeContextMenu: noop,
  onResizeHandleMouseDown: noop,
  onFixedNodeMouseDown: noop,
  onFixedNodeClick: noop,
};

describe('CanvasViewport', () => {
  it('renders an SVG element with grid pattern', () => {
    const { container } = render(<CanvasViewport {...defaultProps} />);
    const svg = container.querySelector('svg');
    expect(svg).toBeTruthy();
    expect(svg.getAttribute('width')).toBe('100%');
    expect(svg.getAttribute('height')).toBe('100%');

    const pattern = container.querySelector('pattern#grid');
    expect(pattern).toBeTruthy();
    expect(pattern.getAttribute('width')).toBe('20');
    expect(pattern.getAttribute('height')).toBe('20');
  });

  it('applies svgTransform to the content group and grid pattern', () => {
    const transform = 'translate(100, 50) scale(1.2)';
    const { container } = render(
      <CanvasViewport {...defaultProps} svgTransform={transform} />
    );
    const g = container.querySelector('g[transform]');
    expect(g.getAttribute('transform')).toBe(transform);

    const pattern = container.querySelector('pattern#grid');
    expect(pattern.getAttribute('patternTransform')).toBe(transform);
  });

  it('renders UnitNode for each unit with correct position/size', () => {
    const unit = makeUnit();
    const positions = { u1: { x: 40, y: 60, width: 320, height: 45 } };
    const sizes = { u1: { width: 320, height: 45 } };

    const { container } = render(
      <CanvasViewport
        {...defaultProps}
        units={[unit]}
        positions={positions}
        sizes={sizes}
      />
    );

    // UnitNode renders a <g> with translate
    const groups = container.querySelectorAll('g[transform]');
    const unitGroup = Array.from(groups).find((g) =>
      g.getAttribute('transform')?.includes('translate(40, 60)')
    );
    expect(unitGroup).toBeTruthy();
  });

  it('falls back to unit custom_x/y when positions map is empty', () => {
    const unit = makeUnit({ custom_x: 200, custom_y: 300 });

    const { container } = render(
      <CanvasViewport {...defaultProps} units={[unit]} positions={{}} sizes={{}} />
    );

    const groups = container.querySelectorAll('g[transform]');
    const unitGroup = Array.from(groups).find((g) =>
      g.getAttribute('transform')?.includes('translate(200, 300)')
    );
    expect(unitGroup).toBeTruthy();
  });

  it('renders FixedNode elements', () => {
    const fixedNodes = [
      {
        type: 'consiliu',
        unit: { name: 'Consiliu' },
        position: { x: 10, y: 20, width: 200, height: 50 },
      },
    ];

    const { container } = render(
      <CanvasViewport {...defaultProps} fixedNodes={fixedNodes} />
    );

    // FixedNode for consiliu renders text with the name
    expect(container.textContent).toContain('Consiliu');
  });

  it('renders SmartGuides when dragging', () => {
    const unit = makeUnit();
    const dragState = { isDragging: true, unitId: 'u1', currentPos: { x: 50, y: 70 } };
    const positions = { u1: { x: 50, y: 70, width: 320, height: 45 } };

    const { container } = render(
      <CanvasViewport
        {...defaultProps}
        units={[unit]}
        positions={positions}
        sizes={{ u1: { width: 320, height: 45 } }}
        dragState={dragState}
      />
    );

    expect(container.querySelector('[data-testid="smart-guides"]')).toBeTruthy();
  });

  it('does NOT render SmartGuides when not dragging', () => {
    const { container } = render(<CanvasViewport {...defaultProps} />);
    expect(container.querySelector('[data-testid="smart-guides"]')).toBeNull();
  });

  it('sets cursor to grabbing when isPanning is true', () => {
    const { container } = render(
      <CanvasViewport {...defaultProps} isPanning={true} />
    );
    const svg = container.querySelector('svg');
    expect(svg.style.cursor).toBe('grabbing');
  });

  it('sets cursor to default when isPanning is false', () => {
    const { container } = render(
      <CanvasViewport {...defaultProps} isPanning={false} />
    );
    const svg = container.querySelector('svg');
    expect(svg.style.cursor).toBe('default');
  });

  it('calls viewport mouse handlers', () => {
    const onMouseDown = vi.fn();
    const onMouseMove = vi.fn();
    const onMouseUp = vi.fn();

    const { container } = render(
      <CanvasViewport
        {...defaultProps}
        onViewportMouseDown={onMouseDown}
        onViewportMouseMove={onMouseMove}
        onViewportMouseUp={onMouseUp}
      />
    );

    const svg = container.querySelector('svg');
    fireEvent.mouseDown(svg);
    fireEvent.mouseMove(svg);
    fireEvent.mouseUp(svg);

    expect(onMouseDown).toHaveBeenCalledTimes(1);
    expect(onMouseMove).toHaveBeenCalledTimes(1);
    expect(onMouseUp).toHaveBeenCalledTimes(1);
  });

  it('forwards ref to the SVG element', () => {
    const ref = React.createRef();
    render(<CanvasViewport {...defaultProps} ref={ref} />);
    expect(ref.current).toBeTruthy();
    expect(ref.current.tagName).toBe('svg');
  });

  it('renders ConnectorLayer', () => {
    const { container } = render(<CanvasViewport {...defaultProps} />);
    expect(container.querySelector('[data-testid="connector-layer"]')).toBeTruthy();
  });

  it('marks selected unit with isSelected prop', () => {
    const unit = makeUnit();
    const positions = { u1: { x: 40, y: 60, width: 320, height: 45 } };
    const sizes = { u1: { width: 320, height: 45 } };

    const { container } = render(
      <CanvasViewport
        {...defaultProps}
        units={[unit]}
        positions={positions}
        sizes={sizes}
        selectedUnitId="u1"
      />
    );

    // When selected, UnitNode renders a rect with blue stroke (#3b82f6) and strokeWidth 5
    const rects = container.querySelectorAll('rect');
    const selectedRect = Array.from(rects).find(
      (r) => r.getAttribute('stroke') === '#3b82f6' && r.getAttribute('stroke-width') === '5'
    );
    expect(selectedRect).toBeTruthy();
  });
});
