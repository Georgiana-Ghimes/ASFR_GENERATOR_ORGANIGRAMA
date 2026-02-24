import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, FileCheck, Clock, Edit3, CheckCircle } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

const statusConfig = {
  draft: { label: 'Ciornă', color: 'bg-yellow-100 text-yellow-800', icon: Edit3 },
  pending_approval: { label: 'În aprobare', color: 'bg-blue-100 text-blue-800', icon: Clock },
  approved: { label: 'Aprobat', color: 'bg-green-100 text-green-800', icon: FileCheck },
};

export default function VersionSelector({ versions, selectedVersion, onSelect, onNewVersion, onApprove, hideStatus = false }) {
  const isDraft = selectedVersion?.status === 'draft';
  const isApproved = selectedVersion?.status === 'approved';
  
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-600">Versiune:</span>
        <Select value={selectedVersion?.id || ''} onValueChange={onSelect}>
          <SelectTrigger className="w-[280px]">
            <SelectValue placeholder="Selectați versiunea" />
          </SelectTrigger>
          <SelectContent>
            {versions.map((v) => {
              const status = statusConfig[v.status];
              const StatusIcon = status.icon;
              return (
                <SelectItem key={v.id} value={v.id}>
                  <div className="flex items-center gap-2">
                    <StatusIcon className="w-4 h-4" />
                    <span>{v.version_number} - {v.name}</span>
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>
      
      {!hideStatus && selectedVersion && (
        <Badge className={statusConfig[selectedVersion.status]?.color}>
          {statusConfig[selectedVersion.status]?.label}
        </Badge>
      )}
      
      {isDraft && onApprove && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="default" size="sm" className="bg-green-600 hover:bg-green-700">
              <CheckCircle className="w-4 h-4 mr-1" />
              Aprobă
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Aprobare versiune</AlertDialogTitle>
              <AlertDialogDescription>
                Sunteți sigur că doriți să aprobați această versiune? 
                După aprobare, versiunea va deveni read-only și nu veți mai putea face modificări.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Anulare</AlertDialogCancel>
              <AlertDialogAction 
                onClick={onApprove}
                className="bg-green-600 hover:bg-green-700"
              >
                Confirmă aprobarea
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
      
      {isApproved && onNewVersion && (
        <Button variant="outline" size="sm" onClick={onNewVersion}>
          <Plus className="w-4 h-4 mr-1" />
          Versiune Nouă
        </Button>
      )}
    </div>
  );
}

export { statusConfig };
