import React, { useEffect, useState } from 'react';
import { apiClient } from '@/api/apiClient';

const DeterministicOrgChart = ({ versionId, onSelectUnit, isReadOnly }) => {
  const [layoutData, setLayoutData] = useState(null);
  const [aggregates, setAggregates] = useState({});
  const [loading, setLoading] = useState(true);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editableTitle, setEditableTitle] = useState('CODIFICAREA STRUCTURILOR DIN ANEXA LA OMTI NR. 48/23.01.2026');
  const [versionData, setVersionData] = useState(null);
  const [draggedNode, setDraggedNode] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [tempPosition, setTempPosition] = useState(null);
  const [nearestParent, setNearestParent] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const svgRef = React.useRef(null);

  const SNAP_DISTANCE = 19; // 0.5cm ≈ 19px
  const GRID_SIZE = 20; // Grid cell size in pixels
  
  const snapToGrid = (value) => {
    return Math.round(value / GRID_SIZE) * GRID_SIZE;
  };

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
        
        // Fetch version data to get chart_title
        const versionResponse = await fetch(`http://localhost:8000/api/versions/${versionId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          }
        });
        const versionInfo = await versionResponse.json();
        setVersionData(versionInfo);
        setEditableTitle(versionInfo.chart_title || 'CODIFICAREA STRUCTURILOR DIN ANEXA LA OMTI NR. 48/23.01.2026');
      } catch (error) {
        console.error('Failed to fetch layout:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchLayout();
  }, [versionId]);

  const findNearestNode = (x, y, excludeId) => {
    if (!layoutData) return null;
    
    let nearest = null;
    let minDistance = SNAP_DISTANCE;
    
    layoutData.layout.forEach(node => {
      if (node.unit_id === excludeId) return;
      
      // Calculate distance from dragged node center to this node center
      const nodeCenterX = node.x + node.width / 2;
      const nodeCenterY = node.y + node.height / 2;
      const distance = Math.sqrt(
        Math.pow(x - nodeCenterX, 2) + Math.pow(y - nodeCenterY, 2)
      );
      
      if (distance < minDistance) {
        minDistance = distance;
        nearest = node;
      }
    });
    
    return nearest;
  };

  const handleMouseDown = (e, node) => {
    if (isReadOnly) return;
    
    e.stopPropagation();
    e.preventDefault();
    
    const svg = e.currentTarget.closest('svg');
    if (!svg) return;
    
    const svgRect = svg.getBoundingClientRect();
    const mouseX = e.clientX - svgRect.left;
    const mouseY = e.clientY - svgRect.top;
    
    setDraggedNode(node);
    setIsDragging(false);
    setDragOffset({
      x: mouseX - node.x,
      y: mouseY - node.y
    });
    setTempPosition({ x: node.x, y: node.y });
  };

  const handleMouseMove = (e) => {
    if (!draggedNode) return;
    
    e.preventDefault();
    
    setIsDragging(true);
    
    const svgRect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - svgRect.left;
    const mouseY = e.clientY - svgRect.top;
    
    const rawX = mouseX - dragOffset.x;
    const rawY = mouseY - dragOffset.y;
    
    // Snap to grid
    const newX = snapToGrid(rawX);
    const newY = snapToGrid(rawY);
    
    setTempPosition({ x: newX, y: newY });
    
    // Find nearest node for snap preview
    const centerX = newX + draggedNode.width / 2;
    const centerY = newY + draggedNode.height / 2;
    const nearest = findNearestNode(centerX, centerY, draggedNode.unit_id);
    setNearestParent(nearest);
  };

  const handleMouseUp = async () => {
    if (!draggedNode || !tempPosition) return;
    
    const wasDragging = isDragging;
    
    // If was actually dragging (not just a click), save position
    if (wasDragging) {
      try {
        // Always save the custom position
        const updateData = {
          custom_x: Math.round(tempPosition.x),
          custom_y: Math.round(tempPosition.y)
        };
        
        // If near another node, also update parent
        if (nearestParent) {
          updateData.parent_unit_id = nearestParent.unit_id;
        }
        
        const response = await fetch(`http://localhost:8000/api/units/${draggedNode.unit_id}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(updateData)
        });
        
        if (response.ok) {
          // Refresh layout
          const layoutResponse = await fetch(`http://localhost:8000/api/layout/${versionId}`);
          const data = await layoutResponse.json();
          setLayoutData(data);
          
          const aggMap = {};
          data.layout.forEach(node => {
            if (node.aggregates) {
              aggMap[node.unit_id] = node.aggregates;
            }
          });
          setAggregates(aggMap);
        }
      } catch (error) {
        console.error('Failed to update position:', error);
      }
    } else {
      // Was just a click, open panel
      if (onSelectUnit && draggedNode.unit) {
        onSelectUnit(draggedNode.unit);
      }
    }
    
    setDraggedNode(null);
    setTempPosition(null);
    setNearestParent(null);
    setIsDragging(false);
  };

  const saveChartTitle = async (newTitle) => {
    try {
      const response = await fetch(`http://localhost:8000/api/versions/${versionId}/chart-title?title=${encodeURIComponent(newTitle)}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to save chart title');
      }
      
      const data = await response.json();
      setEditableTitle(data.chart_title);
    } catch (error) {
      console.error('Failed to save chart title:', error);
      // Revert to previous title on error
      setEditableTitle(versionData?.chart_title || 'CODIFICAREA STRUCTURILOR DIN ANEXA LA OMTI NR. 48/23.01.2026');
    }
  };

  const getUnitColor = (unit) => {
    // Default colors mapping - exact colors from the image
    const colorMap = {
      '#86C67C': { bg: '#86C67C', border: '#6BA85C', text: '#000000' },
      '#E8B4D4': { bg: '#E8B4D4', border: '#D89CC4', text: '#000000' },
      '#F4E03C': { bg: '#F4E03C', border: '#E4D02C', text: '#000000' },
      '#8CB4D4': { bg: '#8CB4D4', border: '#6C94B4', text: '#000000' },
      '#F4A43C': { bg: '#F4A43C', border: '#E4942C', text: '#000000' },
    };
    
    // If unit has a color set, use it
    if (unit.color && colorMap[unit.color]) {
      return colorMap[unit.color];
    }
    
    // Default color for director_general - dark green
    if (unit.unit_type === 'director_general') {
      return { bg: '#4A7C4E', border: '#3A6C3E', text: '#ffffff' };
    }
    
    // Default fallback - white
    return { bg: '#ffffff', border: '#d1d5db', text: '#000000' };
  };

  const drawOrthogonalEdge = (edge) => {
    // Special case for consiliu to DG - simple vertical line
    if (edge.from === 'consiliu') {
      return (
        <g key={`${edge.from}-${edge.to}`}>
          <line
            x1={edge.from_x}
            y1={edge.from_y}
            x2={edge.to_x}
            y2={edge.to_y}
            stroke="#94a3b8"
            strokeWidth="2"
          />
        </g>
      );
    }
    
    // Regular edges with orthogonal lines
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

  // Calculate canvas size - ensure minimum width for consiliu
  const consiliu_height = 150;
  const minWidth = 1400;
  const maxX = layoutData && layoutData.layout.length > 0 
    ? Math.max(minWidth, ...layoutData.layout.map(n => n.x + n.width + 100))
    : minWidth;
  const maxY = layoutData && layoutData.layout.length > 0 
    ? Math.max(...layoutData.layout.map(n => n.y + n.height)) + 100 
    : 900;

  return (
    <div className="w-full h-full overflow-auto bg-white">
      <div className="p-4" style={{ minWidth: '1400px', minHeight: '900px' }}>
        {/* Top row: Legend (stânga) | Director (dreapta) */}
        <div className="flex justify-between items-start mb-2">
          {/* Legend - stânga sus */}
          <div className="text-[9px] border-2 border-gray-800 p-2 bg-gray-50">
            {layoutData && layoutData.layout.length > 0 && (() => {
              // Calculate totals from all units
              let totalLeadership = 0;
              let totalExecution = 0;
              let dgCount = 0;
              let directorCount = 0;
              let deptCount = 0;
              let inspectorCount = 0;
              let serviceCount = 0;

              layoutData.layout.forEach(node => {
                const agg = aggregates[node.unit_id] || { leadership_positions_count: 0, execution_positions_count: 0 };
                totalLeadership += agg.leadership_positions_count;
                totalExecution += agg.execution_positions_count;

                // Count by type
                if (node.unit.unit_type === 'director_general') dgCount += agg.leadership_positions_count;
                else if (node.unit.unit_type === 'directie') directorCount += agg.leadership_positions_count;
                else if (node.unit.unit_type === 'serviciu') serviceCount += agg.leadership_positions_count;
                else if (node.unit.unit_type === 'inspectorat') inspectorCount += agg.leadership_positions_count;
              });

              const totalPosts = totalLeadership + totalExecution;

              return (
                <>
                  <div className="font-bold mb-1">TOTAL POSTURI: {totalPosts}</div>
                  <div className="mb-1">Funcții de conducere: {totalLeadership}</div>
                  <div className="ml-2">- Director general: {dgCount}</div>
                  <div className="ml-2">- Director: {directorCount}</div>
                  <div className="ml-2">- Inspector șef teritorial: {inspectorCount}</div>
                  <div className="ml-2">- Șef serviciu: {serviceCount}</div>
                  <div className="mt-1">Posturi de execuție: {totalExecution}</div>
                </>
              );
            })()}
          </div>

          {/* Director - dreapta sus */}
          <div className="text-right text-[10px] text-gray-900">
            <div className="font-bold">DIRECTOR GENERAL</div>
            <div>Petru BOGDAN</div>
          </div>
        </div>

        {!layoutData || !layoutData.layout.length ? (
          <div className="p-8 text-center text-gray-500">
            Nu există structură organizațională. Adaugă unități pentru a construi organigrama.
          </div>
        ) : (
          <div style={{ position: 'relative' }}>
            {/* Editing overlay */}
            {isEditingTitle && (
              <div style={{ 
                position: 'absolute', 
                top: '14px', 
                left: '50%', 
                transform: 'translateX(-50%)',
                zIndex: 10
              }}>
                <input
                  type="text"
                  value={editableTitle}
                  onChange={(e) => setEditableTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      saveChartTitle(editableTitle);
                      setIsEditingTitle(false);
                    } else if (e.key === 'Escape') {
                      setEditableTitle(versionData?.chart_title || 'CODIFICAREA STRUCTURILOR DIN ANEXA LA OMTI NR. 48/23.01.2026');
                      setIsEditingTitle(false);
                    }
                  }}
                  onBlur={() => {
                    saveChartTitle(editableTitle);
                    setIsEditingTitle(false);
                  }}
                  autoFocus
                  className="text-center text-[10px] border border-blue-500 px-2 py-1 rounded outline-none bg-white"
                  style={{ width: '600px' }}
                />
              </div>
            )}
            
            <svg 
              ref={svgRef}
              width={maxX} 
              height={maxY} 
              className="bg-white mx-auto"
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              {/* Grid pattern */}
              <defs>
                <pattern
                  id="grid"
                  width={GRID_SIZE}
                  height={GRID_SIZE}
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d={`M ${GRID_SIZE} 0 L 0 0 0 ${GRID_SIZE}`}
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWidth="0.5"
                  />
                </pattern>
              </defs>
              
              {/* Grid background - only show when dragging */}
              {draggedNode && (
                <rect
                  width={maxX}
                  height={maxY}
                  fill="url(#grid)"
                />
              )}
              
              {/* Header text - centered with consiliu */}
              <text
                x={maxX / 2}
                y="10"
                fontSize="10"
                fontWeight="bold"
                textAnchor="middle"
                fill="#000000"
              >
                AUTORITATEA DE SIGURANȚĂ FEROVIARĂ ROMÂNĂ - ASFR
              </text>
              
              {/* Editable title with hover background */}
              <g>
                {!isReadOnly && (
                  <rect
                    x={maxX / 2 - 300}
                    y="14"
                    width="600"
                    height="14"
                    fill="transparent"
                    className="hover:fill-gray-100"
                    style={{ cursor: 'pointer' }}
                    onClick={() => setIsEditingTitle(true)}
                  />
                )}
                
                <text
                  x={maxX / 2}
                  y="24"
                  fontSize="10"
                  textAnchor="middle"
                  fill="#000000"
                  style={{ 
                    opacity: isEditingTitle ? 0 : 1,
                    pointerEvents: 'none'
                  }}
                >
                  {editableTitle}
                </text>
                
                {!isReadOnly && !isEditingTitle && (
                  <title>Click pentru a edita</title>
                )}
              </g>
            
            {/* Draw consiliu box in SVG - CENTERED in canvas */}
            <g>
              <rect
                x={(maxX - 300) / 2}
                y="35"
                width="300"
                height="40"
                fill="white"
                stroke="#1f2937"
                strokeWidth="2"
              />
              <text
                x={maxX / 2}
                y="60"
                fontSize="16"
                fontWeight="bold"
                textAnchor="middle"
                fill="#000000"
              >
                CONSILIUL DE CONDUCERE
              </text>
            </g>
            
            {/* Draw edges (including consiliu to DG) */}
            {layoutData.edges && layoutData.edges.map(edge => drawOrthogonalEdge(edge))}
            
            {/* Draw nodes */}
            {layoutData.layout.map(node => {
              const agg = aggregates[node.unit_id] || {
                leadership_positions_count: 0,
                execution_positions_count: 0,
                total_positions: 0
              };
              
              const colors = getUnitColor(node.unit);
              
              // Use temp position if this node is being dragged
              const isBeingDragged = draggedNode?.unit_id === node.unit_id;
              const x = isBeingDragged && tempPosition ? tempPosition.x : node.x;
              const y = isBeingDragged && tempPosition ? tempPosition.y : node.y;
              
              // Debug log for first node only
              if (node.unit.unit_type === 'director_general' && draggedNode) {
                console.log('Rendering DG:', { 
                  isBeingDragged, 
                  draggedNodeId: draggedNode?.unit_id, 
                  nodeId: node.unit_id,
                  tempPosition,
                  x, 
                  y,
                  originalX: node.x,
                  originalY: node.y
                });
              }
              
              // Highlight if this is the nearest parent
              const isNearestParent = nearestParent?.unit_id === node.unit_id;
              
              return (
                <g
                  key={node.unit_id}
                  data-unit-id={node.unit_id}
                  onMouseDown={(e) => {
                    if (!isReadOnly) {
                      handleMouseDown(e, node);
                    }
                  }}
                  style={{ 
                    cursor: !isReadOnly ? 'move' : 'default',
                    pointerEvents: 'all'
                  }}
                >
                  {/* Main box - white background with thick black border */}
                  <rect
                    x={x}
                    y={y}
                    width={node.width}
                    height={node.height}
                    fill="#ffffff"
                    stroke={isNearestParent ? "#10b981" : "#000000"}
                    strokeWidth={isNearestParent ? "4" : "3"}
                    rx="6"
                    opacity={isBeingDragged ? 0.7 : 1}
                  />
                  
                  {/* Left colored strip - vertical with 3 columns of numbers (with rounded corners to match border) */}
                  <rect
                    x={x + 1.5}
                    y={y + 1.5}
                    width="98.5"
                    height={node.height - 3}
                    fill={colors.bg}
                    stroke="none"
                    rx="4.5"
                    opacity={isBeingDragged ? 0.7 : 1}
                  />
                  
                  {/* Vertical line between code and leadership count - full height */}
                  <line
                    x1={x + 40}
                    y1={y}
                    x2={x + 40}
                    y2={y + node.height}
                    stroke="#000000"
                    strokeWidth="1"
                  />
                  
                  {/* Vertical line between leadership and execution count - full height */}
                  <line
                    x1={x + 70}
                    y1={y}
                    x2={x + 70}
                    y2={y + node.height}
                    stroke="#000000"
                    strokeWidth="1"
                  />
                  
                  {/* Vertical line between numbers and name - full height */}
                  <line
                    x1={x + 100}
                    y1={y}
                    x2={x + 100}
                    y2={y + node.height}
                    stroke="#000000"
                    strokeWidth="1"
                  />
                  
                  {/* Code - first column in left strip (wider) */}
                  <text
                    x={x + 20}
                    y={y + node.height / 2 + 4}
                    fontSize="11"
                    fontWeight="bold"
                    fill="#000000"
                    textAnchor="middle"
                  >
                    {node.unit.stas_code}
                  </text>
                  
                  {/* Leadership count - second column in left strip */}
                  <text
                    x={x + 55}
                    y={y + node.height / 2 + 4}
                    fontSize="12"
                    fontWeight="bold"
                    fill="#000000"
                    textAnchor="middle"
                  >
                    {agg.leadership_positions_count}
                  </text>
                  
                  {/* Execution count - third column in left strip */}
                  <text
                    x={x + 85}
                    y={y + node.height / 2 + 4}
                    fontSize="12"
                    fontWeight="bold"
                    fill="#000000"
                    textAnchor="middle"
                  >
                    {agg.recursive_total_subordinates > agg.total_positions
                      ? agg.recursive_total_subordinates - agg.leadership_positions_count
                      : agg.execution_positions_count}
                  </text>
                  
                  {/* Unit name - on white background to the right */}
                  <foreignObject
                    x={x + 104}
                    y={y + 4}
                    width={node.width - 108}
                    height={node.height - 8}
                  >
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textAlign: 'center',
                        fontSize: '11px',
                        fontWeight: '600',
                        color: '#000000',
                        lineHeight: '1.4',
                        padding: '4px 8px',
                        wordWrap: 'break-word',
                        overflow: 'hidden',
                        hyphens: 'auto',
                        opacity: isBeingDragged ? 0.7 : 1
                      }}
                    >
                      {node.unit.name}
                    </div>
                  </foreignObject>
                </g>
              );
            })}
          </svg>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeterministicOrgChart;
