// @ts-nocheck
import React, { useState } from 'react';
import { apiClient } from '@/api/apiClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, Loader2, Building2 } from 'lucide-react';
import { toast } from 'sonner';

import UnitCard from '@/components/orgchart/UnitCard';
import UnitForm from '@/components/orgchart/UnitForm';
import VersionSelector from '@/components/orgchart/VersionSelector';

export default function UnitsPage() {
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [showUnitForm, setShowUnitForm] = useState(false);
  const queryClient = useQueryClient();

  const { data: versions = [], isLoading: versionsLoading } = useQuery({
    queryKey: ['versions'],
    queryFn: () => apiClient.listVersions(),
  });

  // Fetch ALL units (unfiltered) for color inheritance
  const { data: allUnits = [], isLoading: unitsLoading } = useQuery({
    queryKey: ['units', selectedVersion?.id],
    queryFn: async () => {
      return await apiClient.listUnits(selectedVersion?.id);
    },
    enabled: !!selectedVersion?.id,
  });

  // Filter units for display only (exclude consiliu and legend)
  const units = allUnits.filter(unit => 
    unit.unit_type !== 'consiliu' && 
    unit.unit_type !== 'legend' &&
    unit.stas_code !== '330'
  );

  // Auto-select first version
  React.useEffect(() => {
    if (versions.length > 0 && !selectedVersion) {
      setSelectedVersion(versions[0]);
    }
  }, [versions, selectedVersion]);

  const createUnitMutation = useMutation({
    mutationFn: (data) => apiClient.createUnit(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units'] });
      setShowUnitForm(false);
      setSelectedUnit(null);
      toast.success('Unitate creată cu succes');
    },
  });

  const updateUnitMutation = useMutation({
    mutationFn: ({ id, data }) => apiClient.updateUnit(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units'] });
      setShowUnitForm(false);
      toast.success('Unitate actualizată');
    },
  });

  const deleteUnitMutation = useMutation({
    mutationFn: (id) => apiClient.deleteUnit(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units'] });
      setSelectedUnit(null);
      toast.success('Unitate ștearsă');
    },
  });

  const handleVersionSelect = (versionId) => {
    const version = versions.find(v => v.id === versionId);
    setSelectedVersion(version);
    setSelectedUnit(null);
    setShowUnitForm(false);
  };

  const handleSaveUnit = (data) => {
    if (selectedUnit?.id) {
      updateUnitMutation.mutate({ id: selectedUnit.id, data });
    } else {
      createUnitMutation.mutate(data);
    }
  };

  const handleDeleteUnit = () => {
    if (selectedUnit?.id) {
      deleteUnitMutation.mutate(selectedUnit.id);
    }
  };

  const isReadOnly = selectedVersion?.status !== 'draft';

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Building2 className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Unități Organizaționale</h1>
          </div>
          <VersionSelector
            versions={versions}
            selectedVersion={selectedVersion}
            onSelect={handleVersionSelect}
            onNewVersion={() => {}}
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {!selectedVersion ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Selectează o versiune pentru a gestiona unitățile</p>
            </div>
          </div>
        ) : (
          <div className="h-full flex gap-6 p-6">
            {/* Units List */}
            <div className="flex-1 overflow-auto">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Lista Unități</CardTitle>
                    {selectedVersion && (
                      <p className="text-sm text-gray-500 mt-1">
                        Versiune: <span className="font-semibold text-gray-700">{selectedVersion.name}</span>
                      </p>
                    )}
                  </div>
                  {!isReadOnly && (
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedUnit(null);
                        setShowUnitForm(true);
                      }}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Unitate Nouă
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  {unitsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                    </div>
                  ) : units.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      Nu există unități. Adaugă prima unitate.
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {(() => {
                        // Helper function to get final color (with inheritance)
                        const getFinalColor = (unit) => {
                          const parentToChild = {
                            '1000': '1001',
                            '2000': '2001', 
                            '1100': '1103',
                            '3000': '3003',
                            '1200': '1210',
                          };
                          
                          const childCode = parentToChild[unit.stas_code];
                          if (childCode && allUnits.length > 0) {
                            const childUnit = allUnits.find(u => u.stas_code === childCode);
                            if (childUnit?.color) {
                              return childUnit.color;
                            }
                          }
                          
                          return unit.color || 'no-color';
                        };

                        // Group units by final color (including inherited)
                        const groupedUnits = units.reduce((acc, unit) => {
                          const color = getFinalColor(unit);
                          if (!acc[color]) acc[color] = [];
                          acc[color].push(unit);
                          return acc;
                        }, {});

                        // Define color order: verde, roz, galben, albastru, portocaliu
                        const colorOrder = {
                          '#86C67C': 1, // verde (1000, 1001)
                          '#86C67C-full': 1,
                          '#E8B4D4': 2, // roz (1100, 1103)
                          '#E8B4D4-full': 2,
                          '#F4E03C': 3, // galben (1200, 1210)
                          '#F4E03C-full': 3,
                          '#8CB4D4': 4, // albastru (2000, 2001)
                          '#8CB4D4-full': 4,
                          '#F4A43C': 5, // portocaliu (3000, 3003)
                          '#F4A43C-full': 5,
                        };

                        // Sort groups: no-color first, then by defined color order
                        const sortedGroups = Object.entries(groupedUnits).sort(([a], [b]) => {
                          if (a === 'no-color') return -1;
                          if (b === 'no-color') return 1;
                          
                          const orderA = colorOrder[a] || 999;
                          const orderB = colorOrder[b] || 999;
                          
                          return orderA - orderB;
                        });

                        return sortedGroups.map(([color, groupUnits]) => (
                          <div key={color} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {groupUnits
                                .sort((a, b) => {
                                  const codeA = parseInt(a.stas_code) || 0;
                                  const codeB = parseInt(b.stas_code) || 0;
                                  return codeA - codeB;
                                })
                                .map((unit) => (
                                <UnitCard
                                  key={unit.id}
                                  unit={unit}
                                  allUnits={allUnits}
                                  onClick={(unit) => {
                                    setSelectedUnit(unit);
                                    setShowUnitForm(true);
                                  }}
                                  isSelected={selectedUnit?.id === unit.id}
                                />
                              ))}
                            </div>
                          </div>
                        ));
                      })()}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Unit Form */}
            {showUnitForm && (
              <div className="w-96 overflow-auto">
                <div className="space-y-4">
                  <UnitForm
                    unit={selectedUnit}
                    units={units}
                    versionId={selectedVersion.id}
                    onSave={handleSaveUnit}
                    onCancel={() => {
                      setShowUnitForm(false);
                      setSelectedUnit(null);
                    }}
                    isReadOnly={isReadOnly}
                  />
                  
                  {selectedUnit && !isReadOnly && (
                    <Button
                      variant="destructive"
                      className="w-full"
                      onClick={handleDeleteUnit}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Șterge Unitatea
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
