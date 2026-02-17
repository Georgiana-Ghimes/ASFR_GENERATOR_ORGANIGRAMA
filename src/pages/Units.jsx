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

  const { data: units = [], isLoading: unitsLoading } = useQuery({
    queryKey: ['units', selectedVersion?.id],
    queryFn: () => apiClient.listUnits(selectedVersion?.id),
    enabled: !!selectedVersion?.id,
  });

  const createUnitMutation = useMutation({
    mutationFn: (data) => apiClient.createUnit(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['units']);
      setShowUnitForm(false);
      setSelectedUnit(null);
      toast.success('Unitate creată cu succes');
    },
  });

  const updateUnitMutation = useMutation({
    mutationFn: ({ id, data }) => apiClient.updateUnit(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['units']);
      setShowUnitForm(false);
      toast.success('Unitate actualizată');
    },
  });

  const deleteUnitMutation = useMutation({
    mutationFn: (id) => apiClient.deleteUnit(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['units']);
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
            isLoading={versionsLoading}
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
                  <CardTitle>Lista Unități</CardTitle>
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
                        // Group units by color
                        const groupedUnits = units.reduce((acc, unit) => {
                          const color = unit.color || 'no-color';
                          if (!acc[color]) acc[color] = [];
                          acc[color].push(unit);
                          return acc;
                        }, {});

                        // Sort groups: no-color first, then by color
                        const sortedGroups = Object.entries(groupedUnits).sort(([a], [b]) => {
                          if (a === 'no-color') return -1;
                          if (b === 'no-color') return 1;
                          return a.localeCompare(b);
                        });

                        return sortedGroups.map(([color, groupUnits]) => (
                          <div key={color} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {groupUnits.map((unit) => (
                                <UnitCard
                                  key={unit.id}
                                  unit={unit}
                                  onSelect={(unit) => {
                                    setSelectedUnit(unit);
                                    setShowUnitForm(true);
                                  }}
                                  selectedId={selectedUnit?.id}
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
