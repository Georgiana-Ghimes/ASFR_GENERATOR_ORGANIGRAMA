import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import FixedNode from './FixedNode';

const defaultPosition = { x: 50, y: 100, width: 200, height: 60 };

function renderFixed(props = {}) {
  const merged = {
    type: 'consiliu',
    unit: null,
    position: defaultPosition,
    isReadOnly: false,
    onMouseDown: vi.fn(),
    onClick: vi.fn(),
    ...props,
  };
  return { ...render(<svg><FixedNode {...merged} /></svg>), props: merged };
}

describe('FixedNode', () => {
  describe('consiliu type', () => {
    it('renders rect with white fill and black stroke', () => {
      const { container } = renderFixed({ type: 'consiliu' });
      const rect = container.querySelector('rect');
      expect(rect.getAttribute('fill')).toBe('white');
      expect(rect.getAttribute('stroke')).toBe('#000000');
      expect(rect.getAttribute('stroke-width')).toBe('2');
      expect(rect.getAttribute('rx')).toBe('6');
    });

    it('shows default text when no unit', () => {
      const { container } = renderFixed({ type: 'consiliu', unit: null });
      const text = container.querySelector('text');
      expect(text.textContent).toBe('CONSILIUL DE CONDUCERE');
    });

    it('shows unit name when unit provided', () => {
      const { container } = renderFixed({
        type: 'consiliu',
        unit: { name: 'Consiliu Special' },
      });
      const text = container.querySelector('text');
      expect(text.textContent).toBe('Consiliu Special');
    });

    it('centers text in the rect', () => {
      const { container } = renderFixed({ type: 'consiliu' });
      const text = container.querySelector('text');
      expect(text.getAttribute('text-anchor')).toBe('middle');
      expect(text.getAttribute('x')).toBe('100'); // width/2
    });
  });

  describe('director_legend type', () => {
    it('renders rect with white fill and gray stroke', () => {
      const { container } = renderFixed({ type: 'director_legend' });
      const rect = container.querySelector('rect');
      expect(rect.getAttribute('fill')).toBe('white');
      expect(rect.getAttribute('stroke')).toBe('#d1d5db');
      expect(rect.getAttribute('stroke-width')).toBe('2');
    });

    it('shows director title and name', () => {
      const { container } = renderFixed({
        type: 'director_legend',
        unit: { director_title: 'Director General', director_name: 'Ion Popescu' },
      });
      const texts = Array.from(container.querySelectorAll('text'));
      expect(texts[0].textContent).toBe('Director General');
      expect(texts[1].textContent).toBe('Ion Popescu');
    });

    it('shows default values when unit has no director fields', () => {
      const { container } = renderFixed({ type: 'director_legend', unit: {} });
      const texts = Array.from(container.querySelectorAll('text'));
      expect(texts[0].textContent).toBe('DIRECTOR GENERAL');
      expect(texts[1].textContent).toBe('Petru BOGDAN');
    });
  });

  describe('custom_legend type', () => {
    it('renders main rect with white fill and dark stroke', () => {
      const { container } = renderFixed({ type: 'custom_legend' });
      const rects = container.querySelectorAll('rect');
      expect(rects[0].getAttribute('fill')).toBe('white');
      expect(rects[0].getAttribute('stroke')).toBe('#1f2937');
    });

    it('shows Legendă header text', () => {
      const { container } = renderFixed({ type: 'custom_legend' });
      const texts = Array.from(container.querySelectorAll('text'));
      expect(texts[0].textContent).toBe('Legendă');
    });

    it('shows three legend columns with rotated text', () => {
      const { container } = renderFixed({
        type: 'custom_legend',
        unit: { legend_col1: 'Col1', legend_col2: 'Col2', legend_col3: 'Col3' },
      });
      const texts = Array.from(container.querySelectorAll('text'));
      // texts[0] = Legendă header, texts[1..3] = columns
      expect(texts[1].textContent).toBe('Col1');
      expect(texts[2].textContent).toBe('Col2');
      expect(texts[3].textContent).toBe('Col3');
    });

    it('renders column divider lines', () => {
      const { container } = renderFixed({ type: 'custom_legend' });
      const lines = container.querySelectorAll('line');
      expect(lines.length).toBe(2);
    });
  });

  describe('stats_legend type', () => {
    it('renders foreignObject with totals', () => {
      const units = [
        { id: 'u1', unit_type: 'director_general', stas_code: '100' },
        { id: 'u2', unit_type: 'directie', stas_code: '200' },
      ];
      const aggregatesMap = {
        u1: { leadership_positions_count: 1, execution_positions_count: 5, recursive_total_subordinates: 18 },
        u2: { leadership_positions_count: 2, execution_positions_count: 10, recursive_total_subordinates: 12 },
      };
      const { container } = renderFixed({
        type: 'stats_legend',
        units,
        aggregatesMap,
      });
      const fo = container.querySelector('foreignObject');
      expect(fo).not.toBeNull();
      // Total = DG recursive (18) - DG leadership (1) = 17
      expect(fo.textContent).toContain('TOTAL POSTURI: 17');
      expect(fo.textContent).toContain('Director general: 1');
      expect(fo.textContent).toContain('Director: 2');
    });

    it('excludes consiliu units from totals', () => {
      const units = [
        { id: 'u1', unit_type: 'consiliu', stas_code: '330' },
        { id: 'u2', unit_type: 'director_general', stas_code: '100' },
      ];
      const aggregatesMap = {
        u1: { leadership_positions_count: 5, execution_positions_count: 10, recursive_total_subordinates: 15 },
        u2: { leadership_positions_count: 1, execution_positions_count: 8, recursive_total_subordinates: 9 },
      };
      const { container } = renderFixed({
        type: 'stats_legend',
        units,
        aggregatesMap,
      });
      const fo = container.querySelector('foreignObject');
      // Total = DG recursive (9) - DG leadership (1) = 8
      expect(fo.textContent).toContain('TOTAL POSTURI: 8');
    });
  });

  describe('header type', () => {
    it('renders a transparent rect for hit area', () => {
      const { container } = renderFixed({ type: 'header' });
      const rect = container.querySelector('rect');
      expect(rect).not.toBeNull();
      expect(rect.getAttribute('fill')).toBe('transparent');
    });

    it('shows unit name centered', () => {
      const { container } = renderFixed({
        type: 'header',
        unit: { name: 'Organigrama ASFR' },
      });
      const text = container.querySelector('text');
      expect(text.textContent).toBe('Organigrama ASFR');
      expect(text.getAttribute('text-anchor')).toBe('middle');
      expect(Number(text.getAttribute('font-size'))).toBeGreaterThan(0);
    });
  });

  describe('common behavior', () => {
    it('applies translate transform from position', () => {
      const { container } = renderFixed({ position: { x: 30, y: 70, width: 200, height: 60 } });
      const g = container.querySelector('g');
      expect(g.getAttribute('transform')).toBe('translate(30, 70)');
    });

    it('uses grab cursor when not read-only', () => {
      const { container } = renderFixed({ isReadOnly: false });
      const g = container.querySelector('g');
      expect(g.style.cursor).toBe('grab');
    });

    it('uses default cursor when read-only', () => {
      const { container } = renderFixed({ isReadOnly: true });
      const g = container.querySelector('g');
      expect(g.style.cursor).toBe('default');
    });

    it('calls onMouseDown on mouse down', () => {
      const onMouseDown = vi.fn();
      const { container } = renderFixed({ onMouseDown });
      fireEvent.mouseDown(container.querySelector('g'));
      expect(onMouseDown).toHaveBeenCalledTimes(1);
    });

    it('does not call onClick on click (fixed nodes are not editable)', () => {
      const onClick = vi.fn();
      const unit = { id: 'u1', name: 'Test' };
      const { container } = renderFixed({ onClick, unit });
      fireEvent.click(container.querySelector('g'));
      expect(onClick).not.toHaveBeenCalled();
    });

    it('returns null for unknown type', () => {
      const { container } = renderFixed({ type: 'unknown' });
      const g = container.querySelector('g');
      expect(g).toBeNull();
    });
  });
});
