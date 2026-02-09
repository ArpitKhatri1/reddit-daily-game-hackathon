import type { GearInstance, GearSize, Position } from "../types";
import { GEAR_DIMENSIONS, MESH_TOLERANCE, BASE_ROTATION_SPEED } from "./constants";

// ─── Geometry helpers ──────────────────────────────────────────────────────

export function distance(a: Position, b: Position): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

export function angleBetween(from: Position, to: Position): number {
  return Math.atan2(to.y - from.y, to.x - from.x);
}

/**
 * Gear positions are stored as top-left CSS coordinates.
 * This helper returns the center position for geometry calculations.
 */
export function getGearCenter(gear: GearInstance): Position {
  const dim = GEAR_DIMENSIONS[gear.size];
  return { x: gear.position.x + dim.outerRadius, y: gear.position.y + dim.outerRadius };
}

/** Shorthand: center from a raw position + size */
export function getCenterFromTopLeft(pos: Position, size: GearSize): Position {
  const dim = GEAR_DIMENSIONS[size];
  return { x: pos.x + dim.outerRadius, y: pos.y + dim.outerRadius };
}

/** Ideal center-to-center distance for two meshed gears */
export function meshDistance(sizeA: GearSize, sizeB: GearSize): number {
  const a = GEAR_DIMENSIONS[sizeA];
  const b = GEAR_DIMENSIONS[sizeB];
  // Gears mesh when tooth tips touch: outer radius of each
  return a.outerRadius + b.outerRadius;
}

/** Check whether two gears are close enough to mesh */
export function canMesh(gearA: GearInstance, gearB: GearInstance): boolean {
  const centerA = getGearCenter(gearA);
  const centerB = getGearCenter(gearB);
  const dist = distance(centerA, centerB);
  const ideal = meshDistance(gearA.size, gearB.size);
  return Math.abs(dist - ideal) <= MESH_TOLERANCE;
}

// ─── Snap position calculation ─────────────────────────────────────────────

/**
 * Given an anchor gear and a candidate center position, compute the snap center
 * where the candidate gear would perfectly mesh with the anchor.
 */
export function getSnapPosition(
  anchor: GearInstance,
  candidateCenter: Position,
  candidateSize: GearSize
): Position {
  const anchorCenter = getGearCenter(anchor);
  const angle = angleBetween(anchorCenter, candidateCenter);
  const dist = meshDistance(anchor.size, candidateSize);
  return {
    x: anchorCenter.x + Math.cos(angle) * dist,
    y: anchorCenter.y + Math.sin(angle) * dist,
  };
}

/**
 * Find the best snap target for a gear being dragged.
 * candidateCenter is the CENTER position of the dragged gear.
 * Returns the snap CENTER position and the anchor gear ID, or null if nothing close enough.
 */
export function findSnapTarget(
  candidateCenter: Position,
  candidateSize: GearSize,
  candidateId: string,
  boardGears: GearInstance[],
  snapTolerance: number
): { position: Position; anchorId: string } | null {
  let bestDist = Infinity;
  let bestResult: { position: Position; anchorId: string } | null = null;

  for (const gear of boardGears) {
    if (gear.id === candidateId) continue;

    const gearCenter = getGearCenter(gear);
    const ideal = meshDistance(gear.size, candidateSize);
    const dist = distance(gearCenter, candidateCenter);
    const diff = Math.abs(dist - ideal);

    if (diff < snapTolerance && diff < bestDist) {
      bestDist = diff;
      const snapCenter = getSnapPosition(gear, candidateCenter, candidateSize);

      // Make sure snap position doesn't overlap with any other gear
      const overlaps = boardGears.some((other) => {
        if (other.id === gear.id || other.id === candidateId) return false;
        const otherCenter = getGearCenter(other);
        const otherDist = distance(snapCenter, otherCenter);
        const minDist =
          GEAR_DIMENSIONS[candidateSize].outerRadius +
          GEAR_DIMENSIONS[other.size].outerRadius -
          MESH_TOLERANCE;
        return otherDist < minDist;
      });

      if (!overlaps) {
        bestResult = { position: snapCenter, anchorId: gear.id };
      }
    }
  }

  return bestResult;
}

// ─── Rotation propagation (BFS) ───────────────────────────────────────────

