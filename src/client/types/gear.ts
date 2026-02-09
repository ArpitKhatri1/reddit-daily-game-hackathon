// ─── Gear Types & Interfaces ───────────────────────────────────────────────

export type GearRole = "start" | "positional" | "goal";

export type GearSize = "small" | "medium" | "large" | "extraLarge";

export type RotationDirection = "cw" | "ccw" | "any";

export interface GearDimension {
  /** Outer radius including teeth (px) */
  outerRadius: number;
  /** Base circle radius (px) */
  baseRadius: number;
  /** Number of teeth */
  teeth: number;
  /** Depth of each tooth (px) */
  toothDepth: number;
  /** Width of each tooth at the tip (px) */
  toothWidth: number;
}

export interface Position {
  x: number;
  y: number;
}

/** A gear instance placed on the board */
export interface GearInstance {
  id: string;
  role: GearRole;
  size: GearSize;
  position: Position;
  /** Current rotation angle in degrees */
  angle: number;
  /** Rotation speed (deg/frame). Positive = CW, Negative = CCW, 0 = stationary */
  rotationSpeed: number;
  /** IDs of gears this gear is meshed with */
  meshedWith: string[];
  /** For goal gears: required direction to win. "any" = just needs to spin */
  requiredDirection?: RotationDirection;
  /** Whether this gear is locked (conflicting rotation from two meshed neighbors) */
  locked?: boolean;
}

/** Inventory item: a gear the player hasn't placed yet */
export interface GearInventoryItem {
  id: string;
  size: GearSize;
}

// ─── Level Definition ──────────────────────────────────────────────────────

export interface LevelDefinition {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  /** Gears that are fixed on the board (start + goal) */
  fixedGears: Omit<GearInstance, "angle" | "meshedWith">[];
  /** Gears given to the player to place */
  inventory: GearInventoryItem[];
}

/** Stored record of a played game */
export interface GameRecord {
  levelId: string;
  levelName: string;
  playedAt: string;
  solved: boolean;
  timeTakenMs: number;
}
