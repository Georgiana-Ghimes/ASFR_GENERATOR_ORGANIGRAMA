import React from 'react';

/**
 * Color map matching the original DeterministicOrgChart.jsx exactly.
 */
const colorMap = {
  '#86C67C': { bg: '#86C67C', stripOnly: true },
  '#86C67C-full': { bg: '#86C67C', stripOnly: false },
  '#E8B4D4': { bg: '#E8B4D4', stripOnly: true },
  '#E8B4D4-full': { bg: '#E8B4D4', stripOnly: false },
  '#F4E03C': { bg: '#F4E03C', stripOnly: true },
  '#F4E03C-full': { bg: '#F4E03C', stripOnly: false },
  '#8CB4D4': { bg: '#8CB4D4', stripOnly: true },
  '#8CB4D4-full': { bg: '#8CB4D4', stripOnly: false },
  '#F4A43C': { bg: '#F4A43C', stripOnly: true },
  '#F4A43C-full': { bg: '#F4A43C', stripOnly: false },
  '#B07CD8': { bg: '#B07CD8', stripOnly: true },
  '#B07CD8-full': { bg: '#B07CD8', stripOnly: false },
  '#5CB8B2': { bg: '#5CB8B2', stripOnly: true },
  '#5CB8B2-full': { bg: '#5CB8B2', stripOnly: false },
};

function getUnitColor(unit) {
  if (unit.color && colorMap[unit.color]) {
    return colorMap[unit.color];
  }
  if (unit.unit_type === 'director_general') {
    return { bg: '#4A7C4E', stripOnly: false };
  }
  return { bg: '#ffffff', stripOnly: true };
}

/**
 * Dynamic font sizing algorithm from the original DeterministicOrgChart.
 * Returns { fontSize, lineHeight } strings.
 */
function computeFontSize(name, availableWidth, availableHeight) {
  const textLength = name ? name.length : 0;

  const estimateLines = (fontPx, charWidthRatio = 0.54) => {
    const charWidth = fontPx * charWidthRatio;
    const charsPerLine = Math.max(1, Math.floor(availableWidth / charWidth));
    return Math.ceil(textLength / charsPerLine);
  };

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
    { size: 4, charWidthRatio: 0.54, lineHeight: 1.05 },
  ];

  let selected = fontSizes[fontSizes.length - 1];

  for (const font of fontSizes) {
    const lines = estimateLines(font.size, font.charWidthRatio);
    const totalHeight = lines * font.size * font.lineHeight;
    if (totalHeight <= availableHeight * 0.91) {
      selected = font;
      break;
    }
  }

  return { fontSize: `${selected.size}px`, lineHeight: `${selected.lineHeight}` };
}

