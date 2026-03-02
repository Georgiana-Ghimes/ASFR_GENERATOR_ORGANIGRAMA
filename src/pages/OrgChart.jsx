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

export default function OrgChartPage() {
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

  // Update selected version when versions change (after approval)
  useEffect(() => {
    if (selectedVersion && versions.length > 0) {
      const updatedVersion = versions.find(v => v.id === selectedVersion.id);
      if (updatedVersion && updatedVersion.status !== selectedVersion.status) {
        setSelectedVersion(updatedVersion);
      }
    }
  }, [versions]);

  // Update unit mutation
  const updateUnitMutation = useMutation({
    mutationFn: ({ unitId, data }) => apiClient.updateUnit(unitId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['units', selectedVersion?.id]);
      setRefreshKey(prev => prev + 1);
      toast.success('Unitatea a fost actualizată cu succes');
      setSelectedUnit(null);
    },
    onError: (error) => {
      toast.error('Eroare la actualizarea unității: ' + error.message);
    },
  });

  // Approve version mutation
  const approveVersionMutation = useMutation({
    mutationFn: async (versionId) => {
      // First approve the version
      const result = await apiClient.updateVersion(versionId, { status: 'approved' });
      
      // Then capture and save snapshot
      try {
        const domtoimage = await import('dom-to-image-more');
        const svgElement = document.querySelector('.org-chart-container svg');
        
        if (svgElement) {
          // Get the actual SVG dimensions
          const bbox = svgElement.getBBox();
          const padding = 40;
          
          // Create a wrapper div with exact dimensions
          const wrapper = document.createElement('div');
          wrapper.style.position = 'absolute';
          wrapper.style.left = '-9999px';
          wrapper.style.width = `${bbox.width + bbox.x + padding * 2}px`;
          wrapper.style.height = `${bbox.height + bbox.y + padding * 2}px`;
          wrapper.style.backgroundColor = '#f9fafb';
          wrapper.style.padding = `${padding}px`;
          
          // Clone SVG and add to wrapper
          const svgClone = svgElement.cloneNode(true);
          svgClone.style.display = 'block';
          wrapper.appendChild(svgClone);
          document.body.appendChild(wrapper);
          
          // Wait a bit for rendering
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // Capture the wrapper
          const imageData = await domtoimage.toPng(wrapper, {
            quality: 1,
            bgcolor: '#f9fafb',
            width: bbox.width + bbox.x + padding * 2,
            height: bbox.height + bbox.y + padding * 2,
          });
          
          // Clean up
          document.body.removeChild(wrapper);
          
          await apiClient.saveVersionSnapshot(versionId, imageData);
          console.log('Snapshot saved successfully');
        }
      } catch (error) {
        console.error('Failed to capture snapshot:', error);
        toast.error('Eroare la capturarea snapshot-ului: ' + error.message);
        // Don't fail the approval if snapshot fails
      }
      
      return result;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries(['versions']);
      // Refresh the selected version to get updated status
      const updatedVersions = await apiClient.listVersions();
      const updatedVersion = updatedVersions.find(v => v.id === selectedVersion.id);
      if (updatedVersion) {
        setSelectedVersion(updatedVersion);
      }
      toast.success('Versiunea a fost aprobată cu succes');
    },
    onError: (error) => {
      toast.error('Eroare la aprobarea versiunii: ' + error.message);
    },
  });

  // Unapprove version mutation
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

  // Clone version mutation
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
    if (selectedVersion) {
      approveVersionMutation.mutate(selectedVersion.id);
    }
  };

  const handleUnapproveVersion = () => {
    if (selectedVersion) {
      unapproveVersionMutation.mutate(selectedVersion.id);
    }
  };

  const handleCloneVersion = () => {
    if (selectedVersion) {
      cloneVersionMutation.mutate(selectedVersion.id);
    }
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
    if (selectedUnit?.id) {
      updateUnitMutation.mutate({ unitId: selectedUnit.id, data });
    }
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
          <div className="flex items-center gap-4">
            <VersionSelector
              versions={versions}
              selectedVersion={selectedVersion}
              onSelect={handleVersionSelect}
              onApprove={handleApproveVersion}
              onNewVersion={handleCloneVersion}
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
              className={`h-full transition-all duration-300 ease-in-out org-chart-container ${
                selectedUnit ? 'mr-[500px]' : 'mr-0'
              }`}
            >
              <DeterministicOrgChart
                key={refreshKey}
                versionId={selectedVersion.id}
                orgType="codificare"
                onSelectUnit={handleSelectUnit}
                isReadOnly={isReadOnly}
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
                        {isReadOnly ? 'Detalii Unitate' : 'Editare Unitate'}
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
                      isReadOnly={isReadOnly}
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
