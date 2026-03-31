import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock apiClient
vi.mock('@/api/apiClient', () => ({
  apiClient: {
    listUnits: vi.fn().mockResolvedValue([]),
    updateUnit: vi.fn().mockResolvedValue({}),
    createUnit: vi.fn().mockResolvedValue({}),
    deleteUnit: vi.fn().mockResolvedValue({}),
  },
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock fetch for layout data
global.fetch = vi.fn().mockResolvedValue({
  json: () => Promise.resolve({ layout: [] }),
});

import CanvasEditor from './CanvasEditor';
import { apiClient } from '@/api/apiClient';
import { toast } from 'sonner';

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

function renderEditor(props = {}) {
  const queryClient = createQueryClient();
  const defaultProps = {
    versionId: 'v1',
    onSelectUnit: vi.fn(),
    isReadOnly: false,
    ...props,
  };

  return render(
    <QueryClientProvider client={queryClient}>
      <CanvasEditor {...defaultProps} />
    </QueryClientProvider>
  );
}

describe('CanvasEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiClient.listUnits.mockResolvedValue([]);
    global.fetch.mockResolvedValue({
      json: () => Promise.resolve({ layout: [] }),
    });
    localStorage.clear();
  });

  it('renders without crashing', () => {
    renderEditor();
    // Should render the container div
    expect(document.querySelector('svg')).toBeTruthy();
  });

  it('renders CanvasToolbar with zoom controls', () => {
    renderEditor();
    expect(screen.getByLabelText('Zoom In')).toBeTruthy();
    expect(screen.getByLabelText('Zoom Out')).toBeTruthy();
    expect(screen.getByLabelText('Fit to Content')).toBeTruthy();
    expect(screen.getByLabelText('Reset Zoom')).toBeTruthy();
  });

  it('shows Adaugă Unitate button when not read-only', () => {
    renderEditor({ isReadOnly: false });
    expect(screen.getByLabelText('Adaugă Unitate')).toBeTruthy();
  });

  it('hides Adaugă Unitate button when read-only', () => {
    renderEditor({ isReadOnly: true });
    expect(screen.queryByLabelText('Adaugă Unitate')).toBeNull();
  });

  it('fetches units via TanStack Query on mount', async () => {
    renderEditor({ versionId: 'test-version' });
    await waitFor(() => {
      expect(apiClient.listUnits).toHaveBeenCalledWith('test-version');
    });
  });

  it('fetches layout data on mount', async () => {
    renderEditor({ versionId: 'test-version' });
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/layout/test-version'
      );
    });
  });

  it('displays zoom percentage at 100%', () => {
    renderEditor();
    expect(screen.getByText('100%')).toBeTruthy();
  });

  it('loads fixed elements from localStorage', () => {
    const saved = {
      legend: { x: 50, y: 50, width: 200, height: 100 },
      director: { x: 100, y: 100, width: 200, height: 60 },
      header1: { x: 500, y: 120, width: 400, height: 20 },
      header2: { x: 500, y: 140, width: 400, height: 20 },
      consiliu: { x: 600, y: 180, width: 300, height: 60 },
      customLegend: { x: 450, y: 20, width: 200, height: 300 },
    };
    localStorage.setItem('fixed_elements_v1', JSON.stringify(saved));
    renderEditor({ versionId: 'v1' });
    // Component should render without errors after loading from localStorage
    expect(document.querySelector('svg')).toBeTruthy();
  });

  it('renders units when data is available', async () => {
    const mockUnits = [
      {
        id: 'u1',
        version_id: 'v1',
        name: 'Direcția IT',
        stas_code: '100',
        unit_type: 'directie',
        parent_unit_id: null,
        custom_x: 100,
        custom_y: 200,
        custom_width: 320,
        custom_height: 45,
        color: '#86C67C',
        is_rotated: false,
      },
    ];
    apiClient.listUnits.mockResolvedValue(mockUnits);

    renderEditor({ versionId: 'v1' });

    await waitFor(() => {
      expect(apiClient.listUnits).toHaveBeenCalledWith('v1');
    });
  });

  it('handles keyboard shortcut Ctrl+0 for reset zoom', () => {
    renderEditor();
    // Zoom in first
    fireEvent.click(screen.getByLabelText('Zoom In'));
    // Then reset
    fireEvent.keyDown(window, { key: '0', ctrlKey: true });
    expect(screen.getByText('100%')).toBeTruthy();
  });

  it('does not show context menu initially', () => {
    renderEditor();
    expect(screen.queryByRole('menu')).toBeNull();
  });
});
