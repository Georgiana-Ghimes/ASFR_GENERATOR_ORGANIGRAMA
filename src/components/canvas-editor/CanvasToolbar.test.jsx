import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CanvasToolbar from './CanvasToolbar';

const defaultProps = {
  zoom: 1.0,
  onZoomIn: vi.fn(),
  onZoomOut: vi.fn(),
  onFitToContent: vi.fn(),
  onResetZoom: vi.fn(),
  isReadOnly: false,
  onAddUnit: vi.fn(),
};

function renderToolbar(overrides = {}) {
  return render(<CanvasToolbar {...defaultProps} {...overrides} />);
}

describe('CanvasToolbar', () => {
  it('displays zoom percentage', () => {
    renderToolbar({ zoom: 0.75 });
    expect(screen.getByText('150%')).toBeTruthy();
  });

  it('displays 100% at zoom 0.5', () => {
    renderToolbar({ zoom: 0.5 });
    expect(screen.getByText('100%')).toBeTruthy();
  });

  it('calls onZoomOut when Zoom Out button is clicked', () => {
    const onZoomOut = vi.fn();
    renderToolbar({ onZoomOut });
    fireEvent.click(screen.getByLabelText('Zoom Out'));
    expect(onZoomOut).toHaveBeenCalledOnce();
  });

  it('calls onZoomIn when Zoom In button is clicked', () => {
    const onZoomIn = vi.fn();
    renderToolbar({ onZoomIn });
    fireEvent.click(screen.getByLabelText('Zoom In'));
    expect(onZoomIn).toHaveBeenCalledOnce();
  });

  it('calls onFitToContent when Fit to Content button is clicked', () => {
    const onFitToContent = vi.fn();
    renderToolbar({ onFitToContent });
    fireEvent.click(screen.getByLabelText('Încadrare'));
    expect(onFitToContent).toHaveBeenCalledOnce();
  });

  it('calls onResetZoom when Reset Zoom button is clicked', () => {
    const onResetZoom = vi.fn();
    renderToolbar({ onResetZoom });
    fireEvent.click(screen.getByLabelText('Reset Zoom'));
    expect(onResetZoom).toHaveBeenCalledOnce();
  });

  it('shows Adaugă Unitate button when not read-only', () => {
    renderToolbar({ isReadOnly: false });
    expect(screen.getByLabelText('Adaugă Unitate')).toBeTruthy();
  });

  it('hides Adaugă Unitate button when read-only', () => {
    renderToolbar({ isReadOnly: true });
    expect(screen.queryByLabelText('Adaugă Unitate')).toBeNull();
  });

  it('calls onAddUnit when Adaugă Unitate button is clicked', () => {
    const onAddUnit = vi.fn();
    renderToolbar({ onAddUnit, isReadOnly: false });
    fireEvent.click(screen.getByLabelText('Adaugă Unitate'));
    expect(onAddUnit).toHaveBeenCalledOnce();
  });

  it('rounds zoom percentage correctly', () => {
    renderToolbar({ zoom: 0.777 });
    expect(screen.getByText('155%')).toBeTruthy();
  });

  it('shows toggle button to hide/show toolbar', () => {
    renderToolbar();
    expect(screen.getByLabelText('Ascunde toolbar')).toBeTruthy();
  });

  it('hides toolbar content when toggle is clicked', () => {
    renderToolbar();
    fireEvent.click(screen.getByLabelText('Ascunde toolbar'));
    expect(screen.getByLabelText('Arată toolbar')).toBeTruthy();
  });
});
