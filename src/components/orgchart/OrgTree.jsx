import React, { useMemo } from 'react';
import UnitCard from './UnitCard';
import { cn } from '@/lib/utils';

function buildTree(units) {
  const unitMap = {};
  const roots = [];
  
  units.forEach(unit => {
    unitMap[unit.id] = { ...unit, children: [] };
  });
  
  units.forEach(unit => {
    if (unit.parent_unit_id && unitMap[unit.parent_unit_id]) {
      unitMap[unit.parent_unit_id].children.push(unitMap[unit.id]);
    } else if (!unit.parent_unit_id) {
      roots.push(unitMap[unit.id]);
    }
  });
  
  // Sort children by order_index
  Object.values(unitMap).forEach(unit => {
    unit.children.sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
  });
  
  return roots.sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
}

function countDescendants(node) {
  let count = node.children.length;
  node.children.forEach(child => {
    count += countDescendants(child);
  });
  return count;
}

function TreeNode({ node, level = 0, onSelect, selectedId, isLast = false }) {
  const hasChildren = node.children && node.children.length > 0;
  
  return (
    <div className="relative">
      <div className="flex items-start">
        {level > 0 && (
          <div className="flex items-center">
            <div className={cn(
              "w-8 border-t-2 border-gray-300",
              isLast ? "border-l-2 rounded-bl-lg" : ""
            )} />
          </div>
        )}
        <div className="py-2">
          <UnitCard
            unit={node}
            onClick={() => onSelect(node)}
            isSelected={selectedId === node.id}
            childCount={node.children?.length || 0}
          />
        </div>
      </div>
      
      {hasChildren && (
        <div className={cn(
          "ml-4 pl-4",
          level > 0 && "border-l-2 border-gray-300"
        )}>
          {node.children.map((child, idx) => (
            <TreeNode
              key={child.id}
              node={child}
              level={level + 1}
              onSelect={onSelect}
              selectedId={selectedId}
              isLast={idx === node.children.length - 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function OrgTree({ units, onSelect, selectedId }) {
  const tree = useMemo(() => buildTree(units), [units]);
  
  if (tree.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        Nu există unități organizaționale. Adăugați prima unitate.
      </div>
    );
  }
  
  return (
    <div className="p-4 overflow-auto">
      {tree.map((root, idx) => (
        <TreeNode
          key={root.id}
          node={root}
          onSelect={onSelect}
          selectedId={selectedId}
          isLast={idx === tree.length - 1}
        />
      ))}
    </div>
  );
}

export { buildTree };