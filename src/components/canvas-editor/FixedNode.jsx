import React from 'react';

/** Reference dimensions for dynamic font scaling */
const BASE_DIMENSIONS = {
  legend: { width: 200, height: 180 },
  director: { width: 200, height: 60 },
  header1: { width: 400, height: 20 },
  header2: { width: 400, height: 20 },
  consiliu: { width: 300, height: 60 },
  customLegend: { width: 200, height: 300 },
};

/**
 * Calculate dynamic font size based on element dimensions vs reference dimensions.
 * Matches the original DeterministicOrgChart getDynamicFontSize logic.
 */
function getDynamicFontSize(elementKey, baseFontSize, currentWidth, currentHeight) {
  const base = BASE_DIMENSIONS[elementKey];
  if (!base) return baseFontSize;
  const scaleX = currentWidth / base.width;
  const scaleY = currentHeight / base.height;
  const scale = Math.min(scaleX, scaleY);
  if (elementKey === 'legend') {
    return Math.max(8, Math.min(baseFontSize * scale, 32));
  }
  return Math.max(6, Math.min(baseFontSize * scale, 24));
}

/**
 * Resize handle — gray triangle in bottom-right corner.
 */
function ResizeHandle({ width, height, isReadOnly, onResizeMouseDown, forceShow }) {
  if (isReadOnly && !forceShow) return null;
  return (
    <g onMouseDown={onResizeMouseDown} style={{ cursor: 'nwse-resize' }} className="resize-handle-no-print">
      <path
        d={`M ${width - 10} ${height} L ${width} ${height} L ${width} ${height - 10} Z`}
        fill="#9ca3af"
        stroke="none"
        style={{ pointerEvents: 'all' }}
      />
    </g>
  );
}

/**
 * FixedNode — renders special fixed elements on the canvas:
 * stats_legend, consiliu, director_legend, custom_legend, and headers.
 */
