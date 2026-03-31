import { describe, it, expect } from 'vitest';
import { generateConnectorPath, generateGroupedConnectorPaths } from './connectorUtils';
import { CONNECTOR_VERTICAL_GAP } from './canvasUtils';

describe('generateConnectorPath', () => {
  it('generates correct path from parent LEFT side to child LEFT side', () => {
    const parent = { x: 200, y: 100, width: 320, height: 45 };
    const child = { x: 200, y: 300, width: 320, height: 45 };

    const path = generateConnectorPath(parent, child);

    const parentLeft = 200;
    const parentCenterY = 100 + 45 / 2; // 122.5
    const distX = parentLeft - CONNECTOR_VERTICAL_GAP; // 180
    const childCenterY = 300 + 45 / 2; // 322.5
    const childLeft = 200;

    expect(path).toBe(
      `M ${parentLeft} ${parentCenterY} L ${distX} ${parentCenterY} L ${distX} ${childCenterY} L ${childLeft} ${childCenterY}`
    );
  });

  it('handles child positioned to the right of parent', () => {
    const parent = { x: 100, y: 50, width: 200, height: 40 };
    const child = { x: 400, y: 200, width: 150, height: 40 };

    const path = generateConnectorPath(parent, child);

    expect(path).toContain(`M 100 70`); // parent left, parent center Y
    expect(path).toContain(`L 80 70`);  // distribution X, parent center Y
    expect(path).toContain(`L 80 220`); // distribution X, child center Y
    expect(path).toContain(`L 400 220`); // child left, child center Y
  });

  it('produces only horizontal and vertical segments (orthogonal)', () => {
    const parent = { x: 150, y: 80, width: 300, height: 50 };
    const child = { x: 250, y: 250, width: 200, height: 60 };

    const path = generateConnectorPath(parent, child);
    const commands = path.split(/\s*[ML]\s*/).filter(Boolean);

    // Parse coordinates from path
    const points = commands.map(cmd => {
      const [x, y] = cmd.trim().split(' ').map(Number);
      return { x, y };
    });

    // Each consecutive pair should share either X or Y (orthogonal)
    for (let i = 1; i < points.length; i++) {
      const sameX = points[i].x === points[i - 1].x;
      const sameY = points[i].y === points[i - 1].y;
      expect(sameX || sameY).toBe(true);
    }
  });
});

describe('generateGroupedConnectorPaths', () => {
  it('returns empty array for no children', () => {
    const parent = { x: 100, y: 50, width: 200, height: 40 };
    expect(generateGroupedConnectorPaths(parent, [])).toEqual([]);
    expect(generateGroupedConnectorPaths(parent, null)).toEqual([]);
  });

  it('returns single path for one child (delegates to generateConnectorPath)', () => {
    const parent = { x: 200, y: 100, width: 320, height: 45 };
    const child = { x: 200, y: 300, width: 320, height: 45 };

    const paths = generateGroupedConnectorPaths(parent, [child]);
    expect(paths).toHaveLength(1);
    expect(paths[0]).toBe(generateConnectorPath(parent, child));
  });

  it('returns trunk + branch paths for multiple children', () => {
    const parent = { x: 300, y: 100, width: 320, height: 40 };
    const children = [
      { x: 200, y: 250, width: 200, height: 40 },
      { x: 500, y: 350, width: 200, height: 40 },
    ];

    const paths = generateGroupedConnectorPaths(parent, children);

    // 1 trunk + 2 branches
    expect(paths).toHaveLength(3);

    const distX = parent.x - CONNECTOR_VERTICAL_GAP; // 280
    const parentCenterY = parent.y + parent.height / 2; // 120

    // Trunk should contain horizontal stub and vertical distribution line
    expect(paths[0]).toContain(`M ${parent.x} ${parentCenterY}`);
    expect(paths[0]).toContain(`L ${distX} ${parentCenterY}`);

    // Branches should go from distribution line to each child's left side
    const child1CenterY = children[0].y + children[0].height / 2; // 270
    const child2CenterY = children[1].y + children[1].height / 2; // 370

    expect(paths[1]).toContain(`M ${distX} ${child1CenterY}`);
    expect(paths[1]).toContain(`L ${children[0].x} ${child1CenterY}`);

    expect(paths[2]).toContain(`M ${distX} ${child2CenterY}`);
    expect(paths[2]).toContain(`L ${children[1].x} ${child2CenterY}`);
  });

  it('vertical distribution line spans from min to max Y including parent', () => {
    const parent = { x: 300, y: 200, width: 320, height: 40 };
    const children = [
      { x: 200, y: 50, width: 200, height: 40 },   // above parent
      { x: 200, y: 400, width: 200, height: 40 },   // below parent
    ];

    const paths = generateGroupedConnectorPaths(parent, children);
    const trunk = paths[0];

    const distX = parent.x - CONNECTOR_VERTICAL_GAP;
    const child1CenterY = 50 + 20;  // 70
    const child2CenterY = 400 + 20; // 420
    const parentCenterY = 200 + 20; // 220

    const minY = Math.min(parentCenterY, child1CenterY, child2CenterY); // 70
    const maxY = Math.max(parentCenterY, child1CenterY, child2CenterY); // 420

    expect(trunk).toContain(`M ${distX} ${minY}`);
    expect(trunk).toContain(`L ${distX} ${maxY}`);
  });
});
