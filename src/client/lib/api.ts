// ─── Client API layer: talks to the server endpoints ───────────────────────

import type {
  InitResponse,
  LeaderboardEntry,
  PublishLevelResponse,
  PublishDailyResponse,
  SubmitSolveResponse,
  UserLevelsResponse,
  SaveDraftResponse,
  DeleteDraftResponse,
  DailyHistoryResponse,
  LevelData,
} from '../../shared/types/api';

async function apiFetch<T>(url: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(body.message ?? `API Error ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ─── Init (called when post opens) ─────────────────────────────────────────

export function fetchInit(): Promise<InitResponse> {
  return apiFetch<InitResponse>('/api/init');
}

// ─── Solve ──────────────────────────────────────────────────────────────────

export function submitSolve(timeMs: number): Promise<SubmitSolveResponse> {
  return apiFetch<SubmitSolveResponse>('/api/solve', {
    method: 'POST',
    body: JSON.stringify({ timeMs }),
  });
}

// ─── Publish user level ─────────────────────────────────────────────────────

export function publishLevel(levelData: LevelData): Promise<PublishLevelResponse> {
  return apiFetch<PublishLevelResponse>('/api/publish-level', {
    method: 'POST',
    body: JSON.stringify({ levelData }),
  });
}

// ─── Publish daily puzzle (admin only) ──────────────────────────────────────

export function publishDaily(levelData: LevelData): Promise<PublishDailyResponse> {
  return apiFetch<PublishDailyResponse>('/api/publish-daily', {
    method: 'POST',
    body: JSON.stringify({ levelData }),
  });
}

// ─── Save / delete draft ────────────────────────────────────────────────────

export function saveDraft(levelData: LevelData): Promise<SaveDraftResponse> {
  return apiFetch<SaveDraftResponse>('/api/save-draft', {
    method: 'POST',
    body: JSON.stringify({ levelData }),
  });
}

export function deleteDraft(levelId: string): Promise<DeleteDraftResponse> {
  return apiFetch<DeleteDraftResponse>('/api/delete-draft', {
    method: 'POST',
    body: JSON.stringify({ levelId }),
  });
}

// ─── My levels ──────────────────────────────────────────────────────────────

export function fetchMyLevels(): Promise<UserLevelsResponse> {
  return apiFetch<UserLevelsResponse>('/api/my-levels');
}

// ─── Daily history ──────────────────────────────────────────────────────────

export function fetchDailyHistory(): Promise<DailyHistoryResponse> {
  return apiFetch<DailyHistoryResponse>('/api/daily-history');
}

// ─── Current daily puzzle ───────────────────────────────────────────────────

export type DailyCurrentResponse = {
  levelData: LevelData | null;
  postId: string | null;
  dailyNumber: number | null;
  leaderboard?: LeaderboardEntry[];
  leaderboardActive?: boolean;
};

export function fetchDailyCurrent(): Promise<DailyCurrentResponse> {
  return apiFetch<DailyCurrentResponse>('/api/daily-current');
}

// ─── Is admin ───────────────────────────────────────────────────────────────

export function fetchIsAdmin(): Promise<{ isAdmin: boolean }> {
  return apiFetch<{ isAdmin: boolean }>('/api/is-admin');
}

// ─── Leaderboard for a specific post ────────────────────────────────────────

export function fetchLeaderboard(postId: string): Promise<{ leaderboard: LeaderboardEntry[] }> {
  return apiFetch<{ leaderboard: LeaderboardEntry[] }>(`/api/leaderboard/${postId}`);
}

// ─── Converters: LevelDefinition <-> LevelData ─────────────────────────────

import type { LevelDefinition } from '../types';

/** Convert client LevelDefinition → shared LevelData (for API calls) */
export function toLevelData(def: LevelDefinition): LevelData {
  const result: LevelData = {
    id: def.id,
    name: def.name,
    createdAt: def.createdAt,
    fixedGears: def.fixedGears.map((fg) => {
      const gear: LevelData['fixedGears'][number] = {
        id: fg.id,
        role: fg.role,
        size: fg.size,
        position: { x: fg.position.x, y: fg.position.y },
        rotationSpeed: fg.rotationSpeed,
      };
      if (fg.requiredDirection) gear.requiredDirection = fg.requiredDirection;
      return gear;
    }),
    inventory: def.inventory.map((item) => ({
      id: item.id,
      size: item.size,
    })),
  };
  if (def.description) result.description = def.description;
  return result;
}

/** Convert shared LevelData → client LevelDefinition (to play) */
export function toLevelDefinition(data: LevelData): LevelDefinition {
  const result: LevelDefinition = {
    id: data.id,
    name: data.name,
    createdAt: data.createdAt,
    fixedGears: data.fixedGears.map((fg) => {
      const gear: LevelDefinition['fixedGears'][number] = {
        id: fg.id,
        role: fg.role,
        size: fg.size,
        position: { x: fg.position.x, y: fg.position.y },
        rotationSpeed: fg.rotationSpeed,
      };
      if (fg.requiredDirection) gear.requiredDirection = fg.requiredDirection;
      return gear;
    }),
    inventory: data.inventory.map((item) => ({
      id: item.id,
      size: item.size,
    })),
  };
  if (data.description) result.description = data.description;
  return result;
}
