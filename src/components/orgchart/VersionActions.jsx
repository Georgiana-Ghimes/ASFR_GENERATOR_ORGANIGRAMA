import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { CheckCircle, Copy, Loader2 } from 'lucide-react';

export default function VersionActions({ 
  version, 
  onApprove, 
  onClone,
  isCloning 
}) {
  if (!version) return null;

  const isDraft = version.status === 'draft';
  const isApproved = version.status === 'approved';

  return (
    <div className="flex items-center gap-2">
      {isDraft && (
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

      {isApproved && (
        <Button 
          variant="default" 
          size="sm"
          onClick={onClone}
          disabled={isCloning}
        >
          {isCloning ? (
            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
          ) : (
            <Copy className="w-4 h-4 mr-1" />
          )}
          Versiune Nouă
        </Button>
      )}
    </div>
  );
}