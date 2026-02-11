import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Users, Briefcase, UserCheck } from 'lucide-react';

export default function StatsPanel({ units, positions, employees }) {
  const stats = useMemo(() => {
    const totalUnits = units.length;
    const totalPositions = units.reduce((sum, u) => sum + (u.total_positions || 0), 0);
    const managementPositions = units.reduce((sum, u) => sum + (u.management_positions || 0), 0);
    const executionPositions = units.reduce((sum, u) => sum + (u.execution_positions || 0), 0);
    
    const unitsByType = units.reduce((acc, u) => {
      acc[u.unit_type] = (acc[u.unit_type] || 0) + 1;
      return acc;
    }, {});

    return {
      totalUnits,
      totalPositions,
      managementPositions,
      executionPositions,
      unitsByType,
    };
  }, [units]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Unități</p>
              <p className="text-2xl font-bold">{stats.totalUnits}</p>
            </div>
            <Building2 className="w-8 h-8 text-blue-500 opacity-50" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Posturi</p>
              <p className="text-2xl font-bold">{stats.totalPositions}</p>
            </div>
            <Briefcase className="w-8 h-8 text-green-500 opacity-50" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Posturi Conducere</p>
              <p className="text-2xl font-bold">{stats.managementPositions}</p>
            </div>
            <UserCheck className="w-8 h-8 text-purple-500 opacity-50" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Posturi Execuție</p>
              <p className="text-2xl font-bold">{stats.executionPositions}</p>
            </div>
            <Users className="w-8 h-8 text-orange-500 opacity-50" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}