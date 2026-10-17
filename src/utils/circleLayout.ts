export interface Point {
  x: number;
  y: number;
}

export interface CircularGroupDef {
  id: string;
  name: string;
  color: string;
  center: Point;
  radius: number;
  description?: string;
}

export interface CircularNodeDef {
  id: string;
  name: string;
  position: Point;
  groupId?: string | null;
  radius?: number;
}

/**
 * Calculates Euclidean distance between two points.
 */
export function getDistance(p1: Point, p2: Point): number {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Finds which group circle contains the given point/node center.
 * Returns the group ID or null if outside all groups.
 */
export function findContainingGroup(
  nodePos: Point,
  groups: CircularGroupDef[],
  nodeRadius: number = 48
): string | null {
  for (const group of groups) {
    const dist = getDistance(nodePos, group.center);
    // Allow snapping if node center or majority of node is inside the group
    if (dist <= group.radius) {
      return group.id;
    }
  }
  return null;
}

/**
 * Resolves overlap between circular group containers so they never overlap.
 * Iteratively pushes overlapping groups apart along their collision normal.
 */
export function resolveGroupCollisions<T extends CircularGroupDef>(
  groups: T[],
  minGap: number = 30,
  iterations: number = 6
): T[] {
  const updated = groups.map((g) => ({
    ...g,
    center: { ...g.center },
  }));

  for (let iter = 0; iter < iterations; iter++) {
    let hadCollision = false;

    for (let i = 0; i < updated.length; i++) {
      for (let j = i + 1; j < updated.length; j++) {
        const g1 = updated[i];
        const g2 = updated[j];

        const dx = g2.center.x - g1.center.x;
        const dy = g2.center.y - g1.center.y;
        let dist = Math.sqrt(dx * dx + dy * dy);

        const targetDist = g1.radius + g2.radius + minGap;

        if (dist < targetDist) {
          hadCollision = true;
          let nx = 0;
          let ny = 0;
          if (dist === 0) {
            const angle = (i + 1) * 1.25;
            nx = Math.cos(angle) * (targetDist / 2);
            ny = Math.sin(angle) * (targetDist / 2);
          } else {
            const overlap = (targetDist - dist) / 2;
            nx = (dx / dist) * overlap;
            ny = (dy / dist) * overlap;
          }

          g1.center.x -= nx;
          g1.center.y -= ny;
          g2.center.x += nx;
          g2.center.y += ny;
        }
      }
    }

    if (!hadCollision) break;
  }

  return updated;
}

/**
 * Distributes nodes inside a circular group so they have generous spacing.
 * The larger the container radius, the wider the spacing between nodes.
 */
export function arrangeNodesInCircle<T extends CircularNodeDef>(
  nodes: T[],
  groupCenter: Point,
  groupRadius: number,
  nodeRadius: number = 48
): T[] {
  if (nodes.length === 0) return [];
  if (nodes.length === 1) {
    return [
      {
        ...nodes[0],
        position: { x: groupCenter.x, y: groupCenter.y },
      },
    ];
  }

  const result = nodes.map((n) => ({ ...n, position: { ...n.position } }));
  const count = nodes.length;

  // The orbit radius scales directly with group radius
  // Wider group = nodes sit further apart on a wider orbit!
  const maxAvailableRadius = Math.max(20, groupRadius - nodeRadius - 30);

  if (count <= 6) {
    // Single orbit ring
    const orbitRadius = Math.min(maxAvailableRadius, Math.max(60, groupRadius * 0.55));
    const angleStep = (Math.PI * 2) / count;

    for (let i = 0; i < count; i++) {
      const angle = i * angleStep - Math.PI / 2;
      result[i].position = {
        x: Math.round(groupCenter.x + Math.cos(angle) * orbitRadius),
        y: Math.round(groupCenter.y + Math.sin(angle) * orbitRadius),
      };
    }
  } else {
    // Multi-ring concentric distribution for many nodes
    const innerCount = Math.floor(count / 3);
    const outerCount = count - innerCount;

    const innerOrbit = Math.max(40, maxAvailableRadius * 0.4);
    const outerOrbit = maxAvailableRadius * 0.85;

    for (let i = 0; i < innerCount; i++) {
      const angle = (i * Math.PI * 2) / innerCount;
      result[i].position = {
        x: Math.round(groupCenter.x + Math.cos(angle) * innerOrbit),
        y: Math.round(groupCenter.y + Math.sin(angle) * innerOrbit),
      };
    }

    for (let i = 0; i < outerCount; i++) {
      const angle = (i * Math.PI * 2) / outerCount + Math.PI / outerCount;
      result[innerCount + i].position = {
        x: Math.round(groupCenter.x + Math.cos(angle) * outerOrbit),
        y: Math.round(groupCenter.y + Math.sin(angle) * outerOrbit),
      };
    }
  }

  // Final relaxation to prevent any overlaps
  return resolveNodeOverlaps(result, groupCenter, groupRadius, nodeRadius);
}

/**
 * Relaxes node positions inside a circle to ensure no two nodes overlap,
 * with spacing proportional to the group radius.
 */
export function resolveNodeOverlaps<T extends CircularNodeDef>(
  nodes: T[],
  groupCenter: Point,
  groupRadius: number,
  nodeRadius: number = 48,
  iterations: number = 8
): T[] {
  const updated = nodes.map((n) => ({
    ...n,
    position: { ...n.position },
  }));

  // Dynamic spacing gap increases as groupRadius increases
  const dynamicGap = Math.max(12, Math.min(60, (groupRadius - 160) * 0.15));
  const minDistance = nodeRadius * 2 + dynamicGap;
  const maxDistanceFromCenter = Math.max(10, groupRadius - nodeRadius - 15);

  for (let iter = 0; iter < iterations; iter++) {
    // 1. Separate nodes from each other
    for (let i = 0; i < updated.length; i++) {
      for (let j = i + 1; j < updated.length; j++) {
        const n1 = updated[i];
        const n2 = updated[j];

        const dx = n2.position.x - n1.position.x;
        const dy = n2.position.y - n1.position.y;
        let dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < minDistance) {
          let nx = 0;
          let ny = 0;
          if (dist === 0) {
            const angle = ((i + j + 1) * Math.PI) / 3;
            nx = Math.cos(angle) * (minDistance / 2);
            ny = Math.sin(angle) * (minDistance / 2);
          } else {
            const overlap = (minDistance - dist) / 2;
            nx = (dx / dist) * overlap;
            ny = (dy / dist) * overlap;
          }

          n1.position.x -= nx;
          n1.position.y -= ny;
          n2.position.x += nx;
          n2.position.y += ny;
        }
      }
    }

    // 2. Clamp nodes inside group boundary
    for (const node of updated) {
      const dx = node.position.x - groupCenter.x;
      const dy = node.position.y - groupCenter.y;
      const distFromCenter = Math.sqrt(dx * dx + dy * dy);

      if (distFromCenter > maxDistanceFromCenter) {
        const factor = maxDistanceFromCenter / (distFromCenter || 1);
        node.position.x = groupCenter.x + dx * factor;
        node.position.y = groupCenter.y + dy * factor;
      }
    }
  }

  // Round coordinates
  for (const node of updated) {
    node.position.x = Math.round(node.position.x);
    node.position.y = Math.round(node.position.y);
  }

  return updated;
}

/**
 * Calculates point on edge of a circle towards another point (for arrows).
 */
export function getCircleEdgePoint(
  center: Point,
  radius: number,
  target: Point
): Point {
  const dx = target.x - center.x;
  const dy = target.y - center.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist === 0) return { ...center };

  return {
    x: center.x + (dx / dist) * radius,
    y: center.y + (dy / dist) * radius,
  };
}
