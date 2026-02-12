import { reddit, context } from '@devvit/web/server';
import type { LevelData } from '../../shared/types/api';

export const createPost = async () => {
  return await reddit.submitCustomPost({
    title: 'Gear Puzzle',
  });
};

export const createUserLevelPost = async (_levelData: LevelData, username: string) => {
  const { subredditName } = context;
  if (!subredditName) throw new Error('subredditName is required');

  return await reddit.submitCustomPost({
    title: `Can you solve this puzzle from ${username}?`,
    subredditName,
  });
};

export const createDailyPuzzlePost = async (dailyNumber: number) => {
  const { subredditName } = context;
  if (!subredditName) throw new Error('subredditName is required');

  return await reddit.submitCustomPost({
    title: `Daily Puzzle #${dailyNumber}`,
    subredditName,
  });
};