/**
 * Given the current board state, recompute all mesh connections and rotation speeds.
 * Start gears are the source of rotation. Propagates via BFS.
 * Adjacent meshed gears rotate in opposite directions.
 * Speed scales inversely with tooth count ratio (gear ratio).
 */
export function propagateRotation(gears: GearInstance[]): GearInstance[] {
  // Reset all mesh connections, speeds, and lock state
  const updated = gears.map((g) => ({
    ...g,
    meshedWith: [] as string[],
    rotationSpeed: g.role === "start" ? g.rotationSpeed : 0,
    locked: false,
  }));

  // Build adjacency: check every pair
  for (let i = 0; i < updated.length; i++) {
    for (let j = i + 1; j < updated.length; j++) {
      if (canMesh(updated[i], updated[j])) {
        updated[i].meshedWith.push(updated[j].id);
        updated[j].meshedWith.push(updated[i].id);
      }
    }
  }

  // BFS from all start gears
  const visited = new Set<string>();
  const queue: string[] = [];
  const assignedSpeed = new Map<string, number>();

  for (const gear of updated) {
    if (gear.role === "start" && gear.rotationSpeed !== 0) {
      visited.add(gear.id);
      queue.push(gear.id);
      assignedSpeed.set(gear.id, gear.rotationSpeed);
    }
  }

  const gearMap = new Map(updated.map((g) => [g.id, g]));
  const lockedIds = new Set<string>();

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    const current = gearMap.get(currentId)!;

    // Skip propagating from locked gears
    if (current.locked) continue;

    for (const neighborId of current.meshedWith) {
      const neighbor = gearMap.get(neighborId)!;
      const currentTeeth = GEAR_DIMENSIONS[current.size].teeth;
      const neighborTeeth = GEAR_DIMENSIONS[neighbor.size].teeth;
      const ratio = currentTeeth / neighborTeeth;
      const expectedSpeed = -current.rotationSpeed * ratio;

      if (visited.has(neighborId)) {
        // Already visited — check for conflict
        const existing = assignedSpeed.get(neighborId) ?? 0;
        // Conflict: two neighbors want different directions/speeds
        if (existing !== 0 && Math.sign(existing) !== Math.sign(expectedSpeed)) {
          // Lock the neighbor and all gears connected to the conflict chain
          lockedIds.add(neighborId);
          neighbor.locked = true;
          neighbor.rotationSpeed = 0;
        }
        continue;
      }

      visited.add(neighborId);
      neighbor.rotationSpeed = expectedSpeed;
      assignedSpeed.set(neighborId, expectedSpeed);
      queue.push(neighborId);
    }
  }

  // Mark all gears that are meshed with a locked gear and have conflicting constraints
  // Also propagate lock: if a gear is locked, stop its downstream propagation
  if (lockedIds.size > 0) {
    for (const lockedId of lockedIds) {
      const lockedGear = gearMap.get(lockedId)!;
      lockedGear.rotationSpeed = 0;
      lockedGear.locked = true;
      // Also lock the neighbors that caused the conflict
      for (const nId of lockedGear.meshedWith) {
        const n = gearMap.get(nId)!;
        if (n.role !== "start" && assignedSpeed.has(nId)) {
          // Check if this neighbor has another meshed neighbor that's also spinning
          // Only lock if this gear is part of the conflict (it's the bridge gear)
        }
      }
    }
  }

  return updated;
}

// ─── Win condition check ───────────────────────────────────────────────────

export function checkWinCondition(gears: GearInstance[]): boolean {
  const goalGears = gears.filter((g) => g.role === "goal");
  if (goalGears.length === 0) return false;

  return goalGears.every((goal) => {
    if (goal.rotationSpeed === 0) return false;

    if (!goal.requiredDirection || goal.requiredDirection === "any") {
      return true; // Just needs to be spinning
    }

    if (goal.requiredDirection === "cw") {
      return goal.rotationSpeed > 0;
    }

    if (goal.requiredDirection === "ccw") {
      return goal.rotationSpeed < 0;
    }

    return false;
  });
}

// ─── Ensure start gears have a default speed ──────────────────────────────

export function initializeStartGears(gears: GearInstance[]): GearInstance[] {
  return gears.map((g) => {
    if (g.role === "start" && g.rotationSpeed === 0) {
      return { ...g, rotationSpeed: BASE_ROTATION_SPEED };
    }
    return g;
  });
}
