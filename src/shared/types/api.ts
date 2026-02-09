// ─── Shared Types between Client and Server ────────────────────────────────

// Gear types replicated for server-side (no DOM dependency)
export type GearRole = 'start' | 'positional' | 'goal';
export type GearSize = 'small' | 'medium' | 'large' | 'extraLarge';
export type RotationDirection = 'cw' | 'ccw' | 'any';

export type FixedGearDef = {
  id: string;
  role: GearRole;
  size: GearSize;
  position: { x: number; y: number };
  rotationSpeed: number;
  requiredDirection?: RotationDirection;
};

export type InventoryItemDef = {
  id: string;
  size: GearSize;
};

export type LevelData = {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  fixedGears: FixedGearDef[];
  inventory: InventoryItemDef[];
};

// ─── API Response Types ─────────────────────────────────────────────────────

export type InitResponse = {
  type: 'init';
  postId: string;
  username: string;
  postType: 'daily' | 'user';
  levelData: LevelData | null;
  leaderboard: LeaderboardEntry[];
  dailyNumber?: number;
  creatorUsername?: string;
  leaderboardActive: boolean;
};

export type LeaderboardEntry = {
  username: string;
  timeMs: number;
  solvedAt: string;
};

// ─── Level Publishing ───────────────────────────────────────────────────────

export type PublishLevelRequest = {
  levelData: LevelData;
};

export type PublishLevelResponse = {
  status: 'success' | 'error';
  postId?: string;
  postUrl?: string;
  message?: string;
};

// ─── Daily Puzzle (admin only) ──────────────────────────────────────────────

export type PublishDailyRequest = {
  levelData: LevelData;
};

export type PublishDailyResponse = {
  status: 'success' | 'error';
  postId?: string;
  postUrl?: string;
  dailyNumber?: number;
  message?: string;
};

// ─── Solve submission ───────────────────────────────────────────────────────

export type SubmitSolveRequest = {
  timeMs: number;
};

export type SubmitSolveResponse = {
  status: 'success' | 'already_solved' | 'expired' | 'error';
  leaderboard: LeaderboardEntry[];
  rank?: number;
  message?: string;
};

// ─── User's levels (drafts + published) ─────────────────────────────────────

export type UserLevel = {
  levelData: LevelData;
  published: boolean;
  postId?: string;
  postUrl?: string;
  solveCount: number;
  playCount: number;
  createdAt: string;
};

export type UserLevelsResponse = {
  levels: UserLevel[];
};

export type SaveDraftRequest = {
  levelData: LevelData;
};

export type SaveDraftResponse = {
  status: 'success' | 'error';
  message?: string;
};

export type DeleteDraftRequest = {
  levelId: string;
};

export type DeleteDraftResponse = {
  status: 'success' | 'error';
  message?: string;
};

// ─── History: past daily puzzles ────────────────────────────────────────────

export type DailyPuzzleHistoryEntry = {
  dailyNumber: number;
  levelData: LevelData;
  postId: string;
  createdAt: string;
};

export type DailyHistoryResponse = {
  puzzles: DailyPuzzleHistoryEntry[];
};

// ─── Post metadata (stored per post in Redis) ──────────────────────────────

export type PostMetadata = {
  postId: string;
  postType: 'daily' | 'user';
  levelData: LevelData;
  creatorUsername: string;
  dailyNumber?: number;
  createdAt: string;
  leaderboardExpiresAt?: string;
  playCount: number;
  solveCount: number;
};

// ─── Admin config ───────────────────────────────────────────────────────────

export const DAILY_PUZZLE_ADMINS: string[] = ['Creative-Election213'];
