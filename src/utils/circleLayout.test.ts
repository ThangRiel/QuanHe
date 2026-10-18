import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getDistance,
  findContainingGroup,
  resolveGroupCollisions,
  arrangeNodesInCircle,
  resolveNodeOverlaps,
  getCircleEdgePoint,
  type CircularGroupDef,
  type CircularNodeDef,
} from './circleLayout.ts';

test('getDistance computes accurate Euclidean distance', () => {
  assert.equal(getDistance({ x: 0, y: 0 }, { x: 3, y: 4 }), 5);
  assert.equal(getDistance({ x: 100, y: 200 }, { x: 100, y: 200 }), 0);
  assert.equal(Math.round(getDistance({ x: 10, y: 20 }, { x: 40, y: 60 })), 50);
});

test('findContainingGroup returns matching group ID when inside, null when outside', () => {
  const groups: CircularGroupDef[] = [
    { id: 'g1', name: 'Nhóm 1', color: '#ff0000', center: { x: 200, y: 200 }, radius: 100 },
    { id: 'g2', name: 'Nhóm 2', color: '#00ff00', center: { x: 600, y: 200 }, radius: 150 },
  ];

  // Point right at center of g1
  assert.equal(findContainingGroup({ x: 200, y: 200 }, groups), 'g1');

  // Point inside g1 (distance 60 <= 100)
  assert.equal(findContainingGroup({ x: 260, y: 200 }, groups), 'g1');

  // Point inside g2 (distance 80 <= 150)
  assert.equal(findContainingGroup({ x: 600, y: 280 }, groups), 'g2');

  // Point in empty canvas space between groups
  assert.equal(findContainingGroup({ x: 400, y: 200 }, groups), null);
});

test('resolveGroupCollisions pushes overlapping circular containers apart', () => {
  // Two groups with radius 100 each, separated by only 50px (overlap!)
  const groups: CircularGroupDef[] = [
    { id: 'g1', name: 'Nhóm A', color: '#111', center: { x: 100, y: 100 }, radius: 100 },
    { id: 'g2', name: 'Nhóm B', color: '#222', center: { x: 150, y: 100 }, radius: 100 },
  ];

  const resolved = resolveGroupCollisions(groups, 20);
  const finalDist = getDistance(resolved[0].center, resolved[1].center);
  const minRequiredDist = 100 + 100 + 20; // radius1 + radius2 + minGap = 220

  assert.ok(finalDist >= minRequiredDist - 1, `Expected final distance ${finalDist} >= ${minRequiredDist}`);
});

test('arrangeNodesInCircle expands node spacing when group radius increases', () => {
  const nodes: CircularNodeDef[] = [
    { id: 'n1', name: 'A', position: { x: 0, y: 0 } },
    { id: 'n2', name: 'B', position: { x: 0, y: 0 } },
    { id: 'n3', name: 'C', position: { x: 0, y: 0 } },
  ];

  const center = { x: 500, y: 500 };

  // Arranged in smaller radius container (e.g. 180px)
  const arrangedSmall = arrangeNodesInCircle(nodes, center, 180, 48);
  const distSmall = getDistance(arrangedSmall[0].position, arrangedSmall[1].position);

  // Arranged in wider radius container (e.g. 360px)
  const arrangedLarge = arrangeNodesInCircle(nodes, center, 360, 48);
  const distLarge = getDistance(arrangedLarge[0].position, arrangedLarge[1].position);

  // Requirement: "ô càng rộng thì các thẻ ở bên trong sẽ có khoảng cách rộng hơn"
  assert.ok(
    distLarge > distSmall,
    `Larger container should have larger distance between nodes: ${distLarge} > ${distSmall}`
  );
});

test('resolveNodeOverlaps ensures nodes maintain non-overlapping distance and stay inside boundary', () => {
  const center = { x: 300, y: 300 };
  const groupRadius = 200;
  const nodeRadius = 48;

  // Two nodes placed right on top of each other
  const nodes: CircularNodeDef[] = [
    { id: 'n1', name: 'A', position: { x: 300, y: 300 } },
    { id: 'n2', name: 'B', position: { x: 300, y: 300 } },
  ];

  const relaxed = resolveNodeOverlaps(nodes, center, groupRadius, nodeRadius);
  const dist = getDistance(relaxed[0].position, relaxed[1].position);

  assert.ok(dist >= nodeRadius * 2, `Nodes should not overlap: dist ${dist} >= ${nodeRadius * 2}`);

  // Both nodes should remain inside the group boundary
  assert.ok(getDistance(relaxed[0].position, center) <= groupRadius);
  assert.ok(getDistance(relaxed[1].position, center) <= groupRadius);
});

test('getCircleEdgePoint accurately computes boundary intercept point for arrow lines', () => {
  const center = { x: 100, y: 100 };
  const radius = 50;
  const target = { x: 200, y: 100 }; // 100px to the right

  const edge = getCircleEdgePoint(center, radius, target);
  assert.equal(edge.x, 150);
  assert.equal(edge.y, 100);
});

test('central self node is 3x larger than standard nodes and calculates boundary correctly', () => {
  const standardRadius = 48;
  const selfRadius = standardRadius * 3; // 144px (diameter 288px)
  assert.equal(selfRadius, 144);

  const selfCenter = { x: 680, y: 620 };
  const memberCenter = { x: 230, y: 250 };

  const intercept = getCircleEdgePoint(selfCenter, selfRadius, memberCenter);
  const distFromCenter = getDistance(selfCenter, intercept);
  assert.equal(Math.round(distFromCenter), selfRadius);
});
