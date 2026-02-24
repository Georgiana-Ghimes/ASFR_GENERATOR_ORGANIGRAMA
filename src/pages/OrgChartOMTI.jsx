// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { apiClient } from '@/api/apiClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { X, Building2, Info } from 'lucide-react';
import { toast } from 'sonner';

import DeterministicOrgChart from '@/components/orgchart/DeterministicOrgChart';
import VersionSelector from '@/components/orgchart/VersionSelector';
import StatsPanel from '@/components/orgchart/StatsPanel';
import UnitForm from '@/components/orgchart/UnitForm';

export default function OrgChartOMTIPage() {
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [layoutData, setLayoutData] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const queryClient = useQueryClient();

  // Fetch versions
  const { data: versions = [], isLoading: loadingVersions } = useQuery({
    queryKey: ['versions'],
    queryFn: () => apiClient.listVersions(),
  });

  // Fetch units
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
  }, [selectedVersion?.id, refreshKey]);

  // Auto-select first version
  useEffect(() => {
    if (versions.length > 0 && !selectedVersion) {
      setSelectedVersion(versions[0]);
    }
  }, [versions, selectedVersion]);

  // Update unit mutation - not used in OMTI (read-only)
  const updateUnitMutation = useMutation({
    mutationFn: ({ unitId, data }) => apiClient.updateUnit(unitId, data),
    onSuccess: () => {
      // This should never be called in OMTI
      queryClient.invalidateQueries(['units', selectedVersion?.id]);
      setRefreshKey(prev => prev + 1);
      toast.success('Unitatea a fost actualizată cu succes');
      setSelectedUnit(null);
    },
    onError: (error) => {
      toast.error('Eroare la actualizarea unității: ' + error.message);
    },
  });

  // Approve/Unapprove/Clone version mutations - not used in OMTI (read-only)
  const approveVersionMutation = useMutation({
    mutationFn: (versionId) => apiClient.updateVersion(versionId, { status: 'approved' }),
    onSuccess: () => {
      queryClient.invalidateQueries(['versions']);
      toast.success('Versiunea a fost aprobată cu succes');
    },
    onError: (error) => {
      toast.error('Eroare la aprobarea versiunii: ' + error.message);
    },
  });

  const unapproveVersionMutation = useMutation({
    mutationFn: (versionId) => apiClient.updateVersion(versionId, { status: 'draft' }),
    onSuccess: () => {
      queryClient.invalidateQueries(['versions']);
      toast.success('Aprobarea a fost resetată cu succes');
    },
    onError: (error) => {
      toast.error('Eroare la resetarea aprobării: ' + error.message);
    },
  });

  const cloneVersionMutation = useMutation({
    mutationFn: (versionId) => apiClient.cloneVersion(versionId),
    onSuccess: (newVersion) => {
      queryClient.invalidateQueries(['versions']);
      setSelectedVersion(newVersion);
      toast.success('Versiune nouă creată cu succes');
    },
    onError: (error) => {
      toast.error('Eroare la crearea versiunii: ' + error.message);
    },
  });

  const handleApproveVersion = () => {
    // Not used in OMTI
  };

  const handleUnapproveVersion = () => {
    // Not used in OMTI
  };

  const handleCloneVersion = () => {
    // Not used in OMTI
  };

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

  const handleSaveUnit = (data) => {
    // Not used in OMTI - read-only
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

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Building2 className="w-6 h-6 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Organigramă la anexa OMTI</h1>
              <p className="text-sm text-gray-500 mt-1">Vizualizare - Editarea se face în Organigrama codificare</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <VersionSelector
              versions={versions}
              selectedVersion={selectedVersion}
              onSelect={handleVersionSelect}
              onApprove={null}
              onNewVersion={null}
              hideStatus={true}
              isLoading={loadingVersions}
            />
          </div>
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
              className={`h-full transition-all duration-300 ease-in-out ${
                selectedUnit ? 'mr-[500px]' : 'mr-0'
              }`}
            >
              <DeterministicOrgChart
                key={refreshKey}
                versionId={selectedVersion.id}
                orgType="omti"
                onSelectUnit={handleSelectUnit}
                isReadOnly={true}
              />
            </div>

            {/* Side Panel - slide in from right */}
            <div
              className={`absolute top-0 right-0 h-full w-[500px] bg-white border-l shadow-2xl transform transition-transform duration-300 ease-in-out ${
                selectedUnit ? 'translate-x-0' : 'translate-x-full'
              }`}
            >
              {selectedUnit && (
                <div className="h-full flex flex-col">
                  {/* Panel Header */}
                  <div className="flex items-center justify-between p-4 border-b bg-blue-50">
                    <div className="flex items-center gap-2">
                      <Info className="w-5 h-5 text-blue-600" />
                      <h2 className="font-semibold text-gray-900">
                        Detalii Unitate
                      </h2>
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
                    <UnitForm
                      unit={selectedUnit}
                      units={units}
                      versionId={selectedVersion.id}
                      onSave={handleSaveUnit}
                      onCancel={handleClosePanel}
                      isReadOnly={true}
                    />
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
