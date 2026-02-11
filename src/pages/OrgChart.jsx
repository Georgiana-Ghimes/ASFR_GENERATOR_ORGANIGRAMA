import React, { useState, useEffect } from 'react';
import { apiClient } from '@/api/apiClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Trash2, Loader2, Building2, LayoutGrid, List } from 'lucide-react';
import { toast } from 'sonner';

import OrgTree from '@/components/orgchart/OrgTree';
import OrgChartVisual from '@/components/orgchart/OrgChartVisual';
import UnitCard from '@/components/orgchart/UnitCard';
import UnitForm from '@/components/orgchart/UnitForm';
import VersionSelector from '@/components/orgchart/VersionSelector';
import VersionActions from '@/components/orgchart/VersionActions';
import StatsPanel from '@/components/orgchart/StatsPanel';

export default function OrgChartPage() {
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [showUnitForm, setShowUnitForm] = useState(false);
  const [showNewVersionDialog, setShowNewVersionDialog] = useState(false);
  const [newVersion, setNewVersion] = useState({ version_number: '', name: '', notes: '' });
  const [isExporting, setIsExporting] = useState(false);
  const [userRole, setUserRole] = useState('admin'); // Default to admin for now
  const [viewMode, setViewMode] = useState('visual'); // 'visual' or 'tree'
  
  const queryClient = useQueryClient();

  // Fetch current user
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await apiClient.me();
        setUserRole(user.role || 'admin');
      } catch (error) {
        console.error('Failed to fetch user:', error);
      }
    };
    fetchUser();
  }, []);

  // Fetch versions
  const { data: versions = [], isLoading: loadingVersions } = useQuery({
    queryKey: ['versions'],
    queryFn: () => apiClient.listVersions(),
  });

  // Set initial version
  useEffect(() => {
    if (versions.length > 0 && !selectedVersion) {
      setSelectedVersion(versions[0]);
    }
  }, [versions]);

  // Fetch units for selected version
  const { data: units = [], isLoading: loadingUnits } = useQuery({
    queryKey: ['units', selectedVersion?.id],
    queryFn: () => apiClient.listUnits(selectedVersion.id),
    enabled: !!selectedVersion?.id,
  });

  // Mutations
  const createVersionMutation = useMutation({
    mutationFn: (data) => apiClient.createVersion(data),
    onSuccess: (newVer) => {
      queryClient.invalidateQueries(['versions']);
      setSelectedVersion(newVer);
      setShowNewVersionDialog(false);
      toast.success('Versiune creată cu succes');
    },
  });

  const updateVersionMutation = useMutation({
    mutationFn: ({ id, data }) => apiClient.updateVersion(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['versions']);
      toast.success('Versiune actualizată');
    },
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
  };

  const handleNewVersion = () => {
    const nextNum = versions.length > 0 
      ? `v${(parseFloat(versions[0].version_number?.replace('v', '') || '0') + 1).toFixed(1)}`
      : 'v1.0';
    setNewVersion({ version_number: nextNum, name: '', notes: '' });
    setShowNewVersionDialog(true);
  };

  const handleCreateVersion = () => {
    createVersionMutation.mutate({
      ...newVersion,
      status: 'draft',
    });
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

  const handleSubmitForApproval = () => {
    updateVersionMutation.mutate({
      id: selectedVersion.id,
      data: { status: 'pending_approval' },
    });
  };

  const handleApprove = async (notes) => {
    try {
      const user = await apiClient.me();
      updateVersionMutation.mutate({
        id: selectedVersion.id,
        data: {
          status: 'approved',
          approved_by: user.email,
          approved_date: new Date().toISOString(),
          notes: notes || selectedVersion.notes,
        },
      });
    } catch (error) {
      toast.error('Eroare la aprobare');
    }
  };

  const handleDuplicate = async (versionNumber, versionName) => {
    try {
      // Create new version
      const newVer = await apiClient.createVersion({
        version_number: versionNumber,
        name: versionName,
        status: 'draft',
        notes: `Duplicat din ${selectedVersion.version_number}`,
      });

      // Copy all units
      for (const unit of units) {
        const { id, created_date, updated_date, created_by, ...unitData } = unit;
        await apiClient.createUnit({
          ...unitData,
          version_id: newVer.id,
        });
      }

      queryClient.invalidateQueries(['versions']);
      queryClient.invalidateQueries(['units']);
      setSelectedVersion(newVer);
      toast.success('Versiune duplicată cu succes');
    } catch (error) {
      toast.error('Eroare la duplicare');
    }
  };

  const handleExportPdf = async () => {
    setIsExporting(true);
    // In a real implementation, this would generate a PDF
    toast.info('Export PDF în curs de dezvoltare');
    setIsExporting(false);
  };

  const isReadOnly = selectedVersion?.status !== 'draft';

  if (loadingVersions) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1600px] mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Building2 className="w-7 h-7 text-blue-600" />
              Organigramă Instituțională
            </h1>
            <p className="text-gray-500 mt-1">
              Gestionare structură organizațională
            </p>
          </div>

          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            <VersionSelector
              versions={versions}
              selectedVersion={selectedVersion}
              onSelect={handleVersionSelect}
              onNewVersion={handleNewVersion}
            />
            
            <VersionActions
              version={selectedVersion}
              onSubmitForApproval={handleSubmitForApproval}
              onApprove={handleApprove}
              onExportPdf={handleExportPdf}
              onDuplicate={handleDuplicate}
              userRole={userRole}
              isExporting={isExporting}
            />
          </div>
        </div>

        {/* Stats */}
        {selectedVersion && (
          <StatsPanel units={units} positions={[]} employees={[]} />
        )}

        {/* Main Content */}
        {selectedVersion ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chart View */}
            <div className="lg:col-span-2">
              <Card className="h-[700px] overflow-hidden">
                <CardHeader className="border-b bg-white flex flex-row items-center justify-between py-3">
                  <CardTitle className="text-lg">Structură Organizațională</CardTitle>
                  <div className="flex items-center gap-2">
                    <div className="flex border rounded-lg overflow-hidden">
                      <Button
                        variant={viewMode === 'visual' ? 'default' : 'ghost'}
                        size="sm"
                        className="rounded-none"
                        onClick={() => setViewMode('visual')}
                      >
                        <LayoutGrid className="w-4 h-4 mr-1" />
                        Diagramă
                      </Button>
                      <Button
                        variant={viewMode === 'tree' ? 'default' : 'ghost'}
                        size="sm"
                        className="rounded-none"
                        onClick={() => setViewMode('tree')}
                      >
                        <List className="w-4 h-4 mr-1" />
                        Arbore
                      </Button>
                    </div>
                    {!isReadOnly && (
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedUnit(null);
                          setShowUnitForm(true);
                        }}
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Unitate Nouă
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-0 h-[calc(100%-60px)] overflow-auto">
                  {loadingUnits ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="w-6 h-6 animate-spin" />
                    </div>
                  ) : viewMode === 'visual' ? (
                    <OrgChartVisual
                      units={units}
                      onSelectUnit={(unit) => {
                        setSelectedUnit(unit);
                        setShowUnitForm(true);
                      }}
                    />
                  ) : (
                    <OrgTree
                      units={units}
                      onSelect={(unit) => {
                        setSelectedUnit(unit);
                        setShowUnitForm(true);
                      }}
                      selectedId={selectedUnit?.id}
                    />
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Detail Panel */}
            <div className="lg:col-span-1">
              {showUnitForm ? (
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
              ) : (
                <Card className="h-[400px] flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <Building2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>Selectați o unitate din arbore</p>
                    <p className="text-sm">sau creați una nouă</p>
                  </div>
                </Card>
              )}
            </div>
          </div>
        ) : (
          <Card className="p-12 text-center">
            <Building2 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">
              Nu există versiuni
            </h2>
            <p className="text-gray-500 mb-4">
              Creați prima versiune a organigramei
            </p>
            <Button onClick={handleNewVersion}>
              <Plus className="w-4 h-4 mr-2" />
              Creați Versiune Nouă
            </Button>
          </Card>
        )}
      </div>

      {/* New Version Dialog */}
      <Dialog open={showNewVersionDialog} onOpenChange={setShowNewVersionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Versiune Nouă</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Număr Versiune *</Label>
              <Input
                value={newVersion.version_number}
                onChange={(e) => setNewVersion({ ...newVersion, version_number: e.target.value })}
                placeholder="ex: v1.0"
              />
            </div>
            <div>
              <Label>Denumire *</Label>
              <Input
                value={newVersion.name}
                onChange={(e) => setNewVersion({ ...newVersion, name: e.target.value })}
                placeholder="ex: Organigramă 2026"
              />
            </div>
            <div>
              <Label>Note</Label>
              <Textarea
                value={newVersion.notes}
                onChange={(e) => setNewVersion({ ...newVersion, notes: e.target.value })}
                placeholder="Note sau descriere..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewVersionDialog(false)}>
              Anulare
            </Button>
            <Button 
              onClick={handleCreateVersion}
              disabled={!newVersion.version_number || !newVersion.name}
            >
              Creează
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}