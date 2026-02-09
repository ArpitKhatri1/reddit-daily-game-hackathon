import type { LevelDefinition } from "../types";

/** Built-in levels pool. One is selected per day based on date. */
export const builtInLevels: LevelDefinition[] = [
  {
    id: "builtin-001",
    name: "First Steps",
    description: "Connect the start gear to the door. Simple and direct.",
    createdAt: "2026-01-01",
    fixedGears: [
      {
        id: "start-1",
        role: "start",
        size: "medium",
        position: { x: 150, y: 400 },
        rotationSpeed: 0.8,
      },
      {
        id: "goal-1",
        role: "goal",
        size: "medium",
        position: { x: 430, y: 400 },
        rotationSpeed: 0,
        requiredDirection: "any",
      },
    ],
    inventory: [{ id: "inv-1", size: "medium" }],
  },
  {
    id: "builtin-002",
    name: "Size Matters",
    description: "Use different gear sizes to bridge the gap.",
    createdAt: "2026-01-02",
    fixedGears: [
      {
        id: "start-1",
        role: "start",
        size: "large",
        position: { x: 150, y: 400 },
        rotationSpeed: 0.6,
      },
      {
        id: "goal-1",
        role: "goal",
        size: "small",
        position: { x: 550, y: 400 },
        rotationSpeed: 0,
        requiredDirection: "any",
      },
    ],
    inventory: [
      { id: "inv-1", size: "medium" },
      { id: "inv-2", size: "small" },
    ],
  },
  {
    id: "builtin-003",
    name: "The Right Spin",
    description: "The door gear must spin clockwise. Plan your chain carefully.",
    createdAt: "2026-01-03",
    fixedGears: [
      {
        id: "start-1",
        role: "start",
        size: "medium",
        position: { x: 120, y: 300 },
        rotationSpeed: 0.8,
      },
      {
        id: "goal-1",
        role: "goal",
        size: "medium",
        position: { x: 600, y: 300 },
        rotationSpeed: 0,
        requiredDirection: "cw",
      },
    ],
    inventory: [
      { id: "inv-1", size: "medium" },
      { id: "inv-2", size: "medium" },
      { id: "inv-3", size: "small" },
    ],
  },
  {
    id: "builtin-004",
    name: "Double Doors",
    description: "Two doors to open — both need to spin!",
    createdAt: "2026-01-04",
    fixedGears: [
      {
        id: "start-1",
        role: "start",
        size: "large",
        position: { x: 200, y: 400 },
        rotationSpeed: 0.6,
      },
      {
        id: "goal-1",
        role: "goal",
        size: "small",
        position: { x: 600, y: 250 },
        rotationSpeed: 0,
        requiredDirection: "any",
      },
      {
        id: "goal-2",
        role: "goal",
        size: "small",
        position: { x: 600, y: 550 },
        rotationSpeed: 0,
        requiredDirection: "any",
      },
    ],
    inventory: [
      { id: "inv-1", size: "medium" },
      { id: "inv-2", size: "medium" },
      { id: "inv-3", size: "small" },
      { id: "inv-4", size: "small" },
    ],
  },
  {
    id: "builtin-005",
    name: "The Long Chain",
    description: "Bridge a long distance with what you have.",
    createdAt: "2026-01-05",
    fixedGears: [
      {
        id: "start-1",
        role: "start",
        size: "small",
        position: { x: 100, y: 400 },
        rotationSpeed: 1.0,
      },
      {
        id: "goal-1",
        role: "goal",
        size: "large",
        position: { x: 750, y: 400 },
        rotationSpeed: 0,
        requiredDirection: "ccw",
      },
    ],
    inventory: [
      { id: "inv-1", size: "medium" },
      { id: "inv-2", size: "large" },
      { id: "inv-3", size: "medium" },
      { id: "inv-4", size: "small" },
    ],
  },
  {
    id: "builtin-006",
    name: "Crossroads",
    description: "Two start gears, one goal. Choose your path.",
    createdAt: "2026-01-06",
    fixedGears: [
      {
        id: "start-1",
        role: "start",
        size: "medium",
        position: { x: 120, y: 200 },
        rotationSpeed: 0.8,
      },
      {
        id: "start-2",
        role: "start",
        size: "medium",
        position: { x: 120, y: 600 },
        rotationSpeed: 0.8,
      },
      {
        id: "goal-1",
        role: "goal",
        size: "large",
        position: { x: 650, y: 400 },
        rotationSpeed: 0,
        requiredDirection: "cw",
      },
    ],
    inventory: [
      { id: "inv-1", size: "medium" },
      { id: "inv-2", size: "small" },
      { id: "inv-3", size: "medium" },
    ],
  },
  {
    id: "builtin-007",
    name: "Tight Fit",
    description: "Small spaces, big thinking.",
    createdAt: "2026-01-07",
    fixedGears: [
      {
        id: "start-1",
        role: "start",
        size: "small",
        position: { x: 200, y: 350 },
        rotationSpeed: 1.0,
      },
      {
        id: "goal-1",
        role: "goal",
        size: "small",
        position: { x: 500, y: 350 },
        rotationSpeed: 0,
        requiredDirection: "any",
      },
    ],
    inventory: [
      { id: "inv-1", size: "small" },
      { id: "inv-2", size: "small" },
      { id: "inv-3", size: "small" },
    ],
  },
];

/** Get the daily level based on the current date */
export function getDailyLevel(): LevelDefinition {
  const today = new Date();
  const dayOfYear =
    Math.floor(
      (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) /
        86400000
    );
  const index = dayOfYear % builtInLevels.length;
  return builtInLevels[index];
}

/** Get a level by ID from both built-in and custom sources */
export function getLevelById(
  id: string,
  customLevels: LevelDefinition[]
): LevelDefinition | undefined {
  return (
    builtInLevels.find((l) => l.id === id) ??
    customLevels.find((l) => l.id === id)
  );
}
