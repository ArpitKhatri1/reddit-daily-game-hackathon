import type { LevelDefinition, GameRecord } from "../types";
import { STORAGE_KEYS } from "./constants";

// ─── Custom Levels ─────────────────────────────────────────────────────────

export function getCustomLevels(): LevelDefinition[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CUSTOM_LEVELS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveCustomLevel(level: LevelDefinition): void {
  const levels = getCustomLevels();
  const idx = levels.findIndex((l) => l.id === level.id);
  if (idx >= 0) {
    levels[idx] = level;
  } else {
    levels.push(level);
  }
  localStorage.setItem(STORAGE_KEYS.CUSTOM_LEVELS, JSON.stringify(levels));
}

export function deleteCustomLevel(id: string): void {
  const levels = getCustomLevels().filter((l) => l.id !== id);
  localStorage.setItem(STORAGE_KEYS.CUSTOM_LEVELS, JSON.stringify(levels));
}

// ─── Game History ──────────────────────────────────────────────────────────

export function getGameHistory(): GameRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.GAME_HISTORY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveGameRecord(record: GameRecord): void {
  const history = getGameHistory();
  history.unshift(record); // newest first
  // Keep last 100 records
  if (history.length > 100) history.length = 100;
  localStorage.setItem(STORAGE_KEYS.GAME_HISTORY, JSON.stringify(history));
}
