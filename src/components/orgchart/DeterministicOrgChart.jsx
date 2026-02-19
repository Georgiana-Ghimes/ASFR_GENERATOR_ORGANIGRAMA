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
  const [draggedFixedElement, setDraggedFixedElement] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [tempPosition, setTempPosition] = useState(null);
  const [nearestParent, setNearestParent] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [resizingNode, setResizingNode] = useState(null);
  const [tempHeight, setTempHeight] = useState(null);
  const [tempWidth, setTempWidth] = useState(null);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStartPos, setResizeStartPos] = useState({ x: 0, y: 0 });
  const svgRef = React.useRef(null);

  // Fixed elements positions (legend, director, consiliu, headers)
  const [fixedElements, setFixedElements] = useState({
    legend: { x: 20, y: 20, width: 200, height: 100 },
    director: { x: 1180, y: 20, width: 200, height: 60 },
    header1: { x: 500, y: 120, width: 400, height: 20 },
    header2: { x: 500, y: 140, width: 400, height: 20 },
    consiliu: { x: 600, y: 180, width: 300, height: 60 }
  });

  const SNAP_DISTANCE = 19; // 0.5cm ≈ 19px
  const GRID_SIZE = 20; // Grid cell size in pixels
  
  const snapToGrid = (value) => {
    return Math.round(value / GRID_SIZE) * GRID_SIZE;
  };

  useEffect(() => {
    if (!versionId) return;
    
    // Load fixed elements positions from localStorage
    const savedPositions = localStorage.getItem(`fixed_elements_${versionId}`);
    if (savedPositions) {
      setFixedElements(JSON.parse(savedPositions));
    }
    
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

  // Fixed elements drag handlers
  const handleFixedElementMouseDown = (e, elementKey) => {
    if (isReadOnly) return;
    
    e.stopPropagation();
    e.preventDefault();
    
    const svg = e.currentTarget.closest('svg');
    if (!svg) return;
    
    const svgRect = svg.getBoundingClientRect();
    const mouseX = e.clientX - svgRect.left;
    const mouseY = e.clientY - svgRect.top;
    
    const element = fixedElements[elementKey];
    setDraggedFixedElement(elementKey);
    setIsDragging(false);
    setDragOffset({
      x: mouseX - element.x,
      y: mouseY - element.y
    });
    setTempPosition({ x: element.x, y: element.y });
  };

  const handleFixedElementMouseMove = (e) => {
    if (!draggedFixedElement) return;
    
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
  };

  const handleFixedElementMouseUp = () => {
    if (!draggedFixedElement || !tempPosition) return;
    
    const wasDragging = isDragging;
    
    if (wasDragging) {
      // Save new position
      const newPositions = {
        ...fixedElements,
        [draggedFixedElement]: {
          ...fixedElements[draggedFixedElement],
          x: tempPosition.x,
          y: tempPosition.y
        }
      };
      setFixedElements(newPositions);
      localStorage.setItem(`fixed_elements_${versionId}`, JSON.stringify(newPositions));
    }
    
    setDraggedFixedElement(null);
    setTempPosition(null);
    setIsDragging(false);
  };

  const handleResizeMouseDown = (e, node) => {
    if (isReadOnly) return;
    
    e.stopPropagation();
    e.preventDefault();
    
    const svgRect = e.currentTarget.closest('svg').getBoundingClientRect();
    const mouseX = e.clientX - svgRect.left;
    const mouseY = e.clientY - svgRect.top;
    
    setResizingNode(node);
    setIsResizing(false);
    setTempHeight(node.height);
    setTempWidth(node.width);
    // Store initial mouse position for delta calculation
    setResizeStartPos({ x: mouseX, y: mouseY });
  };

  const handleResizeMouseMove = (e) => {
    if (!resizingNode) return;
    
    e.preventDefault();
    setIsResizing(true);
    
    const svgRect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - svgRect.left;
    const mouseY = e.clientY - svgRect.top;
    
    // Calculate delta from initial mouse position
    const deltaX = mouseX - resizeStartPos.x;
    const deltaY = mouseY - resizeStartPos.y;
    
    // Apply delta to original dimensions and then snap
    const newWidth = resizingNode.width + deltaX;
    const newHeight = resizingNode.height + deltaY;
    
    // Snap to grid (20px increments) and enforce minimums
    const snappedWidth = Math.max(200, snapToGrid(newWidth));  // Minimum 200px width
    const snappedHeight = Math.max(40, snapToGrid(newHeight)); // Minimum 40px height (2 grid cells)
    
    setTempWidth(snappedWidth);
    setTempHeight(snappedHeight);
  };

  const handleResizeMouseUp = async () => {
    if (!resizingNode || !tempHeight || !tempWidth) return;
    
    const wasResizing = isResizing;
    
    if (wasResizing) {
      try {
        const response = await fetch(`http://localhost:8000/api/units/${resizingNode.unit_id}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            custom_height: tempHeight,
            custom_width: tempWidth
          })
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
        console.error('Failed to update dimensions:', error);
      }
    }
    
    setResizingNode(null);
    setTempHeight(null);
    setTempWidth(null);
    setIsResizing(false);
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
      '#86C67C': { bg: '#86C67C', border: '#6BA85C', text: '#000000', stripOnly: true },
      '#86C67C-full': { bg: '#86C67C', border: '#6BA85C', text: '#000000', stripOnly: false },
      '#E8B4D4': { bg: '#E8B4D4', border: '#D89CC4', text: '#000000', stripOnly: true },
      '#E8B4D4-full': { bg: '#E8B4D4', border: '#D89CC4', text: '#000000', stripOnly: false },
      '#F4E03C': { bg: '#F4E03C', border: '#E4D02C', text: '#000000', stripOnly: true },
      '#F4E03C-full': { bg: '#F4E03C', border: '#E4D02C', text: '#000000', stripOnly: false },
      '#8CB4D4': { bg: '#8CB4D4', border: '#6C94B4', text: '#000000', stripOnly: true },
      '#8CB4D4-full': { bg: '#8CB4D4', border: '#6C94B4', text: '#000000', stripOnly: false },
      '#F4A43C': { bg: '#F4A43C', border: '#E4942C', text: '#000000', stripOnly: true },
      '#F4A43C-full': { bg: '#F4A43C', border: '#E4942C', text: '#000000', stripOnly: false },
    };
    
    // If unit has a color set, use it
    if (unit.color && colorMap[unit.color]) {
      return colorMap[unit.color];
    }
    
    // Default color for director_general - dark green
    if (unit.unit_type === 'director_general') {
      return { bg: '#4A7C4E', border: '#3A6C3E', text: '#ffffff', stripOnly: false };
    }
    
    // Default fallback - white
    return { bg: '#ffffff', border: '#d1d5db', text: '#000000', stripOnly: true };
  };

  // Calculate canvas size - ensure minimum width for consiliu
  const consiliu_height = 150;
  const minWidth = 1400;
  const maxX = layoutData && layoutData.layout.length > 0 
    ? Math.max(minWidth, ...layoutData.layout.map(n => n.x + n.width + 100))
    : minWidth;
  const maxY = layoutData && layoutData.layout.length > 0 
    ? Math.max(...layoutData.layout.map(n => n.y + n.height)) + 100 
    : 900;

  const drawOrthogonalEdge = (edge) => {
    // Special case for consiliu to DG - dynamic vertical line
    if (edge.from === 'consiliu') {
      // Find the actual DG node position (might be custom or temp)
      const dgNode = layoutData.layout.find(n => n.unit.unit_type === 'director_general');
      if (!dgNode) return null;
      
      // Check if DG is being dragged or resized
      const isDGDragged = draggedNode?.unit_id === dgNode.unit_id;
      const isDGResized = resizingNode?.unit_id === dgNode.unit_id;
      const dgX = isDGDragged && tempPosition ? tempPosition.x : dgNode.x;
      const dgY = isDGDragged && tempPosition ? tempPosition.y : dgNode.y;
      const dgWidth = isDGResized && tempWidth ? tempWidth : dgNode.width;
      
      // Calculate actual consiliu position (snapped to grid)
      const consiliuX = Math.floor((maxX - 300) / 2 / 20) * 20;
      const consiliuCenterX = consiliuX + 150; // Center of 300px wide consiliu
      const consiliuBottomY = 80; // 40 + 40 (aligned to grid)
      
      // DG center X
      const dgCenterX = dgX + dgWidth / 2;
      
      return (
        <g key={`${edge.from}-${edge.to}`}>
          <line
            x1={consiliuCenterX}
            y1={consiliuBottomY}
            x2={dgCenterX}
            y2={dgY}
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

  return (
    <div className="w-full h-full overflow-hidden bg-white">
      <div className="w-full h-full overflow-auto p-4">
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
              width="100%" 
              height="100%" 
              viewBox={`0 0 ${maxX} ${maxY}`}
              preserveAspectRatio="xMidYMin meet"
              className="bg-white"
              onMouseMove={(e) => {
                handleMouseMove(e);
                handleFixedElementMouseMove(e);
                handleResizeMouseMove(e);
              }}
              onMouseUp={() => {
                handleMouseUp();
                handleFixedElementMouseUp();
                handleResizeMouseUp();
              }}
              onMouseLeave={() => {
                handleMouseUp();
                handleFixedElementMouseUp();
                handleResizeMouseUp();
              }}
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
                    stroke="#9ca3af"
                    strokeWidth="1"
                  />
                </pattern>
              </defs>
              
              {/* Grid background - show when dragging or resizing */}
              {(draggedNode || draggedFixedElement || resizingNode) && (
                <rect
                  x="0"
                  y="0"
                  width={maxX}
                  height={maxY}
                  fill="url(#grid)"
                />
              )}

              {/* Legend - draggable box */}
              <g
                onMouseDown={(e) => handleFixedElementMouseDown(e, 'legend')}
                style={{ cursor: isReadOnly ? 'default' : 'move' }}
              >
                <rect
                  x={draggedFixedElement === 'legend' && tempPosition ? tempPosition.x : fixedElements.legend.x}
                  y={draggedFixedElement === 'legend' && tempPosition ? tempPosition.y : fixedElements.legend.y}
                  width={fixedElements.legend.width}
                  height={fixedElements.legend.height}
                  fill="transparent"
                  stroke={draggedFixedElement === 'legend' ? '#3b82f6' : 'transparent'}
                  strokeWidth="2"
                />
                <foreignObject 
                  x={draggedFixedElement === 'legend' && tempPosition ? tempPosition.x : fixedElements.legend.x} 
                  y={draggedFixedElement === 'legend' && tempPosition ? tempPosition.y : fixedElements.legend.y} 
                  width={fixedElements.legend.width} 
                  height={fixedElements.legend.height}
                  style={{ pointerEvents: 'none' }}
                >
                  <div className="text-[9px] border-2 border-gray-800 p-2 bg-gray-50 h-full">
                    {(() => {
                      // Calculate totals from all units
                      let totalLeadership = 0;
                      let totalExecution = 0;
                      let dgCount = 0;
                      let directorCount = 0;
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
                          <div className="mb-0.5 text-[8px]">Funcții de conducere: {totalLeadership}</div>
                          <div className="ml-2 text-[7px]">- Director general: {dgCount}</div>
                          <div className="ml-2 text-[7px]">- Director: {directorCount}</div>
                          <div className="ml-2 text-[7px]">- Inspector șef: {inspectorCount}</div>
                          <div className="ml-2 text-[7px]">- Șef serviciu: {serviceCount}</div>
                          <div className="mt-0.5 text-[8px]">Posturi de execuție: {totalExecution}</div>
                        </>
                      );
                    })()}
                  </div>
                </foreignObject>
              </g>

              {/* Director - draggable box */}
              <g
                onMouseDown={(e) => handleFixedElementMouseDown(e, 'director')}
                style={{ cursor: isReadOnly ? 'default' : 'move' }}
              >
                <rect
                  x={draggedFixedElement === 'director' && tempPosition ? tempPosition.x : fixedElements.director.x}
                  y={draggedFixedElement === 'director' && tempPosition ? tempPosition.y : fixedElements.director.y}
                  width={fixedElements.director.width}
                  height={fixedElements.director.height}
                  fill="white"
                  stroke={draggedFixedElement === 'director' ? '#3b82f6' : '#d1d5db'}
                  strokeWidth="1"
                />
                <text
                  x={(draggedFixedElement === 'director' && tempPosition ? tempPosition.x : fixedElements.director.x) + fixedElements.director.width - 10}
                  y={(draggedFixedElement === 'director' && tempPosition ? tempPosition.y : fixedElements.director.y) + 20}
                  fontSize="11"
                  fontWeight="bold"
                  textAnchor="end"
                  fill="#000000"
                  style={{ pointerEvents: 'none' }}
                >
                  DIRECTOR GENERAL
                </text>
                <text
                  x={(draggedFixedElement === 'director' && tempPosition ? tempPosition.x : fixedElements.director.x) + fixedElements.director.width - 10}
                  y={(draggedFixedElement === 'director' && tempPosition ? tempPosition.y : fixedElements.director.y) + 40}
                  fontSize="11"
                  textAnchor="end"
                  fill="#000000"
                  style={{ pointerEvents: 'none' }}
                >
                  Petru BOGDAN
                </text>
              </g>

              {/* Header 1 - draggable */}
              <g
                onMouseDown={(e) => handleFixedElementMouseDown(e, 'header1')}
                style={{ cursor: isReadOnly ? 'default' : 'move' }}
              >
                <rect
                  x={draggedFixedElement === 'header1' && tempPosition ? tempPosition.x : fixedElements.header1.x}
                  y={draggedFixedElement === 'header1' && tempPosition ? tempPosition.y : fixedElements.header1.y}
                  width={fixedElements.header1.width}
                  height={fixedElements.header1.height}
                  fill="transparent"
                  stroke={draggedFixedElement === 'header1' ? '#3b82f6' : 'transparent'}
                  strokeWidth="2"
                />
                <text
                  x={(draggedFixedElement === 'header1' && tempPosition ? tempPosition.x : fixedElements.header1.x) + fixedElements.header1.width / 2}
                  y={(draggedFixedElement === 'header1' && tempPosition ? tempPosition.y : fixedElements.header1.y) + 14}
                  fontSize="10"
                  fontWeight="bold"
                  textAnchor="middle"
                  fill="#000000"
                  style={{ pointerEvents: 'none' }}
                >
                  AUTORITATEA DE SIGURANȚĂ FEROVIARĂ ROMÂNĂ - ASFR
                </text>
              </g>
              
              {/* Header 2 - draggable and editable title */}
              <g
                onMouseDown={(e) => handleFixedElementMouseDown(e, 'header2')}
                style={{ cursor: isReadOnly ? 'default' : 'move' }}
              >
                <rect
                  x={draggedFixedElement === 'header2' && tempPosition ? tempPosition.x : fixedElements.header2.x}
                  y={draggedFixedElement === 'header2' && tempPosition ? tempPosition.y : fixedElements.header2.y}
                  width={fixedElements.header2.width}
                  height={fixedElements.header2.height}
                  fill="transparent"
                  stroke={draggedFixedElement === 'header2' ? '#3b82f6' : 'transparent'}
                  strokeWidth="2"
                />
                {!isReadOnly && (
                  <rect
                    x={(draggedFixedElement === 'header2' && tempPosition ? tempPosition.x : fixedElements.header2.x)}
                    y={(draggedFixedElement === 'header2' && tempPosition ? tempPosition.y : fixedElements.header2.y)}
                    width={fixedElements.header2.width}
                    height={fixedElements.header2.height}
                    fill="transparent"
                    className="hover:fill-gray-100"
                    style={{ cursor: 'pointer', pointerEvents: 'all' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsEditingTitle(true);
                    }}
                  />
                )}
                <text
                  x={(draggedFixedElement === 'header2' && tempPosition ? tempPosition.x : fixedElements.header2.x) + fixedElements.header2.width / 2}
                  y={(draggedFixedElement === 'header2' && tempPosition ? tempPosition.y : fixedElements.header2.y) + 14}
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
            
            {/* Consiliu - draggable box */}
            <g
              onMouseDown={(e) => handleFixedElementMouseDown(e, 'consiliu')}
              style={{ cursor: isReadOnly ? 'default' : 'move' }}
            >
              <rect
                x={draggedFixedElement === 'consiliu' && tempPosition ? tempPosition.x : fixedElements.consiliu.x}
                y={draggedFixedElement === 'consiliu' && tempPosition ? tempPosition.y : fixedElements.consiliu.y}
                width={fixedElements.consiliu.width}
                height={fixedElements.consiliu.height}
                fill="white"
                stroke="#1f2937"
                strokeWidth="2"
              />
              <text
                x={(draggedFixedElement === 'consiliu' && tempPosition ? tempPosition.x : fixedElements.consiliu.x) + fixedElements.consiliu.width / 2}
                y={(draggedFixedElement === 'consiliu' && tempPosition ? tempPosition.y : fixedElements.consiliu.y) + 35}
                fontSize="16"
                fontWeight="bold"
                textAnchor="middle"
                fill="#000000"
                style={{ pointerEvents: 'none' }}
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
              
              // Use temp dimensions if this node is being resized
              const isBeingResized = resizingNode?.unit_id === node.unit_id;
              const height = isBeingResized && tempHeight ? tempHeight : node.height;
              const width = isBeingResized && tempWidth ? tempWidth : node.width;
              
              // Calculate font size dynamically based on available space
              // Standardize font size for boxes with same height and similar line count
              const text_length = node.unit.name.length;
              const availableWidth = width - 91; // Updated: 75px left strip + 16px padding
              const availableHeight = height - 12;
              
              let fontSize = '10px';
              let lineHeight = '1.2';
              
              // Estimate how many characters fit per line at different font sizes
              const estimateLines = (fontPx, charWidth) => {
                const charsPerLine = Math.floor(availableWidth / charWidth);
                return Math.ceil(text_length / charsPerLine);
              };
              
              // Define font sizes with their properties
              const fontSizes = [
                { size: 16, charWidth: 8, lineHeight: 1.3 },
                { size: 14, charWidth: 7, lineHeight: 1.3 },
                { size: 13, charWidth: 6.5, lineHeight: 1.2 },
                { size: 12, charWidth: 6, lineHeight: 1.2 },
                { size: 11, charWidth: 5.5, lineHeight: 1.2 },
                { size: 10, charWidth: 5, lineHeight: 1.2 },
                { size: 9, charWidth: 4.5, lineHeight: 1.15 },
                { size: 8, charWidth: 4, lineHeight: 1.1 },
                { size: 7, charWidth: 3.5, lineHeight: 1.1 }
              ];
              
              // Find the largest font where text fits in available space
              let selectedFont = fontSizes[fontSizes.length - 1]; // Default to smallest
              
              for (const font of fontSizes) {
                const lines = estimateLines(font.size, font.charWidth);
                const totalHeight = lines * font.size * font.lineHeight;
                
                // Check if this font size fits
                if (totalHeight <= availableHeight) {
                  selectedFont = font;
                  break; // Found the largest that fits
                }
              }
              
              // CONSISTENCY FIX: For standard 40px height boxes, normalize font by line count
              // This ensures boxes with same height and line count have same font size
              if (height === 40) {
                const estimatedLines = estimateLines(selectedFont.size, selectedFont.charWidth);
                
                // Standard fonts for 40px height boxes based on line count
                if (estimatedLines === 1) {
                  // Single line: use 14px
                  selectedFont = fontSizes.find(f => f.size === 14) || selectedFont;
                } else if (estimatedLines === 2) {
                  // Two lines: use 11px
                  selectedFont = fontSizes.find(f => f.size === 11) || selectedFont;
                } else {
                  // Three+ lines: use 9px
                  selectedFont = fontSizes.find(f => f.size === 9) || selectedFont;
                }
              } else if (height === 60) {
                // For 60px height boxes, normalize by line count
                const estimatedLines = estimateLines(selectedFont.size, selectedFont.charWidth);
                
                if (estimatedLines <= 2) {
                  selectedFont = fontSizes.find(f => f.size === 13) || selectedFont;
                } else if (estimatedLines === 3) {
                  selectedFont = fontSizes.find(f => f.size === 11) || selectedFont;
                } else {
                  selectedFont = fontSizes.find(f => f.size === 9) || selectedFont;
                }
              }
              
              fontSize = `${selectedFont.size}px`;
              lineHeight = `${selectedFont.lineHeight}`;
              
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
                  {/* Main box - colored or white background with thick black border */}
                  <rect
                    x={x}
                    y={y}
                    width={width}
                    height={height}
                    fill={colors.stripOnly ? "#ffffff" : colors.bg}
                    stroke={isNearestParent ? "#10b981" : "#000000"}
                    strokeWidth={isNearestParent ? "4" : "3"}
                    rx="6"
                    opacity={isBeingDragged ? 0.7 : 1}
                  />
                  
                  {/* Left colored strip - vertical with 3 columns of numbers (only if stripOnly) */}
                  {colors.stripOnly && (
                    <rect
                      x={x + 1.5}
                      y={y + 1.5}
                      width="73.5"
                      height={height - 3}
                      fill={colors.bg}
                      stroke="none"
                      rx="4.5"
                      opacity={isBeingDragged ? 0.7 : 1}
                    />
                  )}
                  
                  {/* Vertical line between code and leadership count - full height */}
                  <line
                    x1={x + 25}
                    y1={y}
                    x2={x + 25}
                    y2={y + height}
                    stroke="#000000"
                    strokeWidth="1"
                  />
                  
                  {/* Vertical line between leadership and execution count - full height */}
                  <line
                    x1={x + 50}
                    y1={y}
                    x2={x + 50}
                    y2={y + height}
                    stroke="#000000"
                    strokeWidth="1"
                  />
                  
                  {/* Vertical line between numbers and name - full height */}
                  <line
                    x1={x + 75}
                    y1={y}
                    x2={x + 75}
                    y2={y + height}
                    stroke="#000000"
                    strokeWidth="1"
                  />
                  
                  {/* Code - first column in left strip (narrower, vertical text centered) */}
                  <text
                    x={x + 12.5}
                    y={y + height / 2}
                    fontSize="11"
                    fontWeight="bold"
                    fill="#000000"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    transform={`rotate(-90, ${x + 12.5}, ${y + height / 2})`}
                  >
                    {node.unit.stas_code}
                  </text>
                  
                  {/* Leadership count - second column in left strip */}
                  <text
                    x={x + 37.5}
                    y={y + height / 2 + 4}
                    fontSize="12"
                    fontWeight="bold"
                    fill="#000000"
                    textAnchor="middle"
                  >
                    {agg.leadership_positions_count}
                  </text>
                  
                  {/* Execution count - third column in left strip */}
                  <text
                    x={x + 62.5}
                    y={y + height / 2 + 4}
                    fontSize="12"
                    fontWeight="bold"
                    fill="#000000"
                    textAnchor="middle"
                  >
                    {agg.recursive_total_subordinates > agg.total_positions
                      ? agg.recursive_total_subordinates - agg.leadership_positions_count
                      : agg.execution_positions_count}
                  </text>
                  
                  {/* Unit name - dynamic font size based on available space */}
                  <foreignObject
                    x={x + 79}
                    y={y + 3}
                    width={width - 83}
                    height={height - 6}
                  >
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textAlign: 'center',
                        fontSize: fontSize,
                        fontWeight: '600',
                        color: '#000000',
                        lineHeight: lineHeight,
                        padding: '6px 8px',
                        wordWrap: 'break-word',
                        overflow: 'hidden',
                        hyphens: 'auto',
                        opacity: isBeingDragged ? 0.7 : 1
                      }}
                    >
                      {node.unit.name}
                    </div>
                  </foreignObject>
                  
                  {/* Resize handle - bottom right corner as colored triangle */}
                  {!isReadOnly && (
                    <g
                      onMouseDown={(e) => handleResizeMouseDown(e, node)}
                      style={{ cursor: 'nwse-resize' }}
                    >
                      {/* Colored triangle matching unit color */}
                      <path
                        d={`M ${x + width - 20} ${y + height} L ${x + width} ${y + height} L ${x + width} ${y + height - 20} Z`}
                        fill={colors.bg}
                        opacity="0.8"
                        style={{ pointerEvents: 'all' }}
                      />
                      {/* Small grip lines for visual feedback */}
                      <line
                        x1={x + width - 6}
                        y1={y + height - 3}
                        x2={x + width - 3}
                        y2={y + height - 6}
                        stroke="#ffffff"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                      <line
                        x1={x + width - 10}
                        y1={y + height - 3}
                        x2={x + width - 3}
                        y2={y + height - 10}
                        stroke="#ffffff"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </g>
                  )}
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
