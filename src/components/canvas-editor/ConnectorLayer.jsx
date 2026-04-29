import React from 'react';

/**
 * ConnectorLayer — SVG component that renders all orthogonal connectors
 * between parent-child units using the exact quadrant-based logic from
 * DeterministicOrgChart.
 *
 * Props:
 * - units: array of OrgUnit objects
 * - positions: plain object mapping unitId → { x, y, width, height }
 * - consiliuPosition: { x, y, width, height } | null — position of the consiliu fixed element
 */
/** @param {Record<string, any>} props */
function ConnectorLayerInner({ units, positions, consiliuPosition }) {
  if (!units || units.length === 0) {
    return <g className="connector-layer" />;
  }

  const lines = [];
  const visitedNodes = new Set();

  // Calculate canvas bounds
  // Use DB positions (custom_x/y) for center calculation to keep it stable during drag
  let maxX = 1400;
  let maxY = 900;
  for (const unit of units) {
    const ux = unit.custom_x ?? 0;
    const uy = unit.custom_y ?? 0;
    const uw = unit.custom_width ?? 320;
    const uh = unit.custom_height ?? 45;
    maxX = Math.max(maxX, ux + uw + 100);
    maxY = Math.max(maxY, uy + uh + 120);
  }
  const centerX = maxX / 2;
  const centerY = maxY / 2;

  // Find director general
  const directorUnit = units.find(u => u.unit_type === 'director_general');
  if (!directorUnit) {
    return <g className="connector-layer" />;
  }

  const directorPos = positions?.[directorUnit.id];
  if (!directorPos) {
    return <g className="connector-layer" />;
  }

  // Consiliu to Director line
  if (consiliuPosition && directorPos) {
    const consiliuCenterX = consiliuPosition.x + consiliuPosition.width / 2;
    const consiliuBottom = consiliuPosition.y + consiliuPosition.height;
    const directorCenterX = directorPos.x + directorPos.width / 2;
    const directorTop = directorPos.y;

    lines.push(
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
  }

  const directorCenterY = directorPos.y + directorPos.height / 2;
  const directorLeft = directorPos.x;
  const directorRight = directorPos.x + directorPos.width;

  // Find all children of Director General
  const directorChildren = units.filter(u => u.parent_unit_id === directorUnit.id);

  // Classify into quadrants
  const topLeftChildren = directorChildren.filter(c => {
    const pos = positions?.[c.id];
    if (!pos) return false;
    const childCenterX = pos.x + pos.width / 2;
    const childCenterY = pos.y + pos.height / 2;
    return childCenterX < centerX && childCenterY < centerY;
  });

  const topRightChildren = directorChildren.filter(c => {
    const pos = positions?.[c.id];
    if (!pos) return false;
    const childCenterX = pos.x + pos.width / 2;
    const childCenterY = pos.y + pos.height / 2;
    return childCenterX >= centerX && childCenterY < centerY;
  });

  const bottomChildren = directorChildren.filter(c => {
    const pos = positions?.[c.id];
    if (!pos) return false;
    const childCenterY = pos.y + pos.height / 2;
    return childCenterY >= centerY;
  });

  // ---- Recursive function: LEFT-side connections ----
  const drawChildrenEdges = (parentId, parentPos, children, useDistributionX = null) => {
    if (children.length === 0) return;
    if (visitedNodes.has(parentId)) return;
    visitedNodes.add(parentId);

    const parentLeftX = parentPos.x;
    const parentCY = parentPos.y + parentPos.height / 2;
    const distributionX = useDistributionX !== null ? useDistributionX : parentLeftX - 20;

    // Horizontal stub from parent left to distribution line (skip if reusing parent's distribution line)
    if (useDistributionX === null) {
      lines.push(
        <line
          key={`h-${parentId}`}
          x1={parentLeftX}
          y1={parentCY}
          x2={distributionX}
          y2={parentCY}
          stroke="#374151"
          strokeWidth="2"
        />
      );
    }

    // Vertical distribution line
    const childCYs = children.map(c => {
      const p = positions?.[c.id];
      return p ? p.y + p.height / 2 : parentCY;
    });
    const minY = Math.min(parentCY, ...childCYs);
    const localMaxY = Math.max(parentCY, ...childCYs);

    lines.push(
      <line
        key={`v-${parentId}`}
        x1={distributionX}
        y1={minY}
        x2={distributionX}
        y2={localMaxY}
        stroke="#374151"
        strokeWidth="2"
      />
    );

    // Branches to each child
    children.forEach(child => {
      const childPos = positions?.[child.id];
      if (!childPos) return;
      const childCY = childPos.y + childPos.height / 2;
      const childLeftX = childPos.x;

      lines.push(
        <line
          key={`branch-${parentId}-${child.id}`}
          x1={distributionX}
          y1={childCY}
          x2={childLeftX}
          y2={childCY}
          stroke="#374151"
          strokeWidth="2"
        />
      );

      // Recurse for grandchildren — each level gets its own distribution line
      const grandchildren = units.filter(u => u.parent_unit_id === child.id);
      if (grandchildren.length > 0) {
        drawChildrenEdges(child.id, childPos, grandchildren);
      }
    });
  };

  // ---- Recursive function: RIGHT-side connections ----
  const drawTopRightChildrenEdges = (parentId, parentPos, children) => {
    if (children.length === 0) return;
    const visitKey = 'r-' + parentId;
    if (visitedNodes.has(visitKey)) return;
    visitedNodes.add(visitKey);

    const parentRightX = parentPos.x + parentPos.width;
    const parentCY = parentPos.y + parentPos.height / 2;
    const distributionX = parentRightX + 20;

    // Horizontal stub from parent right to distribution line
    lines.push(
      <line
        key={`h-tr-${parentId}`}
        x1={parentRightX}
        y1={parentCY}
        x2={distributionX}
        y2={parentCY}
        stroke="#374151"
        strokeWidth="2"
      />
    );

    // Vertical distribution line
    const childCYs = children.map(c => {
      const p = positions?.[c.id];
      return p ? p.y + p.height / 2 : parentCY;
    });
    const minY = Math.min(parentCY, ...childCYs);
    const localMaxY = Math.max(parentCY, ...childCYs);

    lines.push(
      <line
        key={`v-tr-${parentId}`}
        x1={distributionX}
        y1={minY}
        x2={distributionX}
        y2={localMaxY}
        stroke="#374151"
        strokeWidth="2"
      />
    );

    // Branches to each child (connect to LEFT side)
    children.forEach(child => {
      const childPos = positions?.[child.id];
      if (!childPos) return;
      const childCY = childPos.y + childPos.height / 2;
      const childLeftX = childPos.x;

      lines.push(
        <line
          key={`branch-tr-${parentId}-${child.id}`}
          x1={distributionX}
          y1={childCY}
          x2={childLeftX}
          y2={childCY}
          stroke="#374151"
          strokeWidth="2"
        />
      );

      // Recurse for grandchildren
      const grandchildren = units.filter(u => u.parent_unit_id === child.id);
      if (grandchildren.length > 0) {
        drawTopRightChildrenEdges(child.id, childPos, grandchildren);
      }
    });
  };

  // ---- Recursive function: BOTTOM connections ----
  const drawBottomChildrenEdges = (parentId, parentPos, children) => {
    if (children.length === 0) return;

    if (children.length === 1) {
      const child = children[0];
      const childPos = positions?.[child.id];
      if (!childPos) return;

      const parentCX = parentPos.x + parentPos.width / 2;
      const parentBottom = parentPos.y + parentPos.height;
      const childCX = childPos.x + childPos.width / 2;
      const childTop = childPos.y;

      lines.push(
        <line
          key={`single-${child.id}`}
          x1={parentCX}
          y1={parentBottom}
          x2={childCX}
          y2={childTop}
          stroke="#374151"
          strokeWidth="2"
        />
      );

      const grandchildren = units.filter(u => u.parent_unit_id === child.id);
      if (grandchildren.length > 0) {
        drawBottomChildrenEdges(child.id, childPos, grandchildren);
      }
    } else {
      const parentCX = parentPos.x + parentPos.width / 2;
      const parentBottom = parentPos.y + parentPos.height;
      const distributionY = parentBottom + 20;

      // Vertical stub from parent bottom
      lines.push(
        <line
          key={`v-bottom-${parentId}`}
          x1={parentCX}
          y1={parentBottom}
          x2={parentCX}
          y2={distributionY}
          stroke="#374151"
          strokeWidth="2"
        />
      );

      // Horizontal distribution line
      const childCXs = children.map(c => {
        const p = positions?.[c.id];
        return p ? p.x + p.width / 2 : parentCX;
      });
      const minX = Math.min(parentCX, ...childCXs);
      const localMaxX = Math.max(parentCX, ...childCXs);

      lines.push(
        <line
          key={`h-bottom-${parentId}`}
          x1={minX}
          y1={distributionY}
          x2={localMaxX}
          y2={distributionY}
          stroke="#374151"
          strokeWidth="2"
        />
      );

      // Vertical branches to each child
      children.forEach(child => {
        const childPos = positions?.[child.id];
        if (!childPos) return;
        const childCX = childPos.x + childPos.width / 2;
        const childTop = childPos.y;

        lines.push(
          <line
            key={`branch-bottom-${child.id}`}
            x1={childCX}
            y1={distributionY}
            x2={childCX}
            y2={childTop}
            stroke="#374151"
            strokeWidth="2"
          />
        );

        const grandchildren = units.filter(u => u.parent_unit_id === child.id);
        if (grandchildren.length > 0) {
          drawBottomChildrenEdges(child.id, childPos, grandchildren);
        }
      });
    }
  };

  // ========== 1. Handle TOP-LEFT quadrant children ==========
  if (topLeftChildren.length > 0) {
    const startX = directorLeft;
    const startY = directorCenterY;
    const distributionX = startX - 20;

    lines.push(
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

    const childCYs = topLeftChildren.map(c => {
      const p = positions?.[c.id];
      return p ? p.y + p.height / 2 : startY;
    });
    const minY = Math.min(startY, ...childCYs);
    const tlMaxY = Math.max(startY, ...childCYs);

    lines.push(
      <line
        key="director-left-v"
        x1={distributionX}
        y1={minY}
        x2={distributionX}
        y2={tlMaxY}
        stroke="#374151"
        strokeWidth="2"
      />
    );

    topLeftChildren.forEach(child => {
      const childPos = positions?.[child.id];
      if (!childPos) return;
      const childCY = childPos.y + childPos.height / 2;
      const childRight = childPos.x + childPos.width;

      // Check if this child is part of a visual group (1004, 1005)
      const groupedCodes = ['1004', '1005'];
      const isGrouped = groupedCodes.includes(child.stas_code);
      const groupSiblings = isGrouped ? topLeftChildren.filter(c => groupedCodes.includes(c.stas_code)) : [];

      if (isGrouped && groupSiblings.length >= 2) {
        // Connect to a sub-distribution line instead of main distribution
        const subDistX = distributionX + 15;
        lines.push(
          <line
            key={`tl-branch-${child.id}`}
            x1={subDistX}
            y1={childCY}
            x2={childRight}
            y2={childCY}
            stroke="#374151"
            strokeWidth="2"
          />
        );
      } else {
        lines.push(
          <line
            key={`tl-branch-${child.id}`}
            x1={distributionX}
            y1={childCY}
            x2={childRight}
            y2={childCY}
            stroke="#374151"
            strokeWidth="2"
          />
        );
      }

      // Handle grandchildren — determine left vs right based on average position
      const grandchildren = units.filter(u => u.parent_unit_id === child.id);
      if (grandchildren.length > 0) {
        const childCenterX = childPos.x + childPos.width / 2;
        const grandchildrenCenterX = grandchildren.reduce((sum, gc) => {
          const gp = positions?.[gc.id];
          return sum + (gp ? gp.x + gp.width / 2 : childCenterX);
        }, 0) / grandchildren.length;

        if (grandchildrenCenterX > childCenterX) {
          drawTopRightChildrenEdges(child.id, childPos, grandchildren);
        } else {
          drawChildrenEdges(child.id, childPos, grandchildren);
        }
      }
    });

    // Draw sub-distribution line for grouped units (1004, 1005)
    const groupedCodes = ['1004', '1005'];
    const groupedChildren = topLeftChildren.filter(c => groupedCodes.includes(c.stas_code));
    if (groupedChildren.length >= 2) {
      const subDistX = distributionX + 15;
      const groupCYs = groupedChildren.map(c => {
        const p = positions?.[c.id];
        return p ? p.y + p.height / 2 : 0;
      }).filter(y => y > 0);
      const groupMinY = Math.min(...groupCYs);
      const groupMaxY = Math.max(...groupCYs);

      // Vertical sub-distribution line
      lines.push(
        <line
          key="group-1004-1005-v"
          x1={subDistX}
          y1={groupMinY}
          x2={subDistX}
          y2={groupMaxY}
          stroke="#374151"
          strokeWidth="2"
        />
      );

      // Horizontal connector from main distribution to sub-distribution
      const groupMidY = (groupMinY + groupMaxY) / 2;
      lines.push(
        <line
          key="group-1004-1005-h"
          x1={distributionX}
          y1={groupMidY}
          x2={subDistX}
          y2={groupMidY}
          stroke="#374151"
          strokeWidth="2"
        />
      );
    }
  }

  // ========== 2. Handle TOP-RIGHT quadrant children ==========
  if (topRightChildren.length > 0) {
    const startX = directorRight;
    const startY = directorCenterY;
    const distributionX = startX + 20;

    lines.push(
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

    const childCYs = topRightChildren.map(c => {
      const p = positions?.[c.id];
      return p ? p.y + p.height / 2 : startY;
    });
    const minY = Math.min(startY, ...childCYs);
    const trMaxY = Math.max(startY, ...childCYs);

    lines.push(
      <line
        key="director-right-v"
        x1={distributionX}
        y1={minY}
        x2={distributionX}
        y2={trMaxY}
        stroke="#374151"
        strokeWidth="2"
      />
    );

    // Connect each child directly from the main distribution line
    topRightChildren.forEach(child => {
      const childPos = positions?.[child.id];
      if (!childPos) return;
      const childCY = childPos.y + childPos.height / 2;
      const childLeftX = childPos.x;

      lines.push(
        <line
          key={`tr-branch-${child.id}`}
          x1={distributionX}
          y1={childCY}
          x2={childLeftX}
          y2={childCY}
          stroke="#374151"
          strokeWidth="2"
        />
      );

      // Handle grandchildren
      const grandchildren = units.filter(u => u.parent_unit_id === child.id);
      if (grandchildren.length > 0) {
        drawTopRightChildrenEdges(child.id, childPos, grandchildren);
      }
    });
  }

  // ========== 3. Handle BOTTOM quadrant children ==========
  if (bottomChildren.length > 0) {
    const dirCX = directorPos.x + directorPos.width / 2;
    const dirBottom = directorPos.y + directorPos.height;

    // Distribution Y: 20px above the topmost bottom child
    const bottomChildYs = bottomChildren.map(c => {
      const p = positions?.[c.id];
      return p ? p.y : Infinity;
    });
    const distributionY = Math.min(...bottomChildYs) - 20;

    // Vertical line from director bottom to distribution Y
    lines.push(
      <line
        key="director-bottom-v"
        x1={dirCX}
        y1={dirBottom}
        x2={dirCX}
        y2={distributionY}
        stroke="#374151"
        strokeWidth="2"
      />
    );

    const childCXs = bottomChildren.map(c => {
      const p = positions?.[c.id];
      return p ? p.x + p.width / 2 : dirCX;
    });
    const minX = Math.min(dirCX, ...childCXs);
    const bMaxX = Math.max(dirCX, ...childCXs);

    // Horizontal distribution line
    lines.push(
      <line
        key="director-bottom-h"
        x1={minX}
        y1={distributionY}
        x2={bMaxX}
        y2={distributionY}
        stroke="#374151"
        strokeWidth="2"
      />
    );

    bottomChildren.forEach(child => {
      const childPos = positions?.[child.id];
      if (!childPos) return;
      const childCX = childPos.x + childPos.width / 2;
      const childTop = childPos.y;

      lines.push(
        <line
          key={`bottom-branch-${child.id}`}
          x1={childCX}
          y1={distributionY}
          x2={childCX}
          y2={childTop}
          stroke="#374151"
          strokeWidth="2"
        />
      );

      const grandchildren = units.filter(u => u.parent_unit_id === child.id);
      if (grandchildren.length > 0) {
        drawBottomChildrenEdges(child.id, childPos, grandchildren);
      }
    });
  }

  return <g className="connector-layer">{lines}</g>;
}

const ConnectorLayer = React.memo(ConnectorLayerInner);

export default ConnectorLayer;
