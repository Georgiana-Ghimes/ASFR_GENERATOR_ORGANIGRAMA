import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { CheckCircle, Send, FileDown, Copy, Loader2 } from 'lucide-react';

export default function VersionActions({ 
  version, 
  onSubmitForApproval, 
  onApprove, 
  onExportPdf,
  onDuplicate,
  userRole,
  isExporting 
}) {
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [newVersionNumber, setNewVersionNumber] = useState('');
  const [newVersionName, setNewVersionName] = useState('');

  if (!version) return null;

  const isDraft = version.status === 'draft';
  const isPending = version.status === 'pending_approval';
  const isApproved = version.status === 'approved';

  const canEdit = isDraft && (userRole === 'editor' || userRole === 'admin');
  const canSubmit = isDraft && (userRole === 'editor' || userRole === 'admin');
  const canApprove = isPending && (userRole === 'approver' || userRole === 'admin');

  const handleDuplicate = () => {
    onDuplicate(newVersionNumber, newVersionName);
    setShowDuplicateDialog(false);
    setNewVersionNumber('');
    setNewVersionName('');
  };

  return (
    <div className="flex items-center gap-2">
      {canSubmit && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Send className="w-4 h-4 mr-1" />
              Trimite pentru aprobare
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmare trimitere</AlertDialogTitle>
              <AlertDialogDescription>
                Sunteți sigur că doriți să trimiteți această versiune pentru aprobare? 
                După trimitere, nu veți mai putea face modificări.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Anulare</AlertDialogCancel>
              <AlertDialogAction onClick={onSubmitForApproval}>
                Trimite
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {canApprove && (
        <>
          <Button 
            variant="default" 
            size="sm"
            className="bg-green-600 hover:bg-green-700"
            onClick={() => setShowApproveDialog(true)}
          >
            <CheckCircle className="w-4 h-4 mr-1" />
            Aprobă
          </Button>
          
          <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Aprobare versiune</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Note aprobare (opțional)</Label>
                  <Textarea
                    value={approvalNotes}
                    onChange={(e) => setApprovalNotes(e.target.value)}
                    placeholder="Adăugați note sau comentarii..."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowApproveDialog(false)}>
                  Anulare
                </Button>
                <Button 
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => {
                    onApprove(approvalNotes);
                    setShowApproveDialog(false);
                    setApprovalNotes('');
                  }}
                >
                  Confirmă aprobarea
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}

      {isApproved && (
        <Button 
          variant="outline" 
          size="sm"
          onClick={onExportPdf}
          disabled={isExporting}
        >
          {isExporting ? (
            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
          ) : (
            <FileDown className="w-4 h-4 mr-1" />
          )}
          Export PDF
        </Button>
      )}

      <Button 
        variant="ghost" 
        size="sm"
        onClick={() => setShowDuplicateDialog(true)}
      >
        <Copy className="w-4 h-4 mr-1" />
        Duplică
      </Button>

      <Dialog open={showDuplicateDialog} onOpenChange={setShowDuplicateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Duplicare versiune</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Număr versiune nouă *</Label>
              <Input
                value={newVersionNumber}
                onChange={(e) => setNewVersionNumber(e.target.value)}
                placeholder="ex: v2.0"
              />
            </div>
            <div>
              <Label>Denumire versiune *</Label>
              <Input
                value={newVersionName}
                onChange={(e) => setNewVersionName(e.target.value)}
                placeholder="ex: Organigramă 2026"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDuplicateDialog(false)}>
              Anulare
            </Button>
            <Button 
              onClick={handleDuplicate}
              disabled={!newVersionNumber || !newVersionName}
            >
              Creează
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}