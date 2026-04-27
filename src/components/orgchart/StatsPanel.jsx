import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Users, Briefcase, UserCheck } from 'lucide-react';

export default function StatsPanel({ units, layoutData }) {
  const stats = useMemo(() => {
    const totalUnits = units.length;
    
    let totalLeadership = 0;
    let totalExecution = 0;
    let dgCount = 0;
    let directorCount = 0;
    let deptCount = 0;
    let inspectorCount = 0;
    let serviceCount = 0;
    let rootRecursive = 0;
    let rootLeadership = 0;

    if (layoutData && layoutData.layout) {
      // Find root unit (director_general or first without parent)
      const rootNode = layoutData.layout.find(n => n.unit?.unit_type === 'director_general')
        || layoutData.layout.find(n => !n.unit?.parent_unit_id && n.unit?.unit_type !== 'consiliu' && n.unit?.unit_type !== 'legend');

      layoutData.layout.forEach(node => {
        if (!node.aggregates) return;
        if (node.unit?.unit_type === 'consiliu' || node.unit?.unit_type === 'legend') return;

        const lc = node.aggregates.leadership_positions_count || 0;
        totalLeadership += lc;

        if (rootNode && node.unit_id === rootNode.unit_id) {
          rootLeadership = lc;
          rootRecursive = node.aggregates.recursive_total_subordinates || 0;
          dgCount += lc;
        } else if (node.unit?.unit_type === 'directie') {
          directorCount += lc;
        } else if (node.unit?.unit_type === 'departament') {
          deptCount += lc;
        } else if (node.unit?.unit_type === 'serviciu') {
          serviceCount += lc;
        } else if (node.unit?.unit_type === 'inspectorat') {
          inspectorCount += lc;
        }
      });
    }

    // Total = root recursive total (includes DG's own leadership post)
    const totalPositions = rootRecursive > 0 ? rootRecursive : totalLeadership + totalExecution;
    totalExecution = totalPositions - totalLeadership;
    
    const unitsByType = units.reduce((acc, u) => {
      acc[u.unit_type] = (acc[u.unit_type] || 0) + 1;
      return acc;
    }, {});

    return {
      totalUnits,
      totalPositions,
      managementPositions: totalLeadership,
      executionPositions: totalExecution,
      dgCount,
      directorCount,
      deptCount,
      inspectorCount,
      serviceCount,
      unitsByType,
    };
  }, [units, layoutData]);

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