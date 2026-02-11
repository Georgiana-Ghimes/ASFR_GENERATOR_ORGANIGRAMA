import React from 'react';
import { apiClient } from '@/api/apiClient';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';
import { FileCheck, Clock, Edit3, Eye, Calendar, User, Loader2 } from 'lucide-react';

const statusConfig = {
  draft: { label: 'Ciornă', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Edit3 },
  pending_approval: { label: 'În aprobare', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: Clock },
  approved: { label: 'Aprobat', color: 'bg-green-100 text-green-800 border-green-200', icon: FileCheck },
};

export default function VersionsPage() {
  const { data: versions = [], isLoading } = useQuery({
    queryKey: ['versions'],
    queryFn: () => apiClient.listVersions(),
  });

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
                <TableRow>
                  <TableHead>Versiune</TableHead>
                  <TableHead>Denumire</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data Creare</TableHead>
                  <TableHead>Aprobat de</TableHead>
                  <TableHead>Data Aprobare</TableHead>
                  <TableHead>Acțiuni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {versions.map((version) => {
                  const status = statusConfig[version.status];
                  const StatusIcon = status.icon;
                  
                  return (
                    <TableRow key={version.id}>
                      <TableCell className="font-mono font-medium">
                        {version.version_number}
                      </TableCell>
                      <TableCell>{version.name}</TableCell>
                      <TableCell>
                        <Badge className={`${status.color} border`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(version.created_date), 'dd MMM yyyy', { locale: ro })}
                        </div>
                      </TableCell>
                      <TableCell>
                        {version.approved_by ? (
                          <div className="flex items-center gap-1 text-gray-600">
                            <User className="w-3 h-3" />
                            {version.approved_by}
                          </div>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {version.approved_date ? (
                          format(new Date(version.approved_date), 'dd MMM yyyy HH:mm', { locale: ro })
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Link to={`${createPageUrl('OrgChart')}?version=${version.id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4 mr-1" />
                            Vezi
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {versions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      Nu există versiuni
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}