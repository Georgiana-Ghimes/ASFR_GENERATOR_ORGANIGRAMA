import React, { useEffect, useState } from 'react';
import { apiClient } from '@/api/apiClient';

const DeterministicOrgChart = ({ versionId, onSelectUnit, isReadOnly }) => {
  const [layoutData, setLayoutData] = useState(null);
  const [aggregates, setAggregates] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!versionId) return;
    
    const fetchLayout = async () => {
      try {
        setLoading(true);
        const response = await fetch(`http://localhost:8000/api/layout/${versionId}`);
        const data = await response.json();
        
        setLayoutData(data);
        
        // Build aggregates map
        const aggMap = {};
        data.layout.forEach(node => {
          if (node.aggregates) {
            aggMap[node.unit_id] = node.aggregates;
          }
        });
        setAggregates(aggMap);
      } catch (error) {
        console.error('Failed to fetch layout:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchLayout();
  }, [versionId]);

  const getUnitColor = (unitType, stasCode) => {
    if (unitType === 'director_general') {
      return { bg: '#15803d', border: '#14532d', text: '#ffffff' };
    }
    
    if (unitType === 'directie') {
      const colors = {
        '1100': { bg: '#ec4899', border: '#db2777', text: '#ffffff' },
        '1200': { bg: '#eab308', border: '#ca8a04', text: '#000000' },
        '2000': { bg: '#3b82f6', border: '#2563eb', text: '#ffffff' },
        '3000': { bg: '#f97316', border: '#ea580c', text: '#ffffff' },
      };
      return colors[stasCode] || { bg: '#3b82f6', border: '#2563eb', text: '#ffffff' };
    }
    
    if (unitType === 'serviciu') {
      return { bg: '#22c55e', border: '#16a34a', text: '#000000' };
    }
    
    if (unitType === 'compartiment') {
      return { bg: '#ffffff', border: '#d1d5db', text: '#000000' };
    }
    
    if (unitType === 'inspectorat') {
      return { bg: '#3b82f6', border: '#2563eb', text: '#ffffff' };
    }
    
    return { bg: '#ffffff', border: '#d1d5db', text: '#000000' };
  };

  const drawOrthogonalEdge = (edge) => {
    const midY = (edge.from_y + edge.to_y) / 2;
    
    return (
      <g key={`${edge.from}-${edge.to}`}>
        {/* Vertical line from parent */}
        <line
          x1={edge.from_x}
          y1={edge.from_y}
          x2={edge.from_x}
          y2={midY}
          stroke="#94a3b8"
          strokeWidth="2"
        />
        {/* Horizontal line */}
        <line
          x1={edge.from_x}
          y1={midY}
          x2={edge.to_x}
          y2={midY}
          stroke="#94a3b8"
          strokeWidth="2"
        />
        {/* Vertical line to child */}
        <line
          x1={edge.to_x}
          y1={midY}
          x2={edge.to_x}
          y2={edge.to_y}
          stroke="#94a3b8"
          strokeWidth="2"
        />
      </g>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">Generare organigramă...</div>
      </div>
    );
  }

  if (!layoutData || !layoutData.layout.length) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">Nu există unități în această versiune</div>
      </div>
    );
  }

  // Calculate canvas size
  const maxX = Math.max(...layoutData.layout.map(n => n.x + n.width)) + 100;
  const maxY = Math.max(...layoutData.layout.map(n => n.y + n.height)) + 100;

  return (
    <div className="w-full h-full overflow-auto bg-gray-50">
      <svg width={maxX} height={maxY} className="bg-white">
        {/* Draw edges first (behind nodes) */}
        {layoutData.edges && layoutData.edges.map(edge => drawOrthogonalEdge(edge))}
        
        {/* Draw nodes */}
        {layoutData.layout.map(node => {
          const agg = aggregates[node.unit_id] || {
            leadership_positions_count: 0,
            execution_positions_count: 0,
            total_positions: 0
          };
          
          const colors = getUnitColor(node.unit.unit_type, node.unit.stas_code);
          
          return (
            <g
              key={node.unit_id}
              onClick={() => !isReadOnly && onSelectUnit && onSelectUnit(node.unit)}
              className={!isReadOnly ? "cursor-pointer" : ""}
            >
              {/* Box */}
              <rect
                x={node.x}
                y={node.y}
                width={node.width}
                height={node.height}
                fill={colors.bg}
                stroke={colors.border}
                strokeWidth="2"
                rx="4"
              />
              
              {/* Header with code and counts */}
              <rect
                x={node.x}
                y={node.y}
                width={node.width}
                height="20"
                fill={colors.border}
                rx="4"
              />
              
              {/* Code */}
              <text
                x={node.x + 5}
                y={node.y + 14}
                fontSize="10"
                fontWeight="bold"
                fill="#ffffff"
              >
                {node.unit.stas_code}
              </text>
              
              {/* Leadership count */}
              <text
                x={node.x + node.width - 50}
                y={node.y + 14}
                fontSize="10"
                fill="#ffffff"
                textAnchor="middle"
              >
                {agg.leadership_positions_count}
              </text>
              
              {/* Execution count */}
              <text
                x={node.x + node.width - 30}
                y={node.y + 14}
                fontSize="10"
                fill="#ffffff"
                textAnchor="middle"
              >
                {agg.execution_positions_count}
              </text>
              
              {/* Total */}
              <text
                x={node.x + node.width - 10}
                y={node.y + 14}
                fontSize="10"
                fontWeight="bold"
                fill="#ffffff"
                textAnchor="middle"
              >
                {agg.total_positions}
              </text>
              
              {/* Unit name */}
              <text
                x={node.x + node.width / 2}
                y={node.y + 40}
                fontSize="11"
                fontWeight="600"
                fill={colors.text}
                textAnchor="middle"
              >
                {node.unit.name.length > 25 
                  ? node.unit.name.substring(0, 25) + '...'
                  : node.unit.name
                }
              </text>
              
              {/* Recursive total (if has children) */}
              {agg.recursive_total_subordinates > agg.total_positions && (
                <text
                  x={node.x + node.width / 2}
                  y={node.y + 60}
                  fontSize="9"
                  fill={colors.text}
                  textAnchor="middle"
                  opacity="0.7"
                >
                  Total: {agg.recursive_total_subordinates}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export default DeterministicOrgChart;
