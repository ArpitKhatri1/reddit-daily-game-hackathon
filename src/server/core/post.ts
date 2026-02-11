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

  // Create the post
  const post = await reddit.submitCustomPost({
    title: `Daily Puzzle #${dailyNumber}`,
    subredditName,
  });

  // Attempt to pin (make sticky) the newly created daily post. We only do this for
  // daily posts (not user-submitted posts). Use a defensive approach: try a few
  // common method names and fall back to a raw API call if available. Failures
  // should not block post-creation, so swallow errors and log.
  try {
    const r = reddit as unknown as Record<string, unknown>;

    if (typeof r['setSticky'] === 'function') {
      (r['setSticky'] as (id: string, flag?: unknown) => unknown)(post.id, true);
    } else if (typeof r['setPostSticky'] === 'function') {
      (r['setPostSticky'] as (id: string, flag?: unknown) => unknown)(post.id, true);
    } else if (typeof r['sticky'] === 'function') {
      (r['sticky'] as (id: string) => unknown)(post.id);
    } else if (typeof r['pin'] === 'function') {
      (r['pin'] as (id: string) => unknown)(post.id);
    } else if (typeof r['request'] === 'function') {
      // Raw request helper — call Reddit's API endpoint for setting sticky
      // POST /api/set_subreddit_sticky with form body: id=t3_<postId>&num=1
      try {
        (r['request'] as (method: string, path: string, opts?: unknown) => unknown)(
          'POST',
          '/api/set_subreddit_sticky',
          {
            body: { id: `t3_${post.id}`, num: 1 },
          }
        );
      } catch (err) {
        // ignore failures from raw call
        console.warn('Raw sticky API call failed', err);
      }
    } else {
      // No suitable method exposed; log and continue
      console.warn('No sticky API available on reddit object; skipping pin.');
    }
  } catch (err) {
    console.error('Failed to pin daily puzzle post:', err);
  }

  return post;
};
