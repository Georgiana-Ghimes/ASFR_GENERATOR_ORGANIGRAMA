import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const unitTypeColors = {
  director_general: 'bg-green-100 border-green-500 text-green-800',
  directie: 'bg-pink-100 border-pink-500 text-pink-800',
  serviciu: 'bg-yellow-100 border-yellow-500 text-yellow-800',
  compartiment: 'bg-blue-50 border-blue-400 text-blue-800',
  inspectorat: 'bg-blue-100 border-blue-500 text-blue-800',
  birou: 'bg-purple-100 border-purple-500 text-purple-800',
  consiliu: 'bg-gray-100 border-gray-500 text-gray-800',
};

const unitTypeLabels = {
  director_general: 'Director General',
  serviciu: 'Serviciu',
  compartiment: 'Compartiment',
  consilieri: 'Consilieri',
  dispecerat: 'Dispecerat',
  departament: 'Departament',
  directie: 'Direcție',
  inspectorat: 'Inspectorat',
};

export default function UnitCard({ unit, onClick, isSelected, childCount = 0, totalEmployees = 0, allUnits = [] }) {
  // For specific parent units without color, inherit from first child
  const getInheritedColor = () => {
    // Only apply inheritance for these specific units
    const parentToChild = {
      '1000': '1001',
      '2000': '2001', 
      '1100': '1103',
      '3000': '3003',
      '1200': '1210',
    };
    
    const childCode = parentToChild[unit.stas_code];
    if (childCode && allUnits.length > 0) {
      const childUnit = allUnits.find(u => u.stas_code === childCode);
      if (childUnit?.color) {
        return childUnit.color;
      }
    }
    
    return null;
  };
  
  // Check if this unit has children OR is one of the specific parent units
  const isParentUnit = ['1000', '1100', '1200', '2000', '3000'].includes(unit.stas_code);
  const hasChildren = allUnits.some(u => u.parent_id === unit.id) || isParentUnit;
  
  const inheritedColor = getInheritedColor();
  const finalColor = inheritedColor || unit.color;
  const colorClass = finalColor ? '' : unitTypeColors[unit.unit_type] || unitTypeColors.compartiment;
  
  // Parent units get slightly darker background (60% opacity instead of 20%)
  const backgroundOpacity = hasChildren ? '99' : '33';
  
  return (
    <Card
      onClick={() => onClick(unit)}
      className={cn(
        'cursor-pointer transition-all duration-200 border-2 hover:shadow-lg min-w-[180px]',
        colorClass,
        isSelected && 'ring-2 ring-blue-500 ring-offset-2'
      )}
      style={finalColor ? { 
        backgroundColor: finalColor + backgroundOpacity, 
        borderColor: finalColor,
        color: '#1f2937'
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
        </div>
      </div>
    </Card>
  );
}

export { unitTypeColors, unitTypeLabels };