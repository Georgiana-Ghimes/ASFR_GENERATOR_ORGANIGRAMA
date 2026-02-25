import React, { useEffect, useState } from 'react';
import { apiClient } from '@/api/apiClient';
import html2canvas from 'html2canvas';

const DeterministicOrgChart = ({ versionId, orgType = 'codificare', onSelectUnit, isReadOnly }) => {
  const [layoutData, setLayoutData] = useState(null);
  const [aggregates, setAggregates] = useState({});
  const [loading, setLoading] = useState(true);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editableTitle, setEditableTitle] = useState('CODIFICAREA STRUCTURILOR DIN ANEXA LA OMTI NR. 48/23.01.2026');
  const [versionData, setVersionData] = useState(null);
  const [consiliuUnit, setConsiliuUnit] = useState(null);
  const [directorGeneralUnit, setDirectorGeneralUnit] = useState(null);
  const [legendUnit, setLegendUnit] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null); // For highlighting selected unit
  const [draggedNode, setDraggedNode] = useState(null);
  const [draggedFixedElement, setDraggedFixedElement] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [tempPosition, setTempPosition] = useState(null);
  const [nearestParent, setNearestParent] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [resizingNode, setResizingNode] = useState(null);
  const [resizingFixedElement, setResizingFixedElement] = useState(null);
  const [tempHeight, setTempHeight] = useState(null);
  const [tempWidth, setTempWidth] = useState(null);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStartPos, setResizeStartPos] = useState({ x: 0, y: 0 });
  const svgRef = React.useRef(null);
  const containerRef = React.useRef(null);

  // Fixed elements positions (legend, director, consiliu, headers, customLegend)
  const [fixedElements, setFixedElements] = useState({
    legend: { x: 20, y: 20, width: 200, height: 100 },
    director: { x: 1180, y: 20, width: 200, height: 60 },
    header1: { x: 500, y: 120, width: 400, height: 20 },
    header2: { x: 500, y: 140, width: 400, height: 20 },
    consiliu: { x: 600, y: 180, width: 300, height: 60 },
    customLegend: { x: 450, y: 20, width: 200, height: 300 }
  });

  const SNAP_DISTANCE = 19; // 0.5cm ≈ 19px
  const GRID_SIZE = 20; // Grid cell size in pixels
  
  const snapToGrid = (value) => {
    return Math.round(value / GRID_SIZE) * GRID_SIZE;
  };

  // Calculate dynamic font size based on element dimensions
  const getDynamicFontSize = (elementKey, baseFontSize = 10) => {
    const element = resizingFixedElement === elementKey && tempWidth && tempHeight
      ? { width: tempWidth, height: tempHeight }
      : fixedElements[elementKey];
    
    // Base dimensions for reference (initial dimensions)
    const initialDimensions = {
      legend: { width: 200, height: 100 },
      director: { width: 200, height: 60 },
      header1: { width: 400, height: 20 },
      header2: { width: 400, height: 20 },
      consiliu: { width: 300, height: 60 },
      customLegend: { width: 200, height: 300 }
    };
    
    const baseWidth = initialDimensions[elementKey].width;
    const baseHeight = initialDimensions[elementKey].height;
    
    // Calculate scale factor (use the smaller of width/height scale)
    const scaleX = element.width / baseWidth;
    const scaleY = element.height / baseHeight;
    const scale = Math.min(scaleX, scaleY);
    
    // For legend, use larger base font and better scaling
    if (elementKey === 'legend') {
      return Math.max(8, Math.min(baseFontSize * scale, 32)); // Clamp between 8px and 32px
    }
    
    return Math.max(6, Math.min(baseFontSize * scale, 24)); // Clamp between 6px and 24px
  };

  useEffect(() => {
    if (!versionId) return;
    
    // Load fixed elements positions from localStorage
    const savedPositions = localStorage.getItem(`fixed_elements_${versionId}`);
    if (savedPositions) {
      const parsed = JSON.parse(savedPositions);
      // Ensure customLegend exists (for backward compatibility)
      if (!parsed.customLegend) {
        parsed.customLegend = { x: 450, y: 20, width: 200, height: 300 };
      }
      setFixedElements(parsed);
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
        
        // Fetch special units (consiliu, director_general, legend)
        const units = await apiClient.listUnits(versionId);
        const consiliu = units.find(u => u.stas_code === '330' || u.unit_type === 'consiliu');
        setConsiliuUnit(consiliu);
        
        const directorGeneral = units.find(u => u.unit_type === 'director_general');
        setDirectorGeneralUnit(directorGeneral);
        
        const legend = units.find(u => u.unit_type === 'legend');
        setLegendUnit(legend);
      } catch (error) {
        console.error('Failed to fetch layout:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchLayout();
  }, [versionId]);

  // Keyboard listener for R key to rotate selected unit
  useEffect(() => {
    const handleKeyPress = async (e) => {
      // ESC key to deselect
      if (e.key === 'Escape') {
        setSelectedNode(null);
        return;
      }
      
      console.log('Key pressed:', e.key, 'Selected node:', selectedNode);
      if (e.key === 'r' || e.key === 'R') {
        if (selectedNode && !isReadOnly) {
          console.log('Rotating unit:', selectedNode.unit_id);
          try {
            // Toggle rotation
            const newRotation = !selectedNode.unit.is_rotated;
            console.log('New rotation state:', newRotation);
            
            const response = await fetch(`http://localhost:8000/api/units/${selectedNode.unit_id}`, {
              method: 'PATCH',
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ is_rotated: newRotation })
            });
            
            console.log('Response status:', response.status);
            
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
              
              // Update selected node
              const updatedNode = data.layout.find(n => n.unit_id === selectedNode.unit_id);
              if (updatedNode) {
                setSelectedNode(updatedNode);
              }
            }
          } catch (error) {
            console.error('Failed to rotate unit:', error);
          }
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [selectedNode, versionId, isReadOnly]);

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
    
    // Right click - open edit panel
    if (e.button === 2) {
      e.stopPropagation();
      e.preventDefault();
      if (onSelectUnit) {
        onSelectUnit(node.unit);
      }
      return;
    }
    
    // Left click - select or start drag
    if (e.button === 0) {
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
    }
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
      // Was just a click, select the node (highlight it)
      setSelectedNode(draggedNode);
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

  const handleFixedElementMouseUp = async () => {
    if (!draggedFixedElement) return;
    
    const wasDragging = isDragging;
    
    if (wasDragging && tempPosition) {
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
    } else if (!wasDragging) {
      // Was just a click, open panel for consiliu, director, or customLegend
      if (draggedFixedElement === 'consiliu' && onSelectUnit) {
        try {
          const units = await apiClient.listUnits(versionId);
          const consiliu = units.find(u => u.stas_code === '330' || u.unit_type === 'consiliu');
          
          if (consiliu) {
            onSelectUnit(consiliu);
          }
        } catch (error) {
          console.error('Error fetching consiliu unit:', error);
        }
      } else if (draggedFixedElement === 'director' && onSelectUnit) {
        // Open edit panel for director mini-legend to edit director_title and director_name
        try {
          const units = await apiClient.listUnits(versionId);
          const directorGeneral = units.find(u => u.unit_type === 'director_general');
          
          if (directorGeneral) {
            // Pass a special flag to indicate this is for the mini-legend
            onSelectUnit({ ...directorGeneral, _isDirectorMiniLegend: true });
          }
        } catch (error) {
          console.error('Error fetching director_general unit:', error);
        }
      } else if (draggedFixedElement === 'customLegend' && onSelectUnit) {
        try {
          const units = await apiClient.listUnits(versionId);
          const legend = units.find(u => u.unit_type === 'legend');
          
          if (legend) {
            onSelectUnit(legend);
          }
        } catch (error) {
          console.error('Error fetching legend unit:', error);
        }
      }
    }
    
    setDraggedFixedElement(null);
    setTempPosition(null);
    setIsDragging(false);
  };
  
  // Refresh special units data when needed (called from parent after save)
  const refreshSpecialUnitsData = async () => {
    try {
      const units = await apiClient.listUnits(versionId);
      const consiliu = units.find(u => u.stas_code === '330' || u.unit_type === 'consiliu');
      setConsiliuUnit(consiliu);
      
      const directorGeneral = units.find(u => u.unit_type === 'director_general');
      setDirectorGeneralUnit(directorGeneral);
      
      const legend = units.find(u => u.unit_type === 'legend');
      setLegendUnit(legend);
    } catch (error) {
      console.error('Error refreshing special units:', error);
    }
  };

  // Fixed elements resize handlers
  const handleFixedElementResizeMouseDown = (e, elementKey) => {
    if (isReadOnly) return;
    
    e.stopPropagation();
    e.preventDefault();
    
    const svgRect = e.currentTarget.closest('svg').getBoundingClientRect();
    const mouseX = e.clientX - svgRect.left;
    const mouseY = e.clientY - svgRect.top;
    
    const element = fixedElements[elementKey];
    setResizingFixedElement(elementKey);
    setIsResizing(false);
    setTempHeight(element.height);
    setTempWidth(element.width);
    setResizeStartPos({ x: mouseX, y: mouseY });
  };

  const handleFixedElementResizeMouseMove = (e) => {
    if (!resizingFixedElement) return;
    
    e.preventDefault();
    setIsResizing(true);
    
    const svgRect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - svgRect.left;
    const mouseY = e.clientY - svgRect.top;
    
    const deltaX = mouseX - resizeStartPos.x;
    const deltaY = mouseY - resizeStartPos.y;
    
    const element = fixedElements[resizingFixedElement];
    const newWidth = element.width + deltaX;
    const newHeight = element.height + deltaY;
    
    // Snap to grid and enforce minimums
    const snappedWidth = Math.max(100, snapToGrid(newWidth));
    const snappedHeight = Math.max(40, snapToGrid(newHeight));
    
    setTempWidth(snappedWidth);
    setTempHeight(snappedHeight);
  };

  const handleFixedElementResizeMouseUp = () => {
    if (!resizingFixedElement || !tempHeight || !tempWidth) return;
    
    const wasResizing = isResizing;
    
    if (wasResizing) {
      const newPositions = {
        ...fixedElements,
        [resizingFixedElement]: {
          ...fixedElements[resizingFixedElement],
          width: tempWidth,
          height: tempHeight
        }
      };
      setFixedElements(newPositions);
      localStorage.setItem(`fixed_elements_${versionId}`, JSON.stringify(newPositions));
    }
    
    setResizingFixedElement(null);
    setTempHeight(null);
    setTempWidth(null);
    setIsResizing(false);
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
    let deltaX = mouseX - resizeStartPos.x;
    let deltaY = mouseY - resizeStartPos.y;
    
    console.log('Original deltas:', deltaX, deltaY, 'Is rotated:', resizingNode.unit.is_rotated);
    
    // If unit is rotated -90 degrees:
    // - Visual right = original down (height increases with deltaX)
    // - Visual down = original left (width decreases with deltaY, so negate it)
    let newWidth, newHeight;
    if (resizingNode.unit.is_rotated) {
      newWidth = resizingNode.width - deltaY;  // Visual down = original left (inverted)
      newHeight = resizingNode.height + deltaX; // Visual right = original down
      console.log('Adjusted for rotation - newWidth:', newWidth, 'newHeight:', newHeight);
    } else {
      newWidth = resizingNode.width + deltaX;
      newHeight = resizingNode.height + deltaY;
    }
    
    console.log('New dimensions:', newWidth, 'x', newHeight);
    
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
    ? Math.max(...layoutData.layout.map(n => n.y + n.height)) + 120 
    : 900;

  // Draw edges - starting fresh
  const drawEdges = () => {
    if (!layoutData.edges || !layoutData.layout) return null;
    
    const edges = [];
    const centerX = maxX / 2;
    const centerY = maxY / 2;
    
    // Draw connection from Consiliu to Director General
    const consiliuCenterX = fixedElements.consiliu.x + fixedElements.consiliu.width / 2;
    const consiliuBottom = fixedElements.consiliu.y + fixedElements.consiliu.height;
    
    // Find Director General
    const directorNode = layoutData.layout.find(n => n.unit?.unit_type === 'director_general');
    if (!directorNode) return null;
    
    const directorCenterX = directorNode.x + directorNode.width / 2;
    const directorTop = directorNode.y;
    const directorCenterY = directorNode.y + directorNode.height / 2;
    const directorLeft = directorNode.x;
    const directorRight = directorNode.x + directorNode.width;
    
    // Vertical line from consiliu bottom to director top
    edges.push(
      <line
        key="consiliu-director"
        x1={consiliuCenterX}
        y1={consiliuBottom}
        x2={directorCenterX}
        y2={directorTop}
        stroke="#374151"
        strokeWidth="2"
      />
    );
    
    // Find all children of Director General
    const directorChildren = layoutData.layout.filter(n => 
      n.unit?.parent_unit_id === directorNode.unit_id
    );
    
    // Group children by quadrant (only top quadrants)
    const topLeftChildren = directorChildren.filter(n => {
      const childCenterX = n.x + n.width / 2;
      const childCenterY = n.y + n.height / 2;
      return childCenterX < centerX && childCenterY < centerY;
    });
    
    const topRightChildren = directorChildren.filter(n => {
      const childCenterX = n.x + n.width / 2;
      const childCenterY = n.y + n.height / 2;
      return childCenterX >= centerX && childCenterY < centerY;
    });
    
    // Recursive function to draw edges for children of any node
    // Children connections always come from LEFT side of parent node
    const drawChildrenEdges = (parentNode, children) => {
      if (children.length === 0) return;
      
      const parentLeft = parentNode.x;
      const parentCenterY = parentNode.y + parentNode.height / 2;
      const distributionX = parentLeft - 20;
      
      // Horizontal segment from parent left side (20px)
      edges.push(
        <line
          key={`h-${parentNode.unit_id}`}
          x1={parentLeft}
          y1={parentCenterY}
          x2={distributionX}
          y2={parentCenterY}
          stroke="#374151"
          strokeWidth="2"
        />
      );
      
      // Find Y positions of all children (at their connection points)
      const childrenConnectionYs = children.map(c => c.y + c.height / 2);
      const minY = Math.min(parentCenterY, ...childrenConnectionYs);
      const maxY = Math.max(parentCenterY, ...childrenConnectionYs);
      
      // Vertical distribution line
      edges.push(
        <line
          key={`v-${parentNode.unit_id}`}
          x1={distributionX}
          y1={minY}
          x2={distributionX}
          y2={maxY}
          stroke="#374151"
          strokeWidth="2"
        />
      );
      
      // Draw branches to each child
      children.forEach(child => {
        const childCenterY = child.y + child.height / 2;
        const childLeft = child.x;
        
        // Horizontal branch from distribution line to child's LEFT side
        edges.push(
          <line
            key={`branch-${parentNode.unit_id}-${child.unit_id}`}
            x1={distributionX}
            y1={childCenterY}
            x2={childLeft}
            y2={childCenterY}
            stroke="#374151"
            strokeWidth="2"
          />
        );
        
        // Recursively handle this child's children
        const grandchildren = layoutData.layout.filter(n => 
          n.unit?.parent_unit_id === child.unit_id
        );
        
        if (grandchildren.length > 0) {
          drawChildrenEdges(child, grandchildren);
        }
      });
    };
    
    // Function to draw edges for children in top-right quadrant
    const drawTopRightChildrenEdges = (parentNode, children) => {
      if (children.length === 0) return;
      
      const parentRight = parentNode.x + parentNode.width;
      const parentCenterY = parentNode.y + parentNode.height / 2;
      const distributionX = parentRight + 20;
      
      // Horizontal segment from parent right side (20px)
      edges.push(
        <line
          key={`h-tr-${parentNode.unit_id}`}
          x1={parentRight}
          y1={parentCenterY}
          x2={distributionX}
          y2={parentCenterY}
          stroke="#374151"
          strokeWidth="2"
        />
      );
      
      // Find Y positions of all children (at their connection points)
      const childrenConnectionYs = children.map(c => c.y + c.height / 2);
      const minY = Math.min(parentCenterY, ...childrenConnectionYs);
      const maxY = Math.max(parentCenterY, ...childrenConnectionYs);
      
      // Vertical distribution line
      edges.push(
        <line
          key={`v-tr-${parentNode.unit_id}`}
          x1={distributionX}
          y1={minY}
          x2={distributionX}
          y2={maxY}
          stroke="#374151"
          strokeWidth="2"
        />
      );
      
      // Draw branches to each child
      children.forEach(child => {
        const childCenterY = child.y + child.height / 2;
        const childLeft = child.x;
        
        // Horizontal branch from distribution line to child's LEFT side
        edges.push(
          <line
            key={`branch-tr-${parentNode.unit_id}-${child.unit_id}`}
            x1={distributionX}
            y1={childCenterY}
            x2={childLeft}
            y2={childCenterY}
            stroke="#374151"
            strokeWidth="2"
          />
        );
        
        // Recursively handle this child's children
        const grandchildren = layoutData.layout.filter(n => 
          n.unit?.parent_unit_id === child.unit_id
        );
        
        if (grandchildren.length > 0) {
          drawTopRightChildrenEdges(child, grandchildren);
        }
      });
    };
    
    // 1. Handle TOP-LEFT quadrant children
    if (topLeftChildren.length > 0) {
      const startX = directorLeft;
      const startY = directorCenterY;
      const distributionX = startX - 20;
      
      // Horizontal segment from director left side (20px)
      edges.push(
        <line
          key="director-left-h"
          x1={startX}
          y1={startY}
          x2={distributionX}
          y2={startY}
          stroke="#374151"
          strokeWidth="2"
        />
      );
      
      // Find Y positions of children (at their RIGHT side connection point)
      const childrenConnectionYs = topLeftChildren.map(c => c.y + c.height / 2);
      const minY = Math.min(startY, ...childrenConnectionYs);
      const maxY = Math.max(startY, ...childrenConnectionYs);
      
      // Vertical distribution line
      edges.push(
        <line
          key="director-left-v"
          x1={distributionX}
          y1={minY}
          x2={distributionX}
          y2={maxY}
          stroke="#374151"
          strokeWidth="2"
        />
      );
      
      // Draw branches to each child (connect to RIGHT side of child)
      topLeftChildren.forEach(child => {
        const childCenterY = child.y + child.height / 2;
        const childRight = child.x + child.width;
        
        edges.push(
          <line
            key={`tl-branch-${child.unit_id}`}
            x1={distributionX}
            y1={childCenterY}
            x2={childRight}
            y2={childCenterY}
            stroke="#374151"
            strokeWidth="2"
          />
        );
        
        // Handle this child's children - check if they're to the left or right
        const grandchildren = layoutData.layout.filter(n => 
          n.unit?.parent_unit_id === child.unit_id
        );
        if (grandchildren.length > 0) {
          // Determine if grandchildren are mostly to the right or left of this child
          const childCenterX = child.x + child.width / 2;
          const grandchildrenCenterX = grandchildren.reduce((sum, gc) => sum + gc.x + gc.width / 2, 0) / grandchildren.length;
          
          if (grandchildrenCenterX > childCenterX) {
            // Grandchildren are to the right, use right-side connection
            drawTopRightChildrenEdges(child, grandchildren);
          } else {
            // Grandchildren are to the left, use left-side connection
            drawChildrenEdges(child, grandchildren);
          }
        }
      });
    }
    
    // 2. Handle TOP-RIGHT quadrant children
    if (topRightChildren.length > 0) {
      const startX = directorRight;
      const startY = directorCenterY;
      const distributionX = startX + 20;
      
      // Horizontal segment from director right side (20px)
      edges.push(
        <line
          key="director-right-h"
          x1={startX}
          y1={startY}
          x2={distributionX}
          y2={startY}
          stroke="#374151"
          strokeWidth="2"
        />
      );
      
      // Find Y positions of children (at their LEFT side connection point)
      const childrenConnectionYs = topRightChildren.map(c => c.y + c.height / 2);
      const minY = Math.min(startY, ...childrenConnectionYs);
      const maxY = Math.max(startY, ...childrenConnectionYs);
      
      // Vertical distribution line
      edges.push(
        <line
          key="director-right-v"
          x1={distributionX}
          y1={minY}
          x2={distributionX}
          y2={maxY}
          stroke="#374151"
          strokeWidth="2"
        />
      );
      
      // Draw branches to each child (connect to LEFT side of child)
      // Group children that are close together (within 150px vertically)
      const groupedChildren = [];
      const processedChildren = new Set();
      
      topRightChildren.forEach(child => {
        if (processedChildren.has(child.unit_id)) return;
        
        const childCenterY = child.y + child.height / 2;
        const group = [child];
        processedChildren.add(child.unit_id);
        
        // Find other children close to this one
        topRightChildren.forEach(otherChild => {
          if (processedChildren.has(otherChild.unit_id)) return;
          const otherCenterY = otherChild.y + otherChild.height / 2;
          if (Math.abs(childCenterY - otherCenterY) < 150) {
            group.push(otherChild);
            processedChildren.add(otherChild.unit_id);
          }
        });
        
        groupedChildren.push(group);
      });
      
      // Draw connections for each group
      groupedChildren.forEach(group => {
        if (group.length === 1) {
          // Single child - direct connection
          const child = group[0];
          const childCenterY = child.y + child.height / 2;
          const childLeft = child.x;
          
          edges.push(
            <line
              key={`tr-branch-${child.unit_id}`}
              x1={distributionX}
              y1={childCenterY}
              x2={childLeft}
              y2={childCenterY}
              stroke="#374151"
              strokeWidth="2"
            />
          );
        } else {
          // Multiple children in group - create local distribution line
          const groupCenterY = group.reduce((sum, c) => sum + c.y + c.height / 2, 0) / group.length;
          const localDistributionX = Math.min(...group.map(c => c.x)) - 20;
          
          // Horizontal branch from main distribution to local distribution
          edges.push(
            <line
              key={`tr-group-h-${group[0].unit_id}`}
              x1={distributionX}
              y1={groupCenterY}
              x2={localDistributionX}
              y2={groupCenterY}
              stroke="#374151"
              strokeWidth="2"
            />
          );
          
          // Local vertical distribution line
          const groupMinY = Math.min(...group.map(c => c.y + c.height / 2));
          const groupMaxY = Math.max(...group.map(c => c.y + c.height / 2));
          
          edges.push(
            <line
              key={`tr-group-v-${group[0].unit_id}`}
              x1={localDistributionX}
              y1={groupMinY}
              x2={localDistributionX}
              y2={groupMaxY}
              stroke="#374151"
              strokeWidth="2"
            />
          );
          
          // Branches from local distribution to each child
          group.forEach(child => {
            const childCenterY = child.y + child.height / 2;
            const childLeft = child.x;
            
            edges.push(
              <line
                key={`tr-branch-${child.unit_id}`}
                x1={localDistributionX}
                y1={childCenterY}
                x2={childLeft}
                y2={childCenterY}
                stroke="#374151"
                strokeWidth="2"
              />
            );
          });
        }
        
        // Handle children's children
        group.forEach(child => {
          const grandchildren = layoutData.layout.filter(n => 
            n.unit?.parent_unit_id === child.unit_id
          );
          if (grandchildren.length > 0) {
            console.log(`Drawing edges for ${child.unit_id} with ${grandchildren.length} children:`, grandchildren.map(gc => gc.unit_id));
            drawTopRightChildrenEdges(child, grandchildren);
          }
        });
      });
    }
    
    // Group children by bottom quadrants
    const bottomLeftChildren = directorChildren.filter(n => {
      const childCenterX = n.x + n.width / 2;
      const childCenterY = n.y + n.height / 2;
      return childCenterX < centerX && childCenterY >= centerY;
    });
    
    const bottomRightChildren = directorChildren.filter(n => {
      const childCenterX = n.x + n.width / 2;
      const childCenterY = n.y + n.height / 2;
      return childCenterX >= centerX && childCenterY >= centerY;
    });
    
    const bottomChildren = [...bottomLeftChildren, ...bottomRightChildren];
    
    // Recursive function for bottom quadrant children
    const drawBottomChildrenEdges = (parentNode, children) => {
      if (children.length === 0) return;
      
      if (children.length === 1) {
        // Single child - direct connection from bottom of parent to top of child
        const child = children[0];
        const parentCenterX = parentNode.x + parentNode.width / 2;
        const parentBottom = parentNode.y + parentNode.height;
        const childCenterX = child.x + child.width / 2;
        const childTop = child.y;
        
        // Vertical line from parent bottom center to child top center
        edges.push(
          <line
            key={`single-${child.unit_id}`}
            x1={parentCenterX}
            y1={parentBottom}
            x2={childCenterX}
            y2={childTop}
            stroke="#374151"
            strokeWidth="2"
          />
        );
        
        // Recursively handle this child's children
        const grandchildren = layoutData.layout.filter(n => 
          n.unit?.parent_unit_id === child.unit_id
        );
        if (grandchildren.length > 0) {
          drawBottomChildrenEdges(child, grandchildren);
        }
      } else {
        // Multiple children - use horizontal distribution
        const parentCenterX = parentNode.x + parentNode.width / 2;
        const parentBottom = parentNode.y + parentNode.height;
        const distributionY = parentBottom + 20;
        
        // Vertical segment from parent bottom (20px down)
        edges.push(
          <line
            key={`v-bottom-${parentNode.unit_id}`}
            x1={parentCenterX}
            y1={parentBottom}
            x2={parentCenterX}
            y2={distributionY}
            stroke="#374151"
            strokeWidth="2"
          />
        );
        
        // Find X positions of all children (at their TOP CENTER)
        const childrenConnectionXs = children.map(c => c.x + c.width / 2);
        const minX = Math.min(parentCenterX, ...childrenConnectionXs);
        const maxX = Math.max(parentCenterX, ...childrenConnectionXs);
        
        // Horizontal distribution line
        edges.push(
          <line
            key={`h-bottom-${parentNode.unit_id}`}
            x1={minX}
            y1={distributionY}
            x2={maxX}
            y2={distributionY}
            stroke="#374151"
            strokeWidth="2"
          />
        );
        
        // Draw branches to each child - connect to TOP CENTER of child
        children.forEach(child => {
          const childCenterX = child.x + child.width / 2;
          const childTop = child.y;
          
          // Vertical branch from distribution line to child's TOP CENTER
          edges.push(
            <line
              key={`branch-bottom-${child.unit_id}`}
              x1={childCenterX}
              y1={distributionY}
              x2={childCenterX}
              y2={childTop}
              stroke="#374151"
              strokeWidth="2"
            />
          );
          
          // Recursively handle this child's children
          const grandchildren = layoutData.layout.filter(n => 
            n.unit?.parent_unit_id === child.unit_id
          );
          if (grandchildren.length > 0) {
            drawBottomChildrenEdges(child, grandchildren);
          }
        });
      }
    };
    
    // 3. Handle BOTTOM quadrant children (both left and right)
    if (bottomChildren.length > 0) {
      const directorCenterX = directorNode.x + directorNode.width / 2;
      const directorBottom = directorNode.y + directorNode.height;
      
      // Vertical line from director bottom to center line (horizontal median)
      edges.push(
        <line
          key="director-bottom-v"
          x1={directorCenterX}
          y1={directorBottom}
          x2={directorCenterX}
          y2={centerY}
          stroke="#374151"
          strokeWidth="2"
        />
      );
      
      // Find X positions of all bottom children
      const childrenConnectionXs = bottomChildren.map(c => c.x + c.width / 2);
      const minX = Math.min(directorCenterX, ...childrenConnectionXs);
      const maxX = Math.max(directorCenterX, ...childrenConnectionXs);
      
      // Horizontal distribution line on center line
      edges.push(
        <line
          key="director-bottom-h"
          x1={minX}
          y1={centerY}
          x2={maxX}
          y2={centerY}
          stroke="#374151"
          strokeWidth="2"
        />
      );
      
      // Draw branches to each child (connect to TOP of child)
      bottomChildren.forEach(child => {
        const childCenterX = child.x + child.width / 2;
        const childTop = child.y;
        
        // Vertical branch from distribution line to child's TOP
        edges.push(
          <line
            key={`bottom-branch-${child.unit_id}`}
            x1={childCenterX}
            y1={centerY}
            x2={childCenterX}
            y2={childTop}
            stroke="#374151"
            strokeWidth="2"
          />
        );
        
        // Handle this child's children
        const grandchildren = layoutData.layout.filter(n => 
          n.unit?.parent_unit_id === child.unit_id
        );
        if (grandchildren.length > 0) {
          drawBottomChildrenEdges(child, grandchildren);
        }
      });
    }
    
    return edges;
  };

  // Print function - prints only the SVG canvas using html2canvas
  const handlePrint = async () => {
    const svgElement = svgRef.current;
    if (!svgElement) return;

    try {
      // Get viewBox dimensions
      const viewBox = svgElement.getAttribute('viewBox');
      const [, , width, height] = viewBox.split(' ').map(Number);
      
      // Create a temporary container with the SVG
      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      tempContainer.style.top = '0';
      tempContainer.style.width = `${width}px`;
      tempContainer.style.height = `${height}px`;
      tempContainer.style.background = 'white';
      
      // Clone and append SVG
      const svgClone = svgElement.cloneNode(true);
      svgClone.setAttribute('width', width);
      svgClone.setAttribute('height', height);
      tempContainer.appendChild(svgClone);
      document.body.appendChild(tempContainer);
      
      // Capture with html2canvas
      const canvas = await html2canvas(tempContainer, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
        width: width,
        height: height
      });
      
      // Remove temp container
      document.body.removeChild(tempContainer);
      
      // Convert to image
      const imageDataUrl = canvas.toDataURL('image/png');
      
      // A4 dimensions in pixels at 96 DPI (landscape)
      const a4WidthPx = 1123; // 297mm
      const a4HeightPx = 794;  // 210mm
      
      // Calculate scale to fit A4 landscape
      const scaleX = a4WidthPx / canvas.width;
      const scaleY = a4HeightPx / canvas.height;
      const scale = Math.min(scaleX, scaleY, 1); // Don't scale up, only down
      
      const scaledWidth = canvas.width * scale;
      const scaledHeight = canvas.height * scale;
      
      // Create print window
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Organigramă - ${versionData?.name || 'Print'}</title>
            <style>
              @page {
                size: A4 landscape;
                margin: 10mm;
              }
              * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
              }
              html, body {
                margin: 0;
                padding: 0;
                width: 100%;
                height: 100%;
              }
              body {
                display: flex;
                justify-content: center;
                align-items: center;
                background: white;
              }
              .print-container {
                max-width: 100%;
                max-height: 100%;
                display: flex;
                justify-content: center;
                align-items: center;
              }
              img {
                max-width: 100%;
                max-height: 100%;
                width: auto;
                height: auto;
                display: block;
                object-fit: contain;
              }
              @media print {
                @page {
                  size: A4 landscape;
                  margin: 10mm;
                }
                html, body {
                  width: 297mm;
                  height: 210mm;
                }
                .print-container {
                  width: 277mm;
                  height: 190mm;
                  page-break-inside: avoid;
                }
                img {
                  max-width: 277mm;
                  max-height: 190mm;
                  width: auto;
                  height: auto;
                  object-fit: contain;
                }
              }
              @media screen {
                body {
                  background: #f0f0f0;
                  padding: 20px;
                }
                .print-container {
                  background: white;
                  box-shadow: 0 0 10px rgba(0,0,0,0.1);
                  padding: 10mm;
                }
              }
            </style>
          </head>
          <body>
            <div class="print-container">
              <img src="${imageDataUrl}" alt="Organigramă" />
            </div>
          </body>
        </html>
      `);
      
      printWindow.document.close();
      
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
        }, 500);
      };
    } catch (error) {
      console.error('Failed to generate print preview:', error);
      alert('Eroare la generarea preview-ului de tipărire: ' + error.message);
    }
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
            {/* Print button - only show for approved versions */}
            {versionData?.status === 'approved' && (
              <button
                onClick={handlePrint}
                className="absolute top-4 right-4 z-20 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow-lg flex items-center gap-2"
                title="Tipărește organigrama"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" />
                </svg>
                Tipărește
              </button>
            )}
            
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
              onClick={(e) => {
                // Deselect if clicking on canvas (not on a unit)
                if (e.target === e.currentTarget || (e.target instanceof SVGElement && e.target.tagName === 'svg')) {
                  setSelectedNode(null);
                }
              }}
              onMouseMove={(e) => {
                handleMouseMove(e);
                handleFixedElementMouseMove(e);
                handleFixedElementResizeMouseMove(e);
                handleResizeMouseMove(e);
              }}
              onMouseUp={() => {
                handleMouseUp();
                handleFixedElementMouseUp();
                handleFixedElementResizeMouseUp();
                handleResizeMouseUp();
              }}
              onMouseLeave={() => {
                handleMouseUp();
                handleFixedElementMouseUp();
                handleFixedElementResizeMouseUp();
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
              {(draggedNode || draggedFixedElement || resizingNode || resizingFixedElement) && (
                <>
                  <rect
                    x="0"
                    y="0"
                    width={maxX}
                    height={maxY}
                    fill="url(#grid)"
                  />
                  {/* Center lines - vertical and horizontal */}
                  <line
                    x1={maxX / 2}
                    y1="0"
                    x2={maxX / 2}
                    y2={maxY}
                    stroke="#9ca3af"
                    strokeWidth="2"
                  />
                  <line
                    x1="0"
                    y1={maxY / 2}
                    x2={maxX}
                    y2={maxY / 2}
                    stroke="#9ca3af"
                    strokeWidth="2"
                  />
                </>
              )}

              {/* Legend - draggable and resizable box */}
              <g>
                <g
                  onMouseDown={(e) => handleFixedElementMouseDown(e, 'legend')}
                  style={{ cursor: isReadOnly ? 'default' : 'move' }}
                >
                  <rect
                    x={draggedFixedElement === 'legend' && tempPosition ? tempPosition.x : fixedElements.legend.x}
                    y={draggedFixedElement === 'legend' && tempPosition ? tempPosition.y : fixedElements.legend.y}
                    width={resizingFixedElement === 'legend' && tempWidth ? tempWidth : fixedElements.legend.width}
                    height={resizingFixedElement === 'legend' && tempHeight ? tempHeight : fixedElements.legend.height}
                    fill="transparent"
                    stroke={draggedFixedElement === 'legend' || resizingFixedElement === 'legend' ? '#3b82f6' : 'transparent'}
                    strokeWidth="2"
                  />
                  <foreignObject 
                    x={draggedFixedElement === 'legend' && tempPosition ? tempPosition.x : fixedElements.legend.x} 
                    y={draggedFixedElement === 'legend' && tempPosition ? tempPosition.y : fixedElements.legend.y} 
                    width={resizingFixedElement === 'legend' && tempWidth ? tempWidth : fixedElements.legend.width} 
                    height={resizingFixedElement === 'legend' && tempHeight ? tempHeight : fixedElements.legend.height}
                    style={{ pointerEvents: 'none' }}
                  >
                    <div className="border-2 border-gray-800 p-2 bg-gray-50 h-full overflow-hidden flex items-center justify-center" style={{ fontSize: `${getDynamicFontSize('legend', 14)}px` }}>
                      <div className="text-center">
                        {(() => {
                          // Calculate totals from all units (exclude consiliu)
                          let totalLeadership = 0;
                          let totalExecution = 0;
                          let dgCount = 0;
                          let directorCount = 0;
                          let inspectorCount = 0;
                          let serviceCount = 0;

                          layoutData.layout.forEach(node => {
                            // Skip consiliu unit
                            if (node.unit.unit_type === 'consiliu' || node.unit.stas_code === '330') {
                              return;
                            }
                            
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
                              <div className="font-bold mb-0.5">Funcții de conducere: {totalLeadership}</div>
                              <div className="font-bold ml-2">- Director general: {dgCount}</div>
                              <div className="font-bold ml-2">- Director: {directorCount}</div>
                              <div className="font-bold ml-2">- Inspector șef: {inspectorCount}</div>
                              <div className="font-bold ml-2">- Șef serviciu: {serviceCount}</div>
                              <div className="font-bold mt-0.5">Posturi de execuție: {totalExecution}</div>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </foreignObject>
                </g>
                
                {/* Resize handles for legend */}
                {!isReadOnly && (
                  <>
                    {/* Corner handle - resize both width and height */}
                    <path
                      d={`M ${(draggedFixedElement === 'legend' && tempPosition ? tempPosition.x : fixedElements.legend.x) + (resizingFixedElement === 'legend' && tempWidth ? tempWidth : fixedElements.legend.width) - 10} ${(draggedFixedElement === 'legend' && tempPosition ? tempPosition.y : fixedElements.legend.y) + (resizingFixedElement === 'legend' && tempHeight ? tempHeight : fixedElements.legend.height)} 
                           L ${(draggedFixedElement === 'legend' && tempPosition ? tempPosition.x : fixedElements.legend.x) + (resizingFixedElement === 'legend' && tempWidth ? tempWidth : fixedElements.legend.width)} ${(draggedFixedElement === 'legend' && tempPosition ? tempPosition.y : fixedElements.legend.y) + (resizingFixedElement === 'legend' && tempHeight ? tempHeight : fixedElements.legend.height)} 
                           L ${(draggedFixedElement === 'legend' && tempPosition ? tempPosition.x : fixedElements.legend.x) + (resizingFixedElement === 'legend' && tempWidth ? tempWidth : fixedElements.legend.width)} ${(draggedFixedElement === 'legend' && tempPosition ? tempPosition.y : fixedElements.legend.y) + (resizingFixedElement === 'legend' && tempHeight ? tempHeight : fixedElements.legend.height) - 10} Z`}
                      fill="#9ca3af"
                      stroke="none"
                      style={{ cursor: 'nwse-resize' }}
                      onMouseDown={(e) => handleFixedElementResizeMouseDown(e, 'legend')}
                    />
                  </>
                )}
              </g>

              {/* Director - draggable and resizable box */}
              <g>
                <g
                  onMouseDown={(e) => handleFixedElementMouseDown(e, 'director')}
                  style={{ cursor: isReadOnly ? 'default' : 'move' }}
                >
                  <rect
                    x={draggedFixedElement === 'director' && tempPosition ? tempPosition.x : fixedElements.director.x}
                    y={draggedFixedElement === 'director' && tempPosition ? tempPosition.y : fixedElements.director.y}
                    width={resizingFixedElement === 'director' && tempWidth ? tempWidth : fixedElements.director.width}
                    height={resizingFixedElement === 'director' && tempHeight ? tempHeight : fixedElements.director.height}
                    fill="white"
                    stroke={orgType === 'omti' ? 'transparent' : (draggedFixedElement === 'director' || resizingFixedElement === 'director' ? '#3b82f6' : '#d1d5db')}
                    strokeWidth="2"
                  />
                  {orgType === 'omti' ? (
                    <>
                      {/* ANEXA */}
                      <text
                        x={(draggedFixedElement === 'director' && tempPosition ? tempPosition.x : fixedElements.director.x) + (resizingFixedElement === 'director' && tempWidth ? tempWidth : fixedElements.director.width) / 2}
                        y={(draggedFixedElement === 'director' && tempPosition ? tempPosition.y : fixedElements.director.y) + 15}
                        fontSize={getDynamicFontSize('director', 16)}
                        fontWeight="bold"
                        textAnchor="middle"
                        fill="#000000"
                        style={{ pointerEvents: 'none' }}
                      >
                        ANEXA
                      </text>
                      {/* LA ORDINUL MINISTRULUI TRANSPORTURILOR ȘI INFRASTRUCTURII */}
                      <text
                        x={(draggedFixedElement === 'director' && tempPosition ? tempPosition.x : fixedElements.director.x) + (resizingFixedElement === 'director' && tempWidth ? tempWidth : fixedElements.director.width) / 2}
                        y={(draggedFixedElement === 'director' && tempPosition ? tempPosition.y : fixedElements.director.y) + 32}
                        fontSize={getDynamicFontSize('director', 16)}
                        fontWeight="bold"
                        textAnchor="middle"
                        fill="#000000"
                        style={{ pointerEvents: 'none' }}
                      >
                        LA ORDINUL MINISTRULUI TRANSPORTURILOR ȘI INFRASTRUCTURII
                      </text>
                      {/* NR. .......... din .......... */}
                      <text
                        x={(draggedFixedElement === 'director' && tempPosition ? tempPosition.x : fixedElements.director.x) + (resizingFixedElement === 'director' && tempWidth ? tempWidth : fixedElements.director.width) / 2}
                        y={(draggedFixedElement === 'director' && tempPosition ? tempPosition.y : fixedElements.director.y) + 55}
                        fontSize={getDynamicFontSize('director', 16)}
                        fontWeight="bold"
                        textAnchor="middle"
                        fill="#000000"
                        style={{ pointerEvents: 'none' }}
                      >
                        NR. ........................ din ........................
                      </text>
                    </>
                  ) : (
                    <>
                      <text
                        x={(draggedFixedElement === 'director' && tempPosition ? tempPosition.x : fixedElements.director.x) + (resizingFixedElement === 'director' && tempWidth ? tempWidth : fixedElements.director.width) / 2}
                        y={(draggedFixedElement === 'director' && tempPosition ? tempPosition.y : fixedElements.director.y) + (resizingFixedElement === 'director' && tempHeight ? tempHeight : fixedElements.director.height) / 3}
                        fontSize={getDynamicFontSize('director', 14)}
                        fontWeight="bold"
                        textAnchor="middle"
                        fill="#000000"
                        style={{ pointerEvents: 'none' }}
                      >
                        {directorGeneralUnit?.director_title || 'DIRECTOR GENERAL'}
                      </text>
                      <text
                        x={(draggedFixedElement === 'director' && tempPosition ? tempPosition.x : fixedElements.director.x) + (resizingFixedElement === 'director' && tempWidth ? tempWidth : fixedElements.director.width) / 2}
                        y={(draggedFixedElement === 'director' && tempPosition ? tempPosition.y : fixedElements.director.y) + 2 * (resizingFixedElement === 'director' && tempHeight ? tempHeight : fixedElements.director.height) / 3}
                        fontSize={getDynamicFontSize('director', 14)}
                        fontWeight="bold"
                        textAnchor="middle"
                        fill="#000000"
                        style={{ pointerEvents: 'none' }}
                      >
                        {directorGeneralUnit?.director_name || 'Petru BOGDAN'}
                      </text>
                    </>
                  )}
                </g>
                
                {/* Resize handle for director */}
                {!isReadOnly && (
                  <path
                    d={`M ${(draggedFixedElement === 'director' && tempPosition ? tempPosition.x : fixedElements.director.x) + (resizingFixedElement === 'director' && tempWidth ? tempWidth : fixedElements.director.width) - 10} ${(draggedFixedElement === 'director' && tempPosition ? tempPosition.y : fixedElements.director.y) + (resizingFixedElement === 'director' && tempHeight ? tempHeight : fixedElements.director.height)} 
                         L ${(draggedFixedElement === 'director' && tempPosition ? tempPosition.x : fixedElements.director.x) + (resizingFixedElement === 'director' && tempWidth ? tempWidth : fixedElements.director.width)} ${(draggedFixedElement === 'director' && tempPosition ? tempPosition.y : fixedElements.director.y) + (resizingFixedElement === 'director' && tempHeight ? tempHeight : fixedElements.director.height)} 
                         L ${(draggedFixedElement === 'director' && tempPosition ? tempPosition.x : fixedElements.director.x) + (resizingFixedElement === 'director' && tempWidth ? tempWidth : fixedElements.director.width)} ${(draggedFixedElement === 'director' && tempPosition ? tempPosition.y : fixedElements.director.y) + (resizingFixedElement === 'director' && tempHeight ? tempHeight : fixedElements.director.height) - 10} Z`}
                    fill="#9ca3af"
                    stroke="none"
                    style={{ cursor: 'nwse-resize' }}
                    onMouseDown={(e) => handleFixedElementResizeMouseDown(e, 'director')}
                  />
                )}
              </g>

              {/* Header 1 - draggable and resizable */}
              <g>
                <g
                  onMouseDown={(e) => handleFixedElementMouseDown(e, 'header1')}
                  style={{ cursor: isReadOnly ? 'default' : 'move' }}
                >
                  <rect
                    x={draggedFixedElement === 'header1' && tempPosition ? tempPosition.x : fixedElements.header1.x}
                    y={draggedFixedElement === 'header1' && tempPosition ? tempPosition.y : fixedElements.header1.y}
                    width={resizingFixedElement === 'header1' && tempWidth ? tempWidth : fixedElements.header1.width}
                    height={resizingFixedElement === 'header1' && tempHeight ? tempHeight : fixedElements.header1.height}
                    fill="transparent"
                    stroke={draggedFixedElement === 'header1' || resizingFixedElement === 'header1' ? '#3b82f6' : 'transparent'}
                    strokeWidth="2"
                  />
                  <text
                    x={(draggedFixedElement === 'header1' && tempPosition ? tempPosition.x : fixedElements.header1.x) + (resizingFixedElement === 'header1' && tempWidth ? tempWidth : fixedElements.header1.width) / 2}
                    y={(draggedFixedElement === 'header1' && tempPosition ? tempPosition.y : fixedElements.header1.y) + (resizingFixedElement === 'header1' && tempHeight ? tempHeight : fixedElements.header1.height) / 2 + 4}
                    fontSize={getDynamicFontSize('header1', 14)}
                    fontWeight="bold"
                    textAnchor="middle"
                    fill="#000000"
                    style={{ pointerEvents: 'none' }}
                  >
                    AUTORITATEA DE SIGURANȚĂ FEROVIARĂ ROMÂNĂ - ASFR
                  </text>
                </g>
                
                {/* Resize handle for header1 */}
                {!isReadOnly && (
                  <path
                    d={`M ${(draggedFixedElement === 'header1' && tempPosition ? tempPosition.x : fixedElements.header1.x) + (resizingFixedElement === 'header1' && tempWidth ? tempWidth : fixedElements.header1.width) - 10} ${(draggedFixedElement === 'header1' && tempPosition ? tempPosition.y : fixedElements.header1.y) + (resizingFixedElement === 'header1' && tempHeight ? tempHeight : fixedElements.header1.height)} 
                         L ${(draggedFixedElement === 'header1' && tempPosition ? tempPosition.x : fixedElements.header1.x) + (resizingFixedElement === 'header1' && tempWidth ? tempWidth : fixedElements.header1.width)} ${(draggedFixedElement === 'header1' && tempPosition ? tempPosition.y : fixedElements.header1.y) + (resizingFixedElement === 'header1' && tempHeight ? tempHeight : fixedElements.header1.height)} 
                         L ${(draggedFixedElement === 'header1' && tempPosition ? tempPosition.x : fixedElements.header1.x) + (resizingFixedElement === 'header1' && tempWidth ? tempWidth : fixedElements.header1.width)} ${(draggedFixedElement === 'header1' && tempPosition ? tempPosition.y : fixedElements.header1.y) + (resizingFixedElement === 'header1' && tempHeight ? tempHeight : fixedElements.header1.height) - 10} Z`}
                    fill="#9ca3af"
                    stroke="none"
                    style={{ cursor: 'nwse-resize' }}
                    onMouseDown={(e) => handleFixedElementResizeMouseDown(e, 'header1')}
                  />
                )}
              </g>
              
              {/* Header 2 - draggable, resizable and editable title - only show for codificare */}
              {orgType === 'codificare' && (
              <g>
                <g
                  onMouseDown={(e) => handleFixedElementMouseDown(e, 'header2')}
                  style={{ cursor: isReadOnly ? 'default' : 'move' }}
                >
                  <rect
                    x={draggedFixedElement === 'header2' && tempPosition ? tempPosition.x : fixedElements.header2.x}
                    y={draggedFixedElement === 'header2' && tempPosition ? tempPosition.y : fixedElements.header2.y}
                    width={resizingFixedElement === 'header2' && tempWidth ? tempWidth : fixedElements.header2.width}
                    height={resizingFixedElement === 'header2' && tempHeight ? tempHeight : fixedElements.header2.height}
                    fill="transparent"
                    stroke={draggedFixedElement === 'header2' || resizingFixedElement === 'header2' ? '#3b82f6' : 'transparent'}
                    strokeWidth="2"
                  />
                  {!isReadOnly && (
                    <rect
                      x={(draggedFixedElement === 'header2' && tempPosition ? tempPosition.x : fixedElements.header2.x)}
                      y={(draggedFixedElement === 'header2' && tempPosition ? tempPosition.y : fixedElements.header2.y)}
                      width={resizingFixedElement === 'header2' && tempWidth ? tempWidth : fixedElements.header2.width}
                      height={resizingFixedElement === 'header2' && tempHeight ? tempHeight : fixedElements.header2.height}
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
                    x={(draggedFixedElement === 'header2' && tempPosition ? tempPosition.x : fixedElements.header2.x) + (resizingFixedElement === 'header2' && tempWidth ? tempWidth : fixedElements.header2.width) / 2}
                    y={(draggedFixedElement === 'header2' && tempPosition ? tempPosition.y : fixedElements.header2.y) + (resizingFixedElement === 'header2' && tempHeight ? tempHeight : fixedElements.header2.height) / 2 + 4}
                    fontSize={getDynamicFontSize('header2', 14)}
                    fontWeight="bold"
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
                
                {/* Resize handle for header2 */}
                {!isReadOnly && (
                  <path
                    d={`M ${(draggedFixedElement === 'header2' && tempPosition ? tempPosition.x : fixedElements.header2.x) + (resizingFixedElement === 'header2' && tempWidth ? tempWidth : fixedElements.header2.width) - 10} ${(draggedFixedElement === 'header2' && tempPosition ? tempPosition.y : fixedElements.header2.y) + (resizingFixedElement === 'header2' && tempHeight ? tempHeight : fixedElements.header2.height)} 
                         L ${(draggedFixedElement === 'header2' && tempPosition ? tempPosition.x : fixedElements.header2.x) + (resizingFixedElement === 'header2' && tempWidth ? tempWidth : fixedElements.header2.width)} ${(draggedFixedElement === 'header2' && tempPosition ? tempPosition.y : fixedElements.header2.y) + (resizingFixedElement === 'header2' && tempHeight ? tempHeight : fixedElements.header2.height)} 
                         L ${(draggedFixedElement === 'header2' && tempPosition ? tempPosition.x : fixedElements.header2.x) + (resizingFixedElement === 'header2' && tempWidth ? tempWidth : fixedElements.header2.width)} ${(draggedFixedElement === 'header2' && tempPosition ? tempPosition.y : fixedElements.header2.y) + (resizingFixedElement === 'header2' && tempHeight ? tempHeight : fixedElements.header2.height) - 10} Z`}
                    fill="#9ca3af"
                    stroke="none"
                    style={{ cursor: 'nwse-resize' }}
                    onMouseDown={(e) => handleFixedElementResizeMouseDown(e, 'header2')}
                  />
                )}
              </g>
              )}
            
            {/* Custom Legend - draggable and resizable box with 3 columns */}
            {fixedElements.customLegend && (
            <g>
              <g
                onMouseDown={(e) => handleFixedElementMouseDown(e, 'customLegend')}
                style={{ cursor: isReadOnly ? 'default' : 'move' }}
              >
                {/* Main box */}
                <rect
                  x={draggedFixedElement === 'customLegend' && tempPosition ? tempPosition.x : fixedElements.customLegend.x}
                  y={draggedFixedElement === 'customLegend' && tempPosition ? tempPosition.y : fixedElements.customLegend.y}
                  width={resizingFixedElement === 'customLegend' && tempWidth ? tempWidth : fixedElements.customLegend.width}
                  height={resizingFixedElement === 'customLegend' && tempHeight ? tempHeight : fixedElements.customLegend.height}
                  fill="white"
                  stroke={draggedFixedElement === 'customLegend' || resizingFixedElement === 'customLegend' ? '#3b82f6' : '#1f2937'}
                  strokeWidth="2"
                />
                
                {/* Header row */}
                <rect
                  x={draggedFixedElement === 'customLegend' && tempPosition ? tempPosition.x : fixedElements.customLegend.x}
                  y={draggedFixedElement === 'customLegend' && tempPosition ? tempPosition.y : fixedElements.customLegend.y}
                  width={resizingFixedElement === 'customLegend' && tempWidth ? tempWidth : fixedElements.customLegend.width}
                  height={(resizingFixedElement === 'customLegend' && tempHeight ? tempHeight : fixedElements.customLegend.height) * 0.15}
                  fill="white"
                  stroke="#1f2937"
                  strokeWidth="2"
                  style={{ pointerEvents: 'none' }}
                />
                <text
                  x={(draggedFixedElement === 'customLegend' && tempPosition ? tempPosition.x : fixedElements.customLegend.x) + (resizingFixedElement === 'customLegend' && tempWidth ? tempWidth : fixedElements.customLegend.width) / 2}
                  y={(draggedFixedElement === 'customLegend' && tempPosition ? tempPosition.y : fixedElements.customLegend.y) + (resizingFixedElement === 'customLegend' && tempHeight ? tempHeight : fixedElements.customLegend.height) * 0.075 + 5}
                  fontSize={getDynamicFontSize('customLegend', 22)}
                  fontWeight="bold"
                  textAnchor="middle"
                  fill="#000000"
                  style={{ pointerEvents: 'none' }}
                >
                  Legendă
                </text>
                
                {/* Column 1 */}
                <line
                  x1={(draggedFixedElement === 'customLegend' && tempPosition ? tempPosition.x : fixedElements.customLegend.x) + (resizingFixedElement === 'customLegend' && tempWidth ? tempWidth : fixedElements.customLegend.width) / 3}
                  y1={(draggedFixedElement === 'customLegend' && tempPosition ? tempPosition.y : fixedElements.customLegend.y) + (resizingFixedElement === 'customLegend' && tempHeight ? tempHeight : fixedElements.customLegend.height) * 0.15}
                  x2={(draggedFixedElement === 'customLegend' && tempPosition ? tempPosition.x : fixedElements.customLegend.x) + (resizingFixedElement === 'customLegend' && tempWidth ? tempWidth : fixedElements.customLegend.width) / 3}
                  y2={(draggedFixedElement === 'customLegend' && tempPosition ? tempPosition.y : fixedElements.customLegend.y) + (resizingFixedElement === 'customLegend' && tempHeight ? tempHeight : fixedElements.customLegend.height)}
                  stroke="#1f2937"
                  strokeWidth="2"
                  style={{ pointerEvents: 'none' }}
                />
                <text
                  x={(draggedFixedElement === 'customLegend' && tempPosition ? tempPosition.x : fixedElements.customLegend.x) + (resizingFixedElement === 'customLegend' && tempWidth ? tempWidth : fixedElements.customLegend.width) / 6}
                  y={(draggedFixedElement === 'customLegend' && tempPosition ? tempPosition.y : fixedElements.customLegend.y) + (resizingFixedElement === 'customLegend' && tempHeight ? tempHeight : fixedElements.customLegend.height) * 0.15 + ((resizingFixedElement === 'customLegend' && tempHeight ? tempHeight : fixedElements.customLegend.height) * 0.85) / 2}
                  fontSize={getDynamicFontSize('customLegend', 20)}
                  fontWeight="bold"
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="#000000"
                  style={{ pointerEvents: 'none' }}
                  transform={`rotate(-90, ${(draggedFixedElement === 'customLegend' && tempPosition ? tempPosition.x : fixedElements.customLegend.x) + (resizingFixedElement === 'customLegend' && tempWidth ? tempWidth : fixedElements.customLegend.width) / 6}, ${(draggedFixedElement === 'customLegend' && tempPosition ? tempPosition.y : fixedElements.customLegend.y) + (resizingFixedElement === 'customLegend' && tempHeight ? tempHeight : fixedElements.customLegend.height) * 0.15 + ((resizingFixedElement === 'customLegend' && tempHeight ? tempHeight : fixedElements.customLegend.height) * 0.85) / 2})`}
                >
                  {legendUnit?.legend_col1 || 'NUMĂR POSTURI CONDUCERE'}
                </text>
                
                {/* Column 2 */}
                <line
                  x1={(draggedFixedElement === 'customLegend' && tempPosition ? tempPosition.x : fixedElements.customLegend.x) + 2 * (resizingFixedElement === 'customLegend' && tempWidth ? tempWidth : fixedElements.customLegend.width) / 3}
                  y1={(draggedFixedElement === 'customLegend' && tempPosition ? tempPosition.y : fixedElements.customLegend.y) + (resizingFixedElement === 'customLegend' && tempHeight ? tempHeight : fixedElements.customLegend.height) * 0.15}
                  x2={(draggedFixedElement === 'customLegend' && tempPosition ? tempPosition.x : fixedElements.customLegend.x) + 2 * (resizingFixedElement === 'customLegend' && tempWidth ? tempWidth : fixedElements.customLegend.width) / 3}
                  y2={(draggedFixedElement === 'customLegend' && tempPosition ? tempPosition.y : fixedElements.customLegend.y) + (resizingFixedElement === 'customLegend' && tempHeight ? tempHeight : fixedElements.customLegend.height)}
                  stroke="#1f2937"
                  strokeWidth="2"
                  style={{ pointerEvents: 'none' }}
                />
                <text
                  x={(draggedFixedElement === 'customLegend' && tempPosition ? tempPosition.x : fixedElements.customLegend.x) + (resizingFixedElement === 'customLegend' && tempWidth ? tempWidth : fixedElements.customLegend.width) / 2}
                  y={(draggedFixedElement === 'customLegend' && tempPosition ? tempPosition.y : fixedElements.customLegend.y) + (resizingFixedElement === 'customLegend' && tempHeight ? tempHeight : fixedElements.customLegend.height) * 0.15 + ((resizingFixedElement === 'customLegend' && tempHeight ? tempHeight : fixedElements.customLegend.height) * 0.85) / 2}
                  fontSize={getDynamicFontSize('customLegend', 19)}
                  fontWeight="bold"
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="#000000"
                  style={{ pointerEvents: 'none' }}
                  transform={`rotate(-90, ${(draggedFixedElement === 'customLegend' && tempPosition ? tempPosition.x : fixedElements.customLegend.x) + (resizingFixedElement === 'customLegend' && tempWidth ? tempWidth : fixedElements.customLegend.width) / 2}, ${(draggedFixedElement === 'customLegend' && tempPosition ? tempPosition.y : fixedElements.customLegend.y) + (resizingFixedElement === 'customLegend' && tempHeight ? tempHeight : fixedElements.customLegend.height) * 0.15 + ((resizingFixedElement === 'customLegend' && tempHeight ? tempHeight : fixedElements.customLegend.height) * 0.85) / 2})`}
                >
                  {legendUnit?.legend_col2 || 'TOTAL POSTURI INCLUS CONDUCERE'}
                </text>
                
                {/* Column 3 */}
                <text
                  x={(draggedFixedElement === 'customLegend' && tempPosition ? tempPosition.x : fixedElements.customLegend.x) + 5 * (resizingFixedElement === 'customLegend' && tempWidth ? tempWidth : fixedElements.customLegend.width) / 6}
                  y={(draggedFixedElement === 'customLegend' && tempPosition ? tempPosition.y : fixedElements.customLegend.y) + (resizingFixedElement === 'customLegend' && tempHeight ? tempHeight : fixedElements.customLegend.height) * 0.15 + ((resizingFixedElement === 'customLegend' && tempHeight ? tempHeight : fixedElements.customLegend.height) * 0.85) / 2}
                  fontSize={getDynamicFontSize('customLegend', 20)}
                  fontWeight="bold"
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="#000000"
                  style={{ pointerEvents: 'none' }}
                  transform={`rotate(-90, ${(draggedFixedElement === 'customLegend' && tempPosition ? tempPosition.x : fixedElements.customLegend.x) + 5 * (resizingFixedElement === 'customLegend' && tempWidth ? tempWidth : fixedElements.customLegend.width) / 6}, ${(draggedFixedElement === 'customLegend' && tempPosition ? tempPosition.y : fixedElements.customLegend.y) + (resizingFixedElement === 'customLegend' && tempHeight ? tempHeight : fixedElements.customLegend.height) * 0.15 + ((resizingFixedElement === 'customLegend' && tempHeight ? tempHeight : fixedElements.customLegend.height) * 0.85) / 2})`}
                >
                  {legendUnit?.legend_col3 || 'DENUMIRE STRUCTURĂ'}
                </text>
              </g>
              
              {/* Resize handle for customLegend */}
              {!isReadOnly && (
                <path
                  d={`M ${(draggedFixedElement === 'customLegend' && tempPosition ? tempPosition.x : fixedElements.customLegend.x) + (resizingFixedElement === 'customLegend' && tempWidth ? tempWidth : fixedElements.customLegend.width) - 10} ${(draggedFixedElement === 'customLegend' && tempPosition ? tempPosition.y : fixedElements.customLegend.y) + (resizingFixedElement === 'customLegend' && tempHeight ? tempHeight : fixedElements.customLegend.height)} 
                       L ${(draggedFixedElement === 'customLegend' && tempPosition ? tempPosition.x : fixedElements.customLegend.x) + (resizingFixedElement === 'customLegend' && tempWidth ? tempWidth : fixedElements.customLegend.width)} ${(draggedFixedElement === 'customLegend' && tempPosition ? tempPosition.y : fixedElements.customLegend.y) + (resizingFixedElement === 'customLegend' && tempHeight ? tempHeight : fixedElements.customLegend.height)} 
                       L ${(draggedFixedElement === 'customLegend' && tempPosition ? tempPosition.x : fixedElements.customLegend.x) + (resizingFixedElement === 'customLegend' && tempWidth ? tempWidth : fixedElements.customLegend.width)} ${(draggedFixedElement === 'customLegend' && tempPosition ? tempPosition.y : fixedElements.customLegend.y) + (resizingFixedElement === 'customLegend' && tempHeight ? tempHeight : fixedElements.customLegend.height) - 10} Z`}
                  fill="#9ca3af"
                  stroke="none"
                  style={{ cursor: 'nwse-resize' }}
                  onMouseDown={(e) => handleFixedElementResizeMouseDown(e, 'customLegend')}
                />
              )}
            </g>
            )}
            
            {/* Consiliu - draggable and resizable box */}
            <g>
              <g
                onMouseDown={(e) => handleFixedElementMouseDown(e, 'consiliu')}
                style={{ cursor: isReadOnly ? 'default' : 'move' }}
              >
                <rect
                  x={draggedFixedElement === 'consiliu' && tempPosition ? tempPosition.x : fixedElements.consiliu.x}
                  y={draggedFixedElement === 'consiliu' && tempPosition ? tempPosition.y : fixedElements.consiliu.y}
                  width={resizingFixedElement === 'consiliu' && tempWidth ? tempWidth : fixedElements.consiliu.width}
                  height={resizingFixedElement === 'consiliu' && tempHeight ? tempHeight : fixedElements.consiliu.height}
                  fill="white"
                  stroke={draggedFixedElement === 'consiliu' || resizingFixedElement === 'consiliu' ? '#3b82f6' : '#1f2937'}
                  strokeWidth="2"
                />
                <text
                  x={(draggedFixedElement === 'consiliu' && tempPosition ? tempPosition.x : fixedElements.consiliu.x) + (resizingFixedElement === 'consiliu' && tempWidth ? tempWidth : fixedElements.consiliu.width) / 2}
                  y={(draggedFixedElement === 'consiliu' && tempPosition ? tempPosition.y : fixedElements.consiliu.y) + (resizingFixedElement === 'consiliu' && tempHeight ? tempHeight : fixedElements.consiliu.height) / 2 + 8}
                  fontSize={getDynamicFontSize('consiliu', 28)}
                  fontWeight="bold"
                  textAnchor="middle"
                  fill="#000000"
                  style={{ pointerEvents: 'none' }}
                >
                  {consiliuUnit?.name || 'CONSILIUL DE CONDUCERE'}
                </text>
              </g>
              
              {/* Resize handle for consiliu */}
              {!isReadOnly && (
                <path
                  d={`M ${(draggedFixedElement === 'consiliu' && tempPosition ? tempPosition.x : fixedElements.consiliu.x) + (resizingFixedElement === 'consiliu' && tempWidth ? tempWidth : fixedElements.consiliu.width) - 10} ${(draggedFixedElement === 'consiliu' && tempPosition ? tempPosition.y : fixedElements.consiliu.y) + (resizingFixedElement === 'consiliu' && tempHeight ? tempHeight : fixedElements.consiliu.height)} 
                       L ${(draggedFixedElement === 'consiliu' && tempPosition ? tempPosition.x : fixedElements.consiliu.x) + (resizingFixedElement === 'consiliu' && tempWidth ? tempWidth : fixedElements.consiliu.width)} ${(draggedFixedElement === 'consiliu' && tempPosition ? tempPosition.y : fixedElements.consiliu.y) + (resizingFixedElement === 'consiliu' && tempHeight ? tempHeight : fixedElements.consiliu.height)} 
                       L ${(draggedFixedElement === 'consiliu' && tempPosition ? tempPosition.x : fixedElements.consiliu.x) + (resizingFixedElement === 'consiliu' && tempWidth ? tempWidth : fixedElements.consiliu.width)} ${(draggedFixedElement === 'consiliu' && tempPosition ? tempPosition.y : fixedElements.consiliu.y) + (resizingFixedElement === 'consiliu' && tempHeight ? tempHeight : fixedElements.consiliu.height) - 10} Z`}
                  fill="#9ca3af"
                  stroke="none"
                  style={{ cursor: 'nwse-resize' }}
                  onMouseDown={(e) => handleFixedElementResizeMouseDown(e, 'consiliu')}
                />
              )}
            </g>
            
            {/* Draw edges (including consiliu to DG) */}
            {drawEdges()}
            
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
              
              // Check if rotated
              const isRotated = node.unit.is_rotated;
              
              // Calculate font size dynamically based on available space
              const text_length = node.unit.name.length;
              const availableWidth = width - (orgType === 'omti' ? 58 : 83) - 14; // Strip width + safe padding
              const availableHeight = height - 10; // Safe padding top/bottom
              
              let fontSize = '6px';
              let lineHeight = '1.1';
              
              // Balanced character width estimation
              const estimateLines = (fontPx, charWidthRatio = 0.54) => {
                const charWidth = fontPx * charWidthRatio; // Slightly conservative for safety
                const charsPerLine = Math.max(1, Math.floor(availableWidth / charWidth));
                return Math.ceil(text_length / charsPerLine);
              };
              
              // Define font sizes with their properties
              const fontSizes = [
                { size: 20, charWidthRatio: 0.54, lineHeight: 1.25 },
                { size: 18, charWidthRatio: 0.54, lineHeight: 1.25 },
                { size: 16, charWidthRatio: 0.54, lineHeight: 1.25 },
                { size: 15, charWidthRatio: 0.54, lineHeight: 1.2 },
                { size: 14, charWidthRatio: 0.54, lineHeight: 1.2 },
                { size: 13, charWidthRatio: 0.54, lineHeight: 1.2 },
                { size: 12, charWidthRatio: 0.54, lineHeight: 1.2 },
                { size: 11, charWidthRatio: 0.54, lineHeight: 1.15 },
                { size: 10, charWidthRatio: 0.54, lineHeight: 1.15 },
                { size: 9, charWidthRatio: 0.54, lineHeight: 1.15 },
                { size: 8, charWidthRatio: 0.54, lineHeight: 1.1 },
                { size: 7, charWidthRatio: 0.54, lineHeight: 1.1 },
                { size: 6, charWidthRatio: 0.54, lineHeight: 1.1 },
                { size: 5, charWidthRatio: 0.54, lineHeight: 1.05 },
                { size: 4, charWidthRatio: 0.54, lineHeight: 1.05 }
              ];
              
              // Find the largest font where text fits safely
              let selectedFont = fontSizes[fontSizes.length - 1]; // Default to smallest
              
              for (const font of fontSizes) {
                const lines = estimateLines(font.size, font.charWidthRatio);
                const totalHeight = lines * font.size * font.lineHeight;
                
                // Use 91% threshold - maximize text size while keeping safety margin
                if (totalHeight <= availableHeight * 0.91) {
                  selectedFont = font;
                  break;
                }
              }
              
              fontSize = `${selectedFont.size}px`;
              lineHeight = `${selectedFont.lineHeight}`;
              
              // Highlight if this is the nearest parent
              const isNearestParent = nearestParent?.unit_id === node.unit_id;
              
              // Check if this node is selected
              const isSelected = selectedNode?.unit_id === node.unit_id;
              
              // Calculate rotation transform
              const rotationTransform = isRotated 
                ? `rotate(-90, ${x + width / 2}, ${y + height / 2})` 
                : '';
              
              return (
                <g
                  key={node.unit_id}
                  data-unit-id={node.unit_id}
                  transform={rotationTransform}
                  onMouseDown={(e) => {
                    if (!isReadOnly) {
                      handleMouseDown(e, node);
                    }
                  }}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    if (!isReadOnly && onSelectUnit) {
                      onSelectUnit(node.unit);
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
                    stroke={isSelected ? "#3b82f6" : (isNearestParent ? "#10b981" : "#000000")}
                    strokeWidth={isSelected ? "5" : (isNearestParent ? "4" : "3")}
                    rx="6"
                    opacity={isBeingDragged ? 0.7 : 1}
                  />
                  
                  {/* Left colored strip - vertical with 3 columns of numbers (only if stripOnly) */}
                  {colors.stripOnly && (
                    <rect
                      x={x + 1.5}
                      y={y + 1.5}
                      width={orgType === 'omti' ? "48.5" : "73.5"}
                      height={height - 3}
                      fill={colors.bg}
                      stroke="none"
                      rx="4.5"
                      opacity={isBeingDragged ? 0.7 : 1}
                    />
                  )}
                  
                  {/* Vertical line between code and leadership count - full height - only for codificare */}
                  {orgType === 'codificare' && (
                    <line
                      x1={x + 25}
                      y1={y}
                      x2={x + 25}
                      y2={y + height}
                      stroke="#000000"
                      strokeWidth="1"
                    />
                  )}
                  
                  {/* Vertical line between leadership and execution count - full height */}
                  <line
                    x1={orgType === 'omti' ? x + 25 : x + 50}
                    y1={y}
                    x2={orgType === 'omti' ? x + 25 : x + 50}
                    y2={y + height}
                    stroke="#000000"
                    strokeWidth="1"
                  />
                  
                  {/* Vertical line between numbers and name - full height */}
                  <line
                    x1={orgType === 'omti' ? x + 50 : x + 75}
                    y1={y}
                    x2={orgType === 'omti' ? x + 50 : x + 75}
                    y2={y + height}
                    stroke="#000000"
                    strokeWidth="1"
                  />
                  
                  {/* Code - first column in left strip (narrower, vertical text centered) - only show for codificare */}
                  {orgType === 'codificare' && (
                    <text
                      x={x + 12.5}
                      y={y + height / 2}
                      fontSize="14"
                      fontWeight="700"
                      fill="#000000"
                      textAnchor="middle"
                      dominantBaseline="central"
                      letterSpacing="1"
                      transform={`rotate(-90, ${x + 12.5}, ${y + height / 2})`}
                    >
                      {node.unit.stas_code}
                    </text>
                  )}
                  
                  {/* Leadership count - second column in left strip */}
                  <text
                    x={orgType === 'omti' ? x + 12.5 : x + 37.5}
                    y={node.unit.unit_type === 'director_general' ? y + height / 2 : y + height / 2 + 4}
                    fontSize="15"
                    fontWeight="bold"
                    fill="#000000"
                    textAnchor="middle"
                    dominantBaseline={node.unit.unit_type === 'director_general' ? 'central' : 'auto'}
                    transform={node.unit.unit_type === 'director_general' ? `rotate(-90, ${orgType === 'omti' ? x + 12.5 : x + 37.5}, ${y + height / 2})` : ''}
                  >
                    {agg.leadership_positions_count}
                  </text>
                  
                  {/* Execution count - third column in left strip */}
                  <text
                    x={orgType === 'omti' ? x + 37.5 : x + 62.5}
                    y={node.unit.unit_type === 'director_general' ? y + height / 2 : y + height / 2 + 4}
                    fontSize="15"
                    fontWeight="bold"
                    fill="#000000"
                    textAnchor="middle"
                    dominantBaseline={node.unit.unit_type === 'director_general' ? 'central' : 'auto'}
                    transform={node.unit.unit_type === 'director_general' ? `rotate(-90, ${orgType === 'omti' ? x + 37.5 : x + 62.5}, ${y + height / 2})` : ''}
                  >
                    {agg.recursive_total_subordinates > agg.total_positions
                      ? agg.recursive_total_subordinates - agg.leadership_positions_count
                      : agg.execution_positions_count}
                  </text>
                  
                  {/* Unit name - dynamic font size based on available space */}
                  <foreignObject
                    x={orgType === 'omti' ? x + 54 : x + 79}
                    y={y + 2.5}
                    width={orgType === 'omti' ? width - 58 : width - 83}
                    height={height - 5}
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
                        padding: '3px 5px',
                        wordWrap: 'break-word',
                        overflowWrap: 'break-word',
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