/** @param {Record<string, any>} props */
function UnitNodeInner({
  unit,
  aggregates,
  isSelected,
  isDragging,
  isReadOnly,
  position,
  size,
  onMouseDown,
  onContextMenu,
  onResizeHandleMouseDown,
  orgType = 'codificare',
}) {
  const { x, y } = position;
  const { width, height } = size;

  const colors = getUnitColor(unit);
  const { bg, stripOnly } = colors;

  const isDirectorGeneral = unit.unit_type === 'director_general';
  const isOmti = orgType === 'omti';

  // Aggregates
  const agg = aggregates || {
    leadership_positions_count: 0,
    execution_positions_count: 0,
    total_positions: 0,
    recursive_total_subordinates: 0,
  };
  const leadershipCount = agg.leadership_positions_count;
  // Column 3: recursive total for all units, minus own leadership for root (director_general)
  const executionCount = isDirectorGeneral
    ? agg.recursive_total_subordinates - agg.leadership_positions_count
    : agg.recursive_total_subordinates;

  // OMTI vs codificare layout constants
  const stripWidth = isOmti ? 48.5 : 73.5;
  const leaderExecDividerX = isOmti ? 25 : 50;
  const numbersNameDividerX = isOmti ? 50 : 75;
  const leadershipTextX = isOmti ? 12.5 : 37.5;
  const executionTextX = isOmti ? 37.5 : 62.5;
  // Text area uses same dimensions in both modes for consistency
  const foX = 79;
  const foWidthOffset = 83;

  // Dynamic font sizing for unit name
  const availableWidth = width - foWidthOffset - 14;
  const availableHeight = height - 10;
  const { fontSize, lineHeight } = computeFontSize(unit.name, availableWidth, availableHeight);

  // Rotation
  const centerX = width / 2;
  const centerY = height / 2;
  const rotationTransform = unit.is_rotated ? ` rotate(-90, ${centerX}, ${centerY})` : '';

  return (
    <g
      data-unit-id={unit.id}
      transform={`translate(${x}, ${y})${rotationTransform}`}
      style={{
        cursor: !isReadOnly ? 'move' : 'default',
        pointerEvents: 'all',
      }}
      onMouseDown={(e) => onMouseDown(e, unit)}
      onContextMenu={(e) => {
        e.preventDefault();
        onContextMenu(e, unit);
      }}
    >
      {/* Main box */}
      <rect
        x={0}
        y={0}
        width={width}
        height={height}
        fill={stripOnly ? '#ffffff' : bg}
        stroke={isSelected ? '#3b82f6' : '#000000'}
        strokeWidth={isSelected ? '5' : '3'}
        rx="6"
        opacity={isDragging ? 0.7 : 1}
      />

      {/* Left colored strip — only when stripOnly */}
      {stripOnly && (
        <rect
          x={1.5}
          y={1.5}
          width={stripWidth}
          height={height - 3}
          fill={bg}
          stroke="none"
          rx="4.5"
          opacity={isDragging ? 0.7 : 1}
        />
      )}

      {/* Vertical divider: between code and leadership (at x+25) — codificare only */}
      {!isOmti && (
        <line x1={25} y1={0} x2={25} y2={height} stroke="#000000" strokeWidth="1" />
      )}

      {/* Vertical divider: between leadership and execution */}
      <line x1={leaderExecDividerX} y1={0} x2={leaderExecDividerX} y2={height} stroke="#000000" strokeWidth="1" />

      {/* Vertical divider: between numbers and name */}
      <line x1={numbersNameDividerX} y1={0} x2={numbersNameDividerX} y2={height} stroke="#000000" strokeWidth="1" />

      {/* STAS code — first column, rotated -90° — codificare only */}
      {!isOmti && (
        <text
          x={12.5}
          y={height / 2}
          fontSize="14"
          fontWeight="700"
          fill="#000000"
          textAnchor="middle"
          dominantBaseline="central"
          letterSpacing="1"
          transform={`rotate(-90, 12.5, ${height / 2})`}
        >
          {unit.stas_code}
        </text>
      )}

      {/* Leadership count */}
      <text
        x={leadershipTextX}
        y={isDirectorGeneral ? height / 2 : height / 2 + 4}
        fontSize="15"
        fontWeight="bold"
        fill="#000000"
        textAnchor="middle"
        dominantBaseline={isDirectorGeneral ? 'central' : 'auto'}
        transform={isDirectorGeneral ? `rotate(-90, ${leadershipTextX}, ${height / 2})` : ''}
      >
        {leadershipCount}
      </text>

      {/* Execution count */}
      <text
        x={executionTextX}
        y={isDirectorGeneral ? height / 2 : height / 2 + 4}
        fontSize="15"
        fontWeight="bold"
        fill="#000000"
        textAnchor="middle"
        dominantBaseline={isDirectorGeneral ? 'central' : 'auto'}
        transform={isDirectorGeneral ? `rotate(-90, ${executionTextX}, ${height / 2})` : ''}
      >
        {executionCount}
      </text>

      {/* Unit name — foreignObject with dynamic font sizing */}
      <foreignObject x={foX} y={2.5} width={width - foWidthOffset} height={height - 5}>
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            fontSize,
            fontWeight: '600',
            color: '#000000',
            lineHeight,
            padding: '3px 5px',
            wordWrap: 'break-word',
            overflowWrap: 'break-word',
            overflow: 'hidden',
            hyphens: 'auto',
            userSelect: 'none',
            opacity: isDragging ? 0.7 : 1,
          }}
        >
          {unit.name}
        </div>
      </foreignObject>

      {/* Resize handle — colored triangle in bottom-right corner */}
      {!isReadOnly && (
        <g
          onMouseDown={(e) => {
            e.stopPropagation();
            onResizeHandleMouseDown(e, unit.id, 'se', width, height);
          }}
          style={{ cursor: 'nwse-resize' }}
        >
          <path
            d={`M ${width - 20} ${height} L ${width} ${height} L ${width} ${height - 20} Z`}
            fill={bg}
            opacity="0.8"
            style={{ pointerEvents: 'all' }}
          />
          <line
            x1={width - 6}
            y1={height - 3}
            x2={width - 3}
            y2={height - 6}
            stroke="#ffffff"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <line
            x1={width - 10}
            y1={height - 3}
            x2={width - 3}
            y2={height - 10}
            stroke="#ffffff"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </g>
      )}
    </g>
  );
}

const UnitNode = React.memo(UnitNodeInner);

export default UnitNode;
