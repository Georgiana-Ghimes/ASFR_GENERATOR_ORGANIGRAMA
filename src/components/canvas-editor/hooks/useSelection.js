import { useState, useCallback, useEffect } from 'react';

export function useSelection() {
  const [selectedUnitId, setSelectedUnitId] = useState(null);

  const select = useCallback((unitId) => {
    setSelectedUnitId(unitId);
  }, []);

  const deselect = useCallback(() => {
    setSelectedUnitId(null);
  }, []);

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        deselect();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [deselect]);

  return { selectedUnitId, select, deselect };
}
