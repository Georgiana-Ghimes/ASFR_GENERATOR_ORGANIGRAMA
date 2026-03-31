import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ContextMenu from './ContextMenu';

const mockUnit = {
  id: 'unit-1',
  name: 'Test Unit',
  stas_code: '1000',
  unit_type: 'directie',
};

const defaultProps = {
  position: { x: 100, y: 200 },
  unit: mockUnit,
  isReadOnly: false,
  onEdit: vi.fn(),
  onAddChild: vi.fn(),
  onDelete: vi.fn(),
  onRotate: vi.fn(),
  onClose: vi.fn(),
};

function renderMenu(overrides = {}) {
  return render(<ContextMenu {...defaultProps} {...overrides} />);
}

describe('ContextMenu', () => {
  it('renders nothing when position is null', () => {
    const { container } = renderMenu({ position: null });
    expect(container.innerHTML).toBe('');
  });

  it('renders nothing when unit is null', () => {
    const { container } = renderMenu({ unit: null });
    expect(container.innerHTML).toBe('');
  });

  it('renders all menu items when not read-only', () => {
    renderMenu();
    expect(screen.getByText('Editare')).toBeTruthy();
    expect(screen.getByText('Adaugă Copil')).toBeTruthy();
    expect(screen.getByText('Rotire')).toBeTruthy();
    expect(screen.getByText('Șterge')).toBeTruthy();
  });

  it('hides edit-only items when read-only', () => {
    renderMenu({ isReadOnly: true });
    expect(screen.getByText('Editare')).toBeTruthy();
    expect(screen.queryByText('Adaugă Copil')).toBeNull();
    expect(screen.queryByText('Rotire')).toBeNull();
    expect(screen.queryByText('Șterge')).toBeNull();
  });

  it('calls onEdit then onClose when Editare is clicked', () => {
    const onEdit = vi.fn();
    const onClose = vi.fn();
    renderMenu({ onEdit, onClose });
    fireEvent.click(screen.getByText('Editare'));
    expect(onEdit).toHaveBeenCalledOnce();
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls onAddChild then onClose when Adaugă Copil is clicked', () => {
    const onAddChild = vi.fn();
    const onClose = vi.fn();
    renderMenu({ onAddChild, onClose });
    fireEvent.click(screen.getByText('Adaugă Copil'));
    expect(onAddChild).toHaveBeenCalledOnce();
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls onRotate then onClose when Rotire is clicked', () => {
    const onRotate = vi.fn();
    const onClose = vi.fn();
    renderMenu({ onRotate, onClose });
    fireEvent.click(screen.getByText('Rotire'));
    expect(onRotate).toHaveBeenCalledOnce();
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls onDelete then onClose when Șterge is clicked', () => {
    const onDelete = vi.fn();
    const onClose = vi.fn();
    renderMenu({ onDelete, onClose });
    fireEvent.click(screen.getByText('Șterge'));
    expect(onDelete).toHaveBeenCalledOnce();
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls onClose when Escape key is pressed', () => {
    const onClose = vi.fn();
    renderMenu({ onClose });
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls onClose when clicking outside the menu', () => {
    const onClose = vi.fn();
    renderMenu({ onClose });
    fireEvent.mouseDown(document);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('positions the menu at the given coordinates', () => {
    renderMenu({ position: { x: 150, y: 300 } });
    const menu = screen.getByRole('menu');
    expect(menu.style.left).toBe('150px');
    expect(menu.style.top).toBe('300px');
  });
});
