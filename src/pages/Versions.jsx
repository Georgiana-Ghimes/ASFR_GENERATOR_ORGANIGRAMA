// @ts-nocheck
import React, { useState } from 'react';
import { apiClient } from '@/api/apiClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Calendar } from '@/components/ui/calendar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';
import { FileCheck, Clock, Edit3, Eye, Calendar as CalendarIcon, User, Loader2, Trash2, RotateCcw, Image as ImageIcon, Download } from 'lucide-react';
import { toast } from 'sonner';

function VersionPreview({ versionId, cache, setCache, onClick }) {
  const [img, setImg] = React.useState(cache[versionId] || null);
  const [loading, setLoading] = React.useState(false);
  const loaded = React.useRef(false);

  React.useEffect(() => {
    if (cache[versionId]) { setImg(cache[versionId]); return; }
    if (loaded.current) return;
    loaded.current = true;
    setLoading(true);
    apiClient.getVersionSnapshot(versionId).then(data => {
      if (data.image) {
        setImg(data.image);
        setCache(prev => ({ ...prev, [versionId]: data.image }));
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, [versionId, cache, setCache]);

  if (loading) return <Loader2 className="w-4 h-4 animate-spin text-gray-400 mx-auto" />;
  if (!img) return <ImageIcon className="w-6 h-6 text-gray-300 mx-auto" />;
  return <img src={img} alt="Preview" className="w-[100px] h-auto border rounded cursor-pointer mx-auto" onClick={onClick} />;
}

const statusConfig = {
  draft: { label: 'Ciornă', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Edit3 },
  pending_approval: { label: 'În aprobare', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: Clock },
  approved: { label: 'Aprobat', color: 'bg-green-100 text-green-800 border-green-200', icon: FileCheck },
};

export default function VersionsPage() {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [versionToDelete, setVersionToDelete] = useState(null);
  const [unapproveDialogOpen, setUnapproveDialogOpen] = useState(false);
  const [versionToUnapprove, setVersionToUnapprove] = useState(null);
  const [snapshotDialogOpen, setSnapshotDialogOpen] = useState(false);
  const [snapshotImage, setSnapshotImage] = useState(null);
  const [loadingSnapshot, setLoadingSnapshot] = useState(false);
  const [snapshotCache, setSnapshotCache] = useState({});
  const queryClient = useQueryClient();

  const { data: versions = [], isLoading } = useQuery({
    queryKey: ['versions'],
    queryFn: () => apiClient.listVersions(),
  });

  const { data: omtiSnapshots = [], isLoading: loadingOmti } = useQuery({
    queryKey: ['omti-snapshots'],
    queryFn: () => apiClient.listOmtiSnapshots(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => apiClient.deleteVersion(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['versions']);
      toast.success('Versiune ștearsă cu succes');
      setDeleteDialogOpen(false);
      setVersionToDelete(null);
    },
    onError: (error) => toast.error(error.message || 'Eroare la ștergerea versiunii'),
  });

  const unapproveMutation = useMutation({
    mutationFn: (id) => apiClient.restoreVersion(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['versions']);
      queryClient.invalidateQueries(['units']);
      toast.success('Aprobarea a fost resetată cu succes.');
      setUnapproveDialogOpen(false);
      setVersionToUnapprove(null);
      setTimeout(() => window.location.reload(), 1000);
    },
    onError: (error) => toast.error(error.message || 'Eroare la resetarea aprobării'),
  });

  const updateValidityMutation = useMutation({
    mutationFn: ({ id, validFrom, validUntil }) => apiClient.updateVersionValidity(id, validFrom, validUntil),
    onSuccess: () => { queryClient.invalidateQueries(['versions']); toast.success('Perioada actualizată'); },
    onError: (error) => toast.error(error.message || 'Eroare'),
  });

  const deleteOmtiMutation = useMutation({
    mutationFn: (id) => apiClient.deleteOmtiSnapshot(id),
    onSuccess: () => { queryClient.invalidateQueries(['omti-snapshots']); toast.success('Imagine ștearsă'); },
    onError: (error) => toast.error(error.message || 'Eroare la ștergere'),
  });

  const handleViewSnapshot = async (versionId) => {
    if (snapshotCache[versionId]) {
      setSnapshotImage(snapshotCache[versionId]);
      setSnapshotDialogOpen(true);
      return;
    }
    setLoadingSnapshot(true);
    setSnapshotDialogOpen(true);
    try {
      const data = await apiClient.getVersionSnapshot(versionId);
      setSnapshotImage(data.image);
      if (data.image) setSnapshotCache(prev => ({ ...prev, [versionId]: data.image }));
    } catch {
      toast.error('Eroare la încărcarea imaginii');
      setSnapshotDialogOpen(false);
    } finally {
      setLoadingSnapshot(false);
    }
  };

  const handleViewOmtiSnapshot = (image) => {
    setSnapshotImage(image);
    setSnapshotDialogOpen(true);
  };

  const handleDownloadOmti = (image, date) => {
    const link = document.createElement('a');
    link.download = `organigrama_omti_${date}.png`;
    link.href = image;
    link.click();
  };

  const handleDownloadVersionSnapshot = async (versionId, versionNumber) => {
    let image = snapshotCache[versionId];
    if (!image) {
      try {
        const data = await apiClient.getVersionSnapshot(versionId);
        image = data.image;
        if (image) setSnapshotCache(prev => ({ ...prev, [versionId]: image }));
      } catch {
        toast.error('Nu există imagine pentru această versiune');
        return;
      }
    }
    if (!image) { toast.error('Nu există imagine'); return; }
    const link = document.createElement('a');
    link.download = `organigrama_${versionNumber || 'snapshot'}.png`;
    link.href = image;
    link.click();
  };

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Istoric Versiuni</h1>
            <p className="text-gray-500">Versiuni organigrame și imagini generate OMTI</p>
          </div>
          <Link to={createPageUrl('OrgChart')}>
            <Button><Eye className="w-4 h-4 mr-2" />Vezi Organigrama</Button>
          </Link>
        </div>

        <Tabs defaultValue="versions">
          <TabsList>
            <TabsTrigger value="versions">Versiuni Organigramă</TabsTrigger>
            <TabsTrigger value="omti">Imagini Generate OMTI</TabsTrigger>
          </TabsList>

          <TabsContent value="versions">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b">
                      <TableHead className="text-center border-r w-[120px]">Previzualizare</TableHead>
                      <TableHead className="text-center border-r">Versiune</TableHead>
                      <TableHead className="text-center border-r">Denumire</TableHead>
                      <TableHead className="text-center border-r">Status</TableHead>
                      <TableHead className="text-center border-r">De la</TableHead>
                      <TableHead className="text-center border-r">Până la</TableHead>
                      <TableHead className="text-center min-w-[180px] border-r">Aprobat de</TableHead>
                      <TableHead className="text-center border-r">Data Aprobare</TableHead>
                      <TableHead className="text-center">Acțiuni</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {versions.map((version) => {
                      const status = statusConfig[version.status];
                      const StatusIcon = status.icon;
                      return (
                        <TableRow key={version.id} className="border-b">
                          <TableCell className="text-center border-r">
                            <VersionPreview versionId={version.id} cache={snapshotCache} setCache={setSnapshotCache} onClick={() => handleViewSnapshot(version.id)} />
                          </TableCell>
                          <TableCell className="font-mono font-medium text-center border-r">{version.version_number}</TableCell>
                          <TableCell className="text-center border-r">{version.name}</TableCell>
                          <TableCell className="text-center border-r">
                            <Badge className={`${status.color} border`}><StatusIcon className="w-3 h-3 mr-1" />{status.label}</Badge>
                          </TableCell>
                          <TableCell className="text-center border-r">
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 px-2">
                                  <CalendarIcon className="w-3 h-3 mr-1" />
                                  {version.valid_from ? format(new Date(version.valid_from), 'dd MMM yyyy', { locale: ro }) : 'Selectează'}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar mode="single" selected={version.valid_from ? new Date(version.valid_from) : undefined}
                                  onSelect={(date) => date && updateValidityMutation.mutate({ id: version.id, validFrom: format(date, 'yyyy-MM-dd'), validUntil: version.valid_until ? format(new Date(version.valid_until), 'yyyy-MM-dd') : null })}
                                  locale={ro} />
                              </PopoverContent>
                            </Popover>
                          </TableCell>
                          <TableCell className="text-center border-r">
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 px-2">
                                  <CalendarIcon className="w-3 h-3 mr-1" />
                                  {version.valid_until ? format(new Date(version.valid_until), 'dd MMM yyyy', { locale: ro }) : 'Selectează'}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar mode="single" selected={version.valid_until ? new Date(version.valid_until) : undefined}
                                  onSelect={(date) => date && updateValidityMutation.mutate({ id: version.id, validFrom: version.valid_from ? format(new Date(version.valid_from), 'yyyy-MM-dd') : null, validUntil: format(date, 'yyyy-MM-dd') })}
                                  locale={ro} />
                              </PopoverContent>
                            </Popover>
                          </TableCell>
                          <TableCell className="min-w-[180px] text-center border-r">
                            {version.approved_by_name ? (
                              <div className="flex items-center justify-center gap-1 text-gray-600"><User className="w-3 h-3 flex-shrink-0" /><span className="whitespace-nowrap">{version.approved_by_name}</span></div>
                            ) : <span className="text-gray-400">—</span>}
                          </TableCell>
                          <TableCell className="text-center border-r">
                            {version.approved_at ? format(new Date(version.approved_at), 'dd MMM yyyy', { locale: ro }) : <span className="text-gray-400">—</span>}
                          </TableCell>
                          <TableCell className="text-center">
                            <TooltipProvider>
                              <div className="flex items-center justify-center gap-2">
                                <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="sm" onClick={() => handleViewSnapshot(version.id)}><Eye className="w-4 h-4" /></Button></TooltipTrigger><TooltipContent><p>Previzualizare</p></TooltipContent></Tooltip>
                                <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="sm" onClick={() => handleDownloadVersionSnapshot(version.id, version.version_number)}><Download className="w-4 h-4" /></Button></TooltipTrigger><TooltipContent><p>Descarcă imagine</p></TooltipContent></Tooltip>
                                {version.status === 'approved' && (
                                  <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="sm" onClick={() => { setVersionToUnapprove(version); setUnapproveDialogOpen(true); }} className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"><RotateCcw className="w-4 h-4" /></Button></TooltipTrigger><TooltipContent><p>Resetare aprobare</p></TooltipContent></Tooltip>
                                )}
                                <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="sm" onClick={() => { setVersionToDelete(version); setDeleteDialogOpen(true); }} className="text-red-600 hover:text-red-700 hover:bg-red-50"><Trash2 className="w-4 h-4" /></Button></TooltipTrigger><TooltipContent><p>Șterge</p></TooltipContent></Tooltip>
                              </div>
                            </TooltipProvider>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {versions.length === 0 && <TableRow><TableCell colSpan={9} className="text-center py-8 text-gray-500">Nu există versiuni</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="omti">
            <Card>
              <CardContent className="p-0">
                {loadingOmti ? (
                  <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
                ) : omtiSnapshots.length === 0 ? (
                  <div className="text-center py-12">
                    <ImageIcon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-500">Nu există imagini OMTI generate.</p>
                    <p className="text-gray-400 text-sm mt-1">Generează o imagine din pagina Organigramă la anexa OMTI.</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b">
                        <TableHead className="text-center border-r w-[120px]">Previzualizare</TableHead>
                        <TableHead className="text-center border-r">Versiune</TableHead>
                        <TableHead className="text-center border-r">Data generării</TableHead>
                        <TableHead className="text-center">Acțiuni</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {omtiSnapshots.map((snap) => (
                        <TableRow key={snap.id} className="border-b">
                          <TableCell className="text-center border-r">
                            <img
                              src={snap.image}
                              alt="OMTI preview"
                              className="w-[100px] h-auto border rounded cursor-pointer mx-auto"
                              onClick={() => handleViewOmtiSnapshot(snap.image)}
                            />
                          </TableCell>
                          <TableCell className="text-center border-r">{snap.version_name || '—'}</TableCell>
                          <TableCell className="text-center border-r">
                            {format(new Date(snap.created_at), 'dd MMM yyyy, HH:mm', { locale: ro })}
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-2">
                              <TooltipProvider>
                                <Tooltip><TooltipTrigger asChild>
                                  <Button variant="ghost" size="sm" onClick={() => handleViewOmtiSnapshot(snap.image)}><Eye className="w-4 h-4" /></Button>
                                </TooltipTrigger><TooltipContent><p>Vezi imagine</p></TooltipContent></Tooltip>
                                <Tooltip><TooltipTrigger asChild>
                                  <Button variant="ghost" size="sm" onClick={() => handleDownloadOmti(snap.image, format(new Date(snap.created_at), 'yyyy-MM-dd_HHmm'))}><Download className="w-4 h-4" /></Button>
                                </TooltipTrigger><TooltipContent><p>Descarcă</p></TooltipContent></Tooltip>
                                <Tooltip><TooltipTrigger asChild>
                                  <Button variant="ghost" size="sm" onClick={() => deleteOmtiMutation.mutate(snap.id)} className="text-red-600 hover:text-red-700 hover:bg-red-50"><Trash2 className="w-4 h-4" /></Button>
                                </TooltipTrigger><TooltipContent><p>Șterge</p></TooltipContent></Tooltip>
                              </TooltipProvider>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Delete Version Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmare ștergere</AlertDialogTitle>
              <AlertDialogDescription>
                Sigur doriți să ștergeți versiunea <span className="font-semibold">{versionToDelete?.version_number}</span>?
                {versionToDelete?.status === 'approved' && (
                  <div className="bg-red-50 border border-red-200 rounded p-2 mt-2"><span className="text-red-800 font-semibold">⚠️ Versiune APROBATĂ!</span></div>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Anulare</AlertDialogCancel>
              <AlertDialogAction onClick={() => versionToDelete && deleteMutation.mutate(versionToDelete.id)} className="bg-red-600 hover:bg-red-700" disabled={deleteMutation.isPending}>
                {deleteMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Se șterge...</> : 'Șterge'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Unapprove Dialog */}
        <AlertDialog open={unapproveDialogOpen} onOpenChange={setUnapproveDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Resetare aprobare</AlertDialogTitle>
              <AlertDialogDescription>Versiunea va reveni la starea de ciornă.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Anulare</AlertDialogCancel>
              <AlertDialogAction onClick={() => versionToUnapprove && unapproveMutation.mutate(versionToUnapprove.id)} className="bg-orange-600 hover:bg-orange-700" disabled={unapproveMutation.isPending}>
                {unapproveMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Se resetează...</> : 'Confirmă'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Snapshot Preview Dialog */}
        <Dialog open={snapshotDialogOpen} onOpenChange={setSnapshotDialogOpen}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-auto">
            <DialogHeader><DialogTitle>Imagine Organigramă</DialogTitle></DialogHeader>
            <div className="flex items-center justify-center p-4">
              {loadingSnapshot ? <Loader2 className="w-8 h-8 animate-spin text-blue-600" /> : snapshotImage ? (
                <img src={snapshotImage} alt="Snapshot" className="max-w-full h-auto border rounded" />
              ) : (
                <div className="text-center py-12"><ImageIcon className="w-16 h-16 mx-auto mb-4 text-gray-400" /><p className="text-gray-500">Nu există imagine</p></div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
