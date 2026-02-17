import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const unitTypeColors = {
  director_general: 'bg-green-100 border-green-500 text-green-800',
  directie: 'bg-pink-100 border-pink-500 text-pink-800',
  serviciu: 'bg-yellow-100 border-yellow-500 text-yellow-800',
  compartiment: 'bg-white border-gray-400 text-gray-800',
  inspectorat: 'bg-blue-100 border-blue-500 text-blue-800',
  birou: 'bg-purple-100 border-purple-500 text-purple-800',
};

const unitTypeLabels = {
  director_general: 'Director General',
  directie: 'Direcție',
  serviciu: 'Serviciu',
  compartiment: 'Compartiment',
  inspectorat: 'Inspectorat',
  birou: 'Birou',
};

export default function UnitCard({ unit, onClick, isSelected, childCount = 0, totalEmployees = 0 }) {
  const colorClass = unit.color ? '' : unitTypeColors[unit.unit_type] || unitTypeColors.compartiment;
  
  return (
    <Card
      onClick={onClick}
      className={cn(
        'cursor-pointer transition-all duration-200 border-2 hover:shadow-lg min-w-[180px]',
        colorClass,
        isSelected && 'ring-2 ring-blue-500 ring-offset-2'
      )}
      style={unit.color ? { 
        backgroundColor: unit.color + '20', 
        borderColor: unit.color,
        color: unit.color 
      } : {}}
    >
      <div className="p-3">
        <div className="flex items-center justify-between mb-1">
          <Badge variant="outline" className="text-xs font-mono">
            {unit.stas_code}
          </Badge>
          {childCount > 0 && (
            <ChevronRight className="w-4 h-4 text-gray-400" />
          )}
        </div>
        <h3 className="font-semibold text-sm leading-tight mb-2 line-clamp-2">
          {unit.name}
        </h3>
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-600">
            {unitTypeLabels[unit.unit_type]}
          </span>
          <div className="flex items-center gap-1 text-gray-600">
            <Users className="w-3 h-3" />
            <span>{unit.leadership_count || 0}</span>
            <span>/</span>
            <span>{(unit.leadership_count || 0) + (unit.execution_count || 0)}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}

export { unitTypeColors, unitTypeLabels };