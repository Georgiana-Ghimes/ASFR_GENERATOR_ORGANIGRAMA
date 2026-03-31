// @ts-nocheck
import React, { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, FileCheck, Clock, Edit3, CheckCircle, Pencil, Check, X } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

const statusConfig = {
  draft: { label: 'Ciornă', color: 'bg-yellow-100 text-yellow-800', icon: Edit3 },
  pending_approval: { label: 'În aprobare', color: 'bg-blue-100 text-blue-800', icon: Clock },
  approved: { label: 'Aprobat', color: 'bg-green-100 text-green-800', icon: FileCheck },
};

export default function VersionSelector({ versions, selectedVersion, onSelect, onNewVersion, onApprove, onRename, hideStatus = false }) {
  const isDraft = selectedVersion?.status === 'draft';
  const isApproved = selectedVersion?.status === 'approved';
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');

  const handleStartEdit = () => {
    if (!selectedVersion) return;
    setEditName(selectedVersion.name);
    setIsEditing(true);
  };

  const handleSave = () => {
    if (onRename && editName.trim()) {
      onRename(selectedVersion.id, editName.trim());
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-600">Versiune:</span>
        {isEditing ? (
          <div className="flex items-center gap-1">
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave();
                if (e.key === 'Escape') handleCancel();
              }}
              autoFocus
              className="w-[260px] h-9 px-3 border border-blue-500 rounded-md text-sm outline-none"
            />
            <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600" onClick={handleSave}>
              <Check className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400" onClick={handleCancel}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <>
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
            {isDraft && onRename && (
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleStartEdit} title="Editează numele versiunii">
                <Pencil className="w-3.5 h-3.5 text-gray-500" />
              </Button>
            )}
          </>
        )}
      </div>
      
      {!hideStatus && selectedVersion && !isEditing && (
        <Badge className={statusConfig[selectedVersion.status]?.color}>
          {statusConfig[selectedVersion.status]?.label}
        </Badge>
      )}
      
      {isDraft && onApprove && !isEditing && (
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
      
      {isApproved && onNewVersion && !isEditing && (
        <Button variant="outline" size="sm" onClick={onNewVersion}>
          <Plus className="w-4 h-4 mr-1" />
          Versiune Nouă
        </Button>
      )}
    </div>
  );
}

export { statusConfig };
