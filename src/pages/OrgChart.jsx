import React, { useState, useEffect } from 'react';
import { apiClient } from '@/api/apiClient';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Building2, Info } from 'lucide-react';

import DeterministicOrgChart from '@/components/orgchart/DeterministicOrgChart';
import VersionSelector from '@/components/orgchart/VersionSelector';
import StatsPanel from '@/components/orgchart/StatsPanel';
import { unitTypeLabels } from '@/components/orgchart/UnitCard';

export default function OrgChartPage() {
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [layoutData, setLayoutData] = useState(null);

  // Fetch versions
  const { data: versions = [], isLoading: loadingVersions } = useQuery({
    queryKey: ['versions'],
    queryFn: () => apiClient.listVersions(),
  });

  // Fetch units for stats
  const { data: units = [] } = useQuery({
    queryKey: ['units', selectedVersion?.id],
    queryFn: () => apiClient.listUnits(selectedVersion?.id),
    enabled: !!selectedVersion?.id,
  });

  // Fetch layout data for aggregates
  useEffect(() => {
    if (!selectedVersion?.id) return;
    
    const fetchLayout = async () => {
      try {
        const response = await fetch(`http://localhost:8000/api/layout/${selectedVersion.id}`);
        const data = await response.json();
        setLayoutData(data);
      } catch (error) {
        console.error('Failed to fetch layout:', error);
      }
    };
    
    fetchLayout();
  }, [selectedVersion?.id]);

  // Auto-select first version
  useEffect(() => {
    if (versions.length > 0 && !selectedVersion) {
      setSelectedVersion(versions[0]);
    }
  }, [versions, selectedVersion]);

  const handleVersionSelect = (versionId) => {
    const version = versions.find(v => v.id === versionId);
    setSelectedVersion(version);
    setSelectedUnit(null);
  };

  const handleSelectUnit = (unit) => {
    setSelectedUnit(unit);
  };

  const handleClosePanel = () => {
    setSelectedUnit(null);
  };

  // Handle Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && selectedUnit) {
        handleClosePanel();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [selectedUnit]);

  const isReadOnly = selectedVersion?.status !== 'draft';

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Building2 className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Organigramă</h1>
          </div>
          <VersionSelector
            versions={versions}
            selectedVersion={selectedVersion}
            onSelect={handleVersionSelect}
            isLoading={loadingVersions}
          />
        </div>
        
        {/* Stats Panel */}
        {selectedVersion && layoutData && (
          <StatsPanel units={units} layoutData={layoutData} />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden relative">
        {!selectedVersion ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Selectează o versiune pentru a vizualiza organigrama</p>
            </div>
          </div>
        ) : (
          <>
            {/* Organigramă - se restrânge când e selectată o unitate */}
            <div 
              className={`h-full transition-all duration-300 ${
                selectedUnit ? 'mr-96' : 'mr-0'
              }`}
            >
              <DeterministicOrgChart
                versionId={selectedVersion.id}
                onSelectUnit={handleSelectUnit}
                isReadOnly={true}
              />
            </div>

            {/* Side Panel - slide in from right */}
            <div
              className={`absolute top-0 right-0 h-full w-96 bg-white border-l shadow-2xl transform transition-transform duration-300 ${
                selectedUnit ? 'translate-x-0' : 'translate-x-full'
              }`}
            >
              {selectedUnit && (
                <div className="h-full flex flex-col">
                  {/* Panel Header */}
                  <div className="flex items-center justify-between p-4 border-b bg-blue-50">
                    <div className="flex items-center gap-2">
                      <Info className="w-5 h-5 text-blue-600" />
                      <h2 className="font-semibold text-gray-900">Detalii Unitate</h2>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleClosePanel}
                    >
                      <X className="w-5 h-5" />
                    </Button>
                  </div>

                  {/* Panel Content */}
                  <div className="flex-1 overflow-auto p-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">{selectedUnit.name}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <label className="text-sm font-medium text-gray-500">Cod STAS</label>
                          <p className="text-base font-semibold">{selectedUnit.stas_code}</p>
                        </div>
                        
                        <div>
                          <label className="text-sm font-medium text-gray-500">Tip Unitate</label>
                          <p className="text-base">{unitTypeLabels[selectedUnit.unit_type] || selectedUnit.unit_type}</p>
                        </div>

                        {selectedUnit.leadership_count !== undefined && (
                          <div>
                            <label className="text-sm font-medium text-gray-500">Posturi Conducere</label>
                            <p className="text-base font-semibold text-blue-600">{selectedUnit.leadership_count}</p>
                          </div>
                        )}

                        {selectedUnit.execution_count !== undefined && (
                          <div>
                            <label className="text-sm font-medium text-gray-500">Posturi Execuție</label>
                            <p className="text-base font-semibold text-green-600">{selectedUnit.execution_count}</p>
                          </div>
                        )}

                        <div className="pt-4 border-t">
                          <p className="text-sm text-gray-500">
                            Pentru a edita această unitate, accesează meniul <span className="font-semibold">Unități Organizaționale</span>.
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Panel Footer */}
                  <div className="p-4 border-t bg-gray-50">
                    <p className="text-xs text-gray-500 text-center">
                      Apasă <kbd className="px-2 py-1 bg-white border rounded text-xs">ESC</kbd> pentru a închide
                    </p>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