/** @param {Record<string, any>} props */
function FixedNodeInner({
  type,
  unit,
  position,
  isReadOnly,
  onMouseDown,
  onClick,
  onResizeMouseDown,
  units,
  aggregatesMap,
  orgType,
}) {
  const { x, y, width, height } = position;
  // director_legend is always draggable (even in OMTI read-only mode)
  const isDraggable = !isReadOnly || type === 'director_legend';
  const cursor = isDraggable ? 'grab' : 'default';

  const handleClick = () => {
    // Fixed nodes are not editable via click
  };

  const handleResize = (e) => {
    if (onResizeMouseDown) onResizeMouseDown(e, type);
  };

  if (type === 'stats_legend') {
    // HARDCODED values — to be fixed later with proper dynamic calculation
    const totalLeadership = 18;
    const dgCount = 1;
    const directorCount = 3;
    const deptCount = 2;
    const inspectorCount = 5;
    const serviceCount = 7;
    const totalPosts = 230;
    const totalExecution = 212;

    return (
      <g transform={`translate(${x}, ${y})`} style={{ cursor }} onMouseDown={onMouseDown}>
        <rect x={0} y={0} width={width} height={height} fill="transparent" stroke="transparent" strokeWidth="2" />
        <foreignObject x={0} y={0} width={width} height={height} style={{ pointerEvents: 'none' }}>
          <div className="border-2 border-gray-800 p-2 bg-gray-50 h-full overflow-hidden flex items-center justify-center" style={{ fontSize: `${getDynamicFontSize('legend', 14, width, height)}px` }}>
            <div className="text-center">
              <div className="font-bold mb-1">TOTAL POSTURI: {totalPosts}</div>
              <div className="font-bold mb-0.5">Funcții de conducere: {totalLeadership}</div>
              <div className="font-bold ml-2">- Director general: {dgCount}</div>
              <div className="font-bold ml-2">- Director: {directorCount}</div>
              <div className="font-bold ml-2">- Șef departament: {deptCount}</div>
              <div className="font-bold ml-2">- Inspector șef: {inspectorCount}</div>
              <div className="font-bold ml-2">- Șef serviciu: {serviceCount}</div>
              <div className="font-bold mt-0.5">Posturi de execuție: {totalExecution}</div>
            </div>
          </div>
        </foreignObject>
        <ResizeHandle width={width} height={height} isReadOnly={isReadOnly} onResizeMouseDown={handleResize} />
      </g>
    );
  }

  if (type === 'consiliu') {
    return (
      <g transform={`translate(${x}, ${y})`} style={{ cursor }} onMouseDown={onMouseDown} onClick={handleClick}>
        <rect x={0} y={0} width={width} height={height} fill="white" stroke="#000000" strokeWidth="2" rx="6" />
        <text x={width / 2} y={height / 2 + 8} textAnchor="middle" fontSize={getDynamicFontSize('consiliu', 20, width, height)} fontWeight="bold" fill="#000000" style={{ pointerEvents: 'none' }}>
          {unit?.name || 'CONSILIUL DE CONDUCERE'}
        </text>
        <ResizeHandle width={width} height={height} isReadOnly={isReadOnly} onResizeMouseDown={handleResize} />
      </g>
    );
  }

  if (type === 'director_legend') {
    const isOmti = orgType === 'omti';
    const directorStroke = isOmti ? 'transparent' : '#d1d5db';
    const directorFontSize = getDynamicFontSize('director', 14, width, height);

    if (isOmti) {
      return (
        <g transform={`translate(${x}, ${y})`} style={{ cursor }} onMouseDown={onMouseDown} onClick={handleClick}>
          <rect x={0} y={0} width={width} height={height} fill="white" stroke={directorStroke} strokeWidth="2" />
          <text x={width / 2} y={height / 4} textAnchor="middle" fontSize={directorFontSize} fontWeight="bold" fill="#000000" style={{ pointerEvents: 'none' }}>
            ANEXA
          </text>
          <text x={width / 2} y={height / 2} textAnchor="middle" fontSize={directorFontSize} fontWeight="bold" fill="#000000" style={{ pointerEvents: 'none' }}>
            LA ORDINUL MINISTRULUI TRANSPORTURILOR ȘI INFRASTRUCTURII
          </text>
          <text x={width / 2} y={3 * height / 4} textAnchor="middle" fontSize={directorFontSize} fontWeight="bold" fill="#000000" style={{ pointerEvents: 'none' }}>
            NR. ........................ din ........................
          </text>
          <ResizeHandle width={width} height={height} isReadOnly={isReadOnly} forceShow={isOmti} onResizeMouseDown={handleResize} />
        </g>
      );
    }

    return (
      <g transform={`translate(${x}, ${y})`} style={{ cursor }} onMouseDown={onMouseDown} onClick={handleClick}>
        <rect x={0} y={0} width={width} height={height} fill="white" stroke={directorStroke} strokeWidth="2" />
        <text x={width / 2} y={height / 3} textAnchor="middle" fontSize={directorFontSize} fontWeight="bold" fill="#000000" style={{ pointerEvents: 'none' }}>
          {unit?.director_title || 'DIRECTOR GENERAL'}
        </text>
        <text x={width / 2} y={2 * height / 3} textAnchor="middle" fontSize={directorFontSize} fontWeight="bold" fill="#000000" style={{ pointerEvents: 'none' }}>
          {unit?.director_name || 'Petru BOGDAN'}
        </text>
        <ResizeHandle width={width} height={height} isReadOnly={isReadOnly} onResizeMouseDown={handleResize} />
      </g>
    );
  }

  if (type === 'custom_legend') {
    const headerHeight = height * 0.15;
    const bodyTop = headerHeight;
    const bodyHeight = height * 0.85;
    const col1Center = width / 6;
    const col2Center = width / 2;
    const col3Center = 5 * width / 6;
    const colCenterY = bodyTop + bodyHeight / 2;
    const headerFontSize = getDynamicFontSize('customLegend', 22, width, height);
    const colFontSize = getDynamicFontSize('customLegend', 20, width, height);

    return (
      <g transform={`translate(${x}, ${y})`} style={{ cursor }} onMouseDown={onMouseDown} onClick={handleClick}>
        <rect x={0} y={0} width={width} height={height} fill="white" stroke="#1f2937" strokeWidth="2" />
        <rect x={0} y={0} width={width} height={headerHeight} fill="white" stroke="#1f2937" strokeWidth="2" style={{ pointerEvents: 'none' }} />
        <text x={width / 2} y={headerHeight * 0.5 + 5} fontSize={headerFontSize} fontWeight="bold" textAnchor="middle" fill="#000000" style={{ pointerEvents: 'none' }}>Legendă</text>
        <line x1={width / 3} y1={bodyTop} x2={width / 3} y2={height} stroke="#1f2937" strokeWidth="2" style={{ pointerEvents: 'none' }} />
        <line x1={2 * width / 3} y1={bodyTop} x2={2 * width / 3} y2={height} stroke="#1f2937" strokeWidth="2" style={{ pointerEvents: 'none' }} />
        <text x={col1Center} y={colCenterY} fontSize={colFontSize} fontWeight="bold" textAnchor="middle" dominantBaseline="central" fill="#000000" style={{ pointerEvents: 'none' }} transform={`rotate(-90, ${col1Center}, ${colCenterY})`}>
          {unit?.legend_col1 || 'NUMĂR POSTURI CONDUCERE'}
        </text>
        <text x={col2Center} y={colCenterY} fontSize={colFontSize} fontWeight="bold" textAnchor="middle" dominantBaseline="central" fill="#000000" style={{ pointerEvents: 'none' }} transform={`rotate(-90, ${col2Center}, ${colCenterY})`}>
          {unit?.legend_col2 || 'TOTAL POSTURI INCLUS CONDUCERE'}
        </text>
        <text x={col3Center} y={colCenterY} fontSize={colFontSize} fontWeight="bold" textAnchor="middle" dominantBaseline="central" fill="#000000" style={{ pointerEvents: 'none' }} transform={`rotate(-90, ${col3Center}, ${colCenterY})`}>
          {unit?.legend_col3 || 'DENUMIRE STRUCTURĂ'}
        </text>
        <ResizeHandle width={width} height={height} isReadOnly={isReadOnly} onResizeMouseDown={handleResize} />
      </g>
    );
  }

  if (type === 'header') {
    return (
      <g transform={`translate(${x}, ${y})`} style={{ cursor }} onMouseDown={onMouseDown} onClick={handleClick}>
        <rect x={0} y={0} width={width} height={height} fill="transparent" stroke="transparent" strokeWidth="2" />
        <text x={width / 2} y={height / 2 + 4} textAnchor="middle" fontSize={getDynamicFontSize('header1', 14, width, height)} fontWeight="bold" fill="#000000" style={{ pointerEvents: 'none' }}>
          {unit?.name || ''}
        </text>
        <ResizeHandle width={width} height={height} isReadOnly={isReadOnly} forceShow={orgType === 'omti'} onResizeMouseDown={handleResize} />
      </g>
    );
  }

  if (type === 'header_editable') {
    const onEditClick = position._onEditClick;
    return (
      <g transform={`translate(${x}, ${y})`} style={{ cursor: !isReadOnly ? 'pointer' : 'default' }} onMouseDown={onMouseDown}>
        <rect x={0} y={0} width={width} height={height} fill="transparent" stroke="transparent" strokeWidth="2" />
        {!isReadOnly && (
          <rect x={0} y={0} width={width} height={height} fill="transparent"
            style={{ cursor: 'pointer', pointerEvents: 'all' }}
            onClick={(e) => { e.stopPropagation(); if (onEditClick) onEditClick(); }}
          />
        )}
        <text x={width / 2} y={height / 2 + 4} textAnchor="middle" fontSize={getDynamicFontSize('header2', 14, width, height)} fontWeight="bold" fill="#000000" style={{ pointerEvents: 'none' }}>
          {unit?.name || ''}
        </text>
        <ResizeHandle width={width} height={height} isReadOnly={isReadOnly} onResizeMouseDown={handleResize} />
      </g>
    );
  }

  return null;
}

const FixedNode = React.memo(FixedNodeInner);

export default FixedNode;
