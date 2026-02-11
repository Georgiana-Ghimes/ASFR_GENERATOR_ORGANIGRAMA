import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, FileCheck, Clock, Edit3 } from 'lucide-react';

const statusConfig = {
  draft: { label: 'Ciornă', color: 'bg-yellow-100 text-yellow-800', icon: Edit3 },
  pending_approval: { label: 'În aprobare', color: 'bg-blue-100 text-blue-800', icon: Clock },
  approved: { label: 'Aprobat', color: 'bg-green-100 text-green-800', icon: FileCheck },
};

export default function VersionSelector({ versions, selectedVersion, onSelect, onNewVersion }) {
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
      
      {selectedVersion && (
        <Badge className={statusConfig[selectedVersion.status]?.color}>
          {statusConfig[selectedVersion.status]?.label}
        </Badge>
      )}
      
      <Button variant="outline" size="sm" onClick={onNewVersion}>
        <Plus className="w-4 h-4 mr-1" />
        Versiune Nouă
      </Button>
    </div>
  );
}

export { statusConfig };