import React, { useState } from 'react';
import { apiClient } from '@/api/apiClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';
import { FileCheck, Clock, Edit3, Eye, Calendar as CalendarIcon, User, Loader2, Trash2, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

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
  const queryClient = useQueryClient();

  const { data: versions = [], isLoading } = useQuery({
    queryKey: ['versions'],
    queryFn: () => apiClient.listVersions(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => apiClient.deleteVersion(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['versions']);
      toast.success('Versiune ștearsă cu succes');
      setDeleteDialogOpen(false);
      setVersionToDelete(null);
    },
    onError: (error) => {
      toast.error(error.message || 'Eroare la ștergerea versiunii');
    },
  });

  const unapproveMutation = useMutation({
    mutationFn: (id) => apiClient.updateVersion(id, { status: 'draft', approved_by: null, approved_at: null }),
    onSuccess: () => {
      queryClient.invalidateQueries(['versions']);
      toast.success('Aprobarea a fost resetată cu succes');
      setUnapproveDialogOpen(false);
      setVersionToUnapprove(null);
    },
    onError: (error) => {
      toast.error(error.message || 'Eroare la resetarea aprobării');
    },
  });

  const updateValidityMutation = useMutation({
    mutationFn: ({ id, validFrom, validUntil }) => apiClient.updateVersionValidity(id, validFrom, validUntil),
    onSuccess: () => {
      queryClient.invalidateQueries(['versions']);
      toast.success('Perioada de validitate actualizată');
    },
    onError: (error) => {
      toast.error(error.message || 'Eroare la actualizarea perioadei');
    },
  });

  const handleDeleteClick = (version) => {
    setVersionToDelete(version);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (versionToDelete) {
      deleteMutation.mutate(versionToDelete.id);
    }
  };

  const handleUnapproveClick = (version) => {
    setVersionToUnapprove(version);
    setUnapproveDialogOpen(true);
  };

  const handleConfirmUnapprove = () => {
    if (versionToUnapprove) {
      unapproveMutation.mutate(versionToUnapprove.id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Istoric Versiuni</h1>
            <p className="text-gray-500">Toate versiunile organigramei</p>
          </div>
          <Link to={createPageUrl('OrgChart')}>
            <Button>
              <Eye className="w-4 h-4 mr-2" />
              Vezi Organigrama
            </Button>
          </Link>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-b">
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
                      <TableCell className="font-mono font-medium text-center border-r">
                        {version.version_number}
                      </TableCell>
                      <TableCell className="text-center border-r">{version.name}</TableCell>
                      <TableCell className="text-center border-r">
                        <Badge className={`${status.color} border`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {status.label}
                        </Badge>
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
                            <Calendar
                              mode="single"
                              selected={version.valid_from ? new Date(version.valid_from) : undefined}
                              onSelect={(date) => {
                                if (date) {
                                  updateValidityMutation.mutate({
                                    id: version.id,
                                    validFrom: format(date, 'yyyy-MM-dd'),
                                    validUntil: version.valid_until ? format(new Date(version.valid_until), 'yyyy-MM-dd') : null
                                  });
                                }
                              }}
                              locale={ro}
                            />
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
                            <Calendar
                              mode="single"
                              selected={version.valid_until ? new Date(version.valid_until) : undefined}
                              onSelect={(date) => {
                                if (date) {
                                  updateValidityMutation.mutate({
                                    id: version.id,
                                    validFrom: version.valid_from ? format(new Date(version.valid_from), 'yyyy-MM-dd') : null,
                                    validUntil: format(date, 'yyyy-MM-dd')
                                  });
                                }
                              }}
                              locale={ro}
                            />
                          </PopoverContent>
                        </Popover>
                      </TableCell>
                      <TableCell className="min-w-[180px] text-center border-r">
                        {version.approved_by_name ? (
                          <div className="flex items-center justify-center gap-1 text-gray-600">
                            <User className="w-3 h-3 flex-shrink-0" />
                            <span className="whitespace-nowrap">{version.approved_by_name}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center border-r">
                        {version.approved_at ? (
                          format(new Date(version.approved_at), 'dd MMM yyyy', { locale: ro })
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Link to={`${createPageUrl('OrgChart')}?version=${version.id}`}>
                            <Button variant="ghost" size="sm">
                              <Eye className="w-4 h-4 mr-1" />
                              Vezi
                            </Button>
                          </Link>
                          {version.status === 'approved' && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleUnapproveClick(version)}
                              className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                            >
                              <RotateCcw className="w-4 h-4 mr-1" />
                              Resetare
                            </Button>
                          )}
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDeleteClick(version)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {versions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      Nu există versiuni
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmare ștergere</AlertDialogTitle>
              <AlertDialogDescription>
                Sigur doriți să ștergeți versiunea <span className="font-semibold">{versionToDelete?.version_number}</span> ({versionToDelete?.name})?
                <br /><br />
                {versionToDelete?.status === 'approved' && (
                  <div className="bg-red-50 border border-red-200 rounded p-2 mb-2">
                    <span className="text-red-800 font-semibold">⚠️ ATENȚIE: Această versiune este APROBATĂ!</span>
                    <br />
                    Ștergerea unei versiuni aprobate poate afecta rapoartele și istoricul oficial.
                  </div>
                )}
                Această acțiune va șterge permanent versiunea și toate datele asociate (unități, posturi, etc.).
                <br />
                <span className="font-semibold text-red-600">Această acțiune NU poate fi anulată!</span>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Anulare</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmDelete}
                className="bg-red-600 hover:bg-red-700"
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Se șterge...
                  </>
                ) : (
                  'Șterge'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Unapprove Confirmation Dialog */}
        <AlertDialog open={unapproveDialogOpen} onOpenChange={setUnapproveDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Resetare aprobare</AlertDialogTitle>
              <AlertDialogDescription>
                Sunteți sigur că doriți să resetați aprobarea versiunii <span className="font-semibold">{versionToUnapprove?.version_number}</span> ({versionToUnapprove?.name})?
                <br /><br />
                Versiunea va reveni la starea de <span className="font-semibold">ciornă</span> și va putea fi editată din nou.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Anulare</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmUnapprove}
                className="bg-orange-600 hover:bg-orange-700"
                disabled={unapproveMutation.isPending}
              >
                {unapproveMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Se resetează...
                  </>
                ) : (
                  'Confirmă resetarea'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}