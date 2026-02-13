import { reddit, context } from '@devvit/web/server';
import type { LevelData } from '../../shared/types/api';

export const createPost = async () => {
  return await reddit.submitCustomPost({
    title: 'Welcome to Gear It Up',
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

  // Format current date as "12 February 2026"
  const now = new Date();
  const day = now.getDate();
  const month = now.toLocaleString('en-US', { month: 'long' });
  const year = now.getFullYear();
  const formattedDate = `${day} ${month} ${year}`;

  return await reddit.submitCustomPost({
    title: `Daily Puzzle #${dailyNumber} - ${formattedDate}`,
    subredditName,
  });
};
