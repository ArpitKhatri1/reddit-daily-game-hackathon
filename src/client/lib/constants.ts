import type { GearSize, GearDimension } from "../types";

// ─── Gear dimension lookup ─────────────────────────────────────────────────
// outerRadius = baseRadius + toothDepth
// When two gears mesh, center distance = outerRadius_A + outerRadius_B

export const GEAR_DIMENSIONS: Record<GearSize, GearDimension> = {
  small: {
    outerRadius: 45,
    baseRadius: 35,
    teeth: 8,
    toothDepth: 10,
    toothWidth: 14,
  },
  medium: {
    outerRadius: 70,
    baseRadius: 55,
    teeth: 12,
    toothDepth: 15,
    toothWidth: 16,
  },
  large: {
    outerRadius: 95,
    baseRadius: 75,
    teeth: 16,
    toothDepth: 20,
    toothWidth: 18,
  },
  extraLarge: {
    outerRadius: 125,
    baseRadius: 100,
    teeth: 22,
    toothDepth: 25,
    toothWidth: 20,
  },
};

// ─── Role Colors (steampunk palette) ───────────────────────────────────────

export const ROLE_COLORS = {
  start: {
    body: "#2E7D32",       // deep green
    bodyDark: "#1B5E20",
    teeth: "#388E3C",
    highlight: "#66BB6A",
    hole: "#1a1a1a",
  },
  goal: {
    body: "#C62828",       // deep red
    bodyDark: "#8E0000",
    teeth: "#D32F2F",
    highlight: "#EF5350",
    hole: "#1a1a1a",
  },
  positional: {
    body: "#6D4C41",       // brown
    bodyDark: "#4E342E",
    teeth: "#795548",
    highlight: "#A1887F",
    hole: "#1a1a1a",
  },
} as const;

// ─── Physics ───────────────────────────────────────────────────────────────

/** Base rotation speed in degrees per animation frame for start gears */
export const BASE_ROTATION_SPEED = 0.8;

/** Snap tolerance: how close (in px) a dragged gear must be to a mesh point to snap */
export const SNAP_TOLERANCE = 40;

/** How close gears need to be to their ideal mesh distance to engage */
export const MESH_TOLERANCE = 8;

// ─── Board ─────────────────────────────────────────────────────────────────

export const BOARD_WIDTH = 1200;
export const BOARD_HEIGHT = 800;

// ─── Storage keys ──────────────────────────────────────────────────────────

export const STORAGE_KEYS = {
  CUSTOM_LEVELS: "gearpuzzle_custom_levels",
  GAME_HISTORY: "gearpuzzle_game_history",
  DAILY_SEED: "gearpuzzle_daily_seed",
} as const;
