import { CONNECTOR_VERTICAL_GAP } from './canvasUtils';

/**
 * Generate an SVG path string for an orthogonal connector between parent and child.
 *
 * The connector follows the existing DeterministicOrgChart pattern:
 * 1. Starts from the LEFT side of the parent at its vertical center
 * 2. Goes 20px to the left (distribution line)
 * 3. Then vertical to the child's vertical center
 * 4. Then horizontal to the child's LEFT side
 *
 * @param {{ x: number, y: number, width: number, height: number }} parent
 * @param {{ x: number, y: number, width: number, height: number }} child
 * @returns {string} SVG path string using M, L commands
 */
export function generateConnectorPath(parent, child) {
  const parentLeft = parent.x;
  const parentCenterY = parent.y + parent.height / 2;
  const distributionX = parentLeft - CONNECTOR_VERTICAL_GAP;
  const childCenterY = child.y + child.height / 2;
  const childLeft = child.x;

  return [
    `M ${parentLeft} ${parentCenterY}`,
    `L ${distributionX} ${parentCenterY}`,
    `L ${distributionX} ${childCenterY}`,
    `L ${childLeft} ${childCenterY}`,
  ].join(' ');
}

/**
 * Generate SVG path strings for grouped connectors (multiple children sharing
 * a common vertical distribution line).
 *
 * Pattern (matching DeterministicOrgChart):
 * - Horizontal stub from parent LEFT side to distribution line (20px left)
 * - Vertical distribution line spanning from min to max child center Y
 *   (also including parent center Y)
 * - Horizontal branches from distribution line to each child's LEFT side
 *
 * @param {{ x: number, y: number, width: number, height: number }} parent
 * @param {Array<{ x: number, y: number, width: number, height: number }>} children
 * @returns {string[]} Array of SVG path strings
 */
export function generateGroupedConnectorPaths(parent, children) {
  if (!children || children.length === 0) {
    return [];
  }

  if (children.length === 1) {
    return [generateConnectorPath(parent, children[0])];
  }

  const parentLeft = parent.x;
  const parentCenterY = parent.y + parent.height / 2;
  const distributionX = parentLeft - CONNECTOR_VERTICAL_GAP;

  const childCenterYs = children.map(c => c.y + c.height / 2);
  const minY = Math.min(parentCenterY, ...childCenterYs);
  const maxY = Math.max(parentCenterY, ...childCenterYs);

  // Main trunk: horizontal stub + vertical distribution line
  const trunk = [
    `M ${parentLeft} ${parentCenterY}`,
    `L ${distributionX} ${parentCenterY}`,
    `M ${distributionX} ${minY}`,
    `L ${distributionX} ${maxY}`,
  ].join(' ');

  // One branch path per child: horizontal from distribution line to child left
  const branches = children.map(child => {
    const childCenterY = child.y + child.height / 2;
    const childLeft = child.x;
    return `M ${distributionX} ${childCenterY} L ${childLeft} ${childCenterY}`;
  });

  return [trunk, ...branches];
}
