import express from 'express';
import type {
  InitResponse,
  LeaderboardEntry,
  PostMetadata,
  LevelData,
  PublishLevelResponse,
  PublishDailyResponse,
  SubmitSolveResponse,
  UserLevel,
  UserLevelsResponse,
  SaveDraftResponse,
  DeleteDraftResponse,
  DailyPuzzleHistoryEntry,
  DailyHistoryResponse,
} from '../shared/types/api';
import { DAILY_PUZZLE_ADMINS } from '../shared/types/api';
import { redis, reddit, createServer, context, getServerPort } from '@devvit/web/server';
import { createPost, createUserLevelPost, createDailyPuzzlePost } from './core/post';

const app = express();
app.use(express.json({ limit: '4mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.text());

const router = express.Router();

// ─── Helper: get post metadata from Redis ──────────────────────────────────

async function getPostMeta(postId: string): Promise<PostMetadata | null> {
  const raw = await redis.get(`post:${postId}:meta`);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PostMetadata;
  } catch {
    return null;
  }
}

async function setPostMeta(postId: string, meta: PostMetadata): Promise<void> {
  await redis.set(`post:${postId}:meta`, JSON.stringify(meta));
}

// ─── Helper: leaderboard (sorted set per post) ─────────────────────────────

async function getLeaderboard(postId: string, limit = 10): Promise<LeaderboardEntry[]> {
  try {
    const results = await redis.zRange(`post:${postId}:leaderboard`, 0, limit - 1, { by: 'rank' });
    const entries: LeaderboardEntry[] = [];
    for (const item of results) {
      // member is "username", score is timeMs
      const solvedAtRaw = await redis.hGet(`post:${postId}:solve_times`, item.member);
      entries.push({
        username: item.member,
        timeMs: item.score,
        solvedAt: solvedAtRaw || new Date().toISOString(),
      });
    }
    return entries;
  } catch {
    return [];
  }
}

async function getNextDailyNumber(): Promise<number> {
  const current = await redis.get('daily:counter');
  const next = current ? parseInt(current) + 1 : 1;
  await redis.set('daily:counter', String(next));
  return next;
}

// ─── GET /api/init ──────────────────────────────────────────────────────────

router.get('/api/init', async (_req, res): Promise<void> => {
  const { postId } = context;

  if (!postId) {
    res.status(400).json({ status: 'error', message: 'postId is required' });
    return;
  }

  try {
    const [username, meta] = await Promise.all([reddit.getCurrentUsername(), getPostMeta(postId)]);

    // If no metadata, this is the original install post - return defaults
    if (!meta) {
      const response: InitResponse = {
        type: 'init',
        postId,
        username: username ?? 'anonymous',
        postType: 'daily',
        levelData: null,
        leaderboard: [],
        leaderboardActive: false,
      };
      res.json(response);
      return;
    }

    // Track play count
    meta.playCount = (meta.playCount || 0) + 1;
    await setPostMeta(postId, meta);

    const leaderboard = await getLeaderboard(postId);
    const leaderboardActive = meta.leaderboardExpiresAt
      ? new Date(meta.leaderboardExpiresAt).getTime() > Date.now()
      : false;

    const response: InitResponse = {
      type: 'init',
      postId,
      username: username ?? 'anonymous',
      postType: meta.postType,
      levelData: meta.levelData,
      leaderboard,
      leaderboardActive,
    };
    if (meta.dailyNumber !== undefined) response.dailyNumber = meta.dailyNumber;
    if (meta.creatorUsername) response.creatorUsername = meta.creatorUsername;
    res.json(response);
  } catch (error) {
    console.error(`API Init Error for post ${postId}:`, error);
    res.status(400).json({ status: 'error', message: 'Initialization failed' });
  }
});

// ─── POST /api/solve ────────────────────────────────────────────────────────

router.post('/api/solve', async (req, res): Promise<void> => {
  const { postId } = context;
  if (!postId) {
    res.status(400).json({ status: 'error', message: 'postId is required' });
    return;
  }

  try {
    const { timeMs } = req.body as { timeMs: number };
    const username = await reddit.getCurrentUsername();
    if (!username) {
      res.status(401).json({ status: 'error', message: 'Must be logged in' });
      return;
    }

    const meta = await getPostMeta(postId);
    if (!meta) {
      res.status(404).json({ status: 'error', message: 'Post not found' });
      return;
    }

    // Check if leaderboard still active (within 24h for daily puzzles)
    const leaderboardActive = meta.leaderboardExpiresAt
      ? new Date(meta.leaderboardExpiresAt).getTime() > Date.now()
      : true; // user levels always accept solves

    // Check if already solved
    const existingScore = await redis.zScore(`post:${postId}:leaderboard`, username);
    if (existingScore !== undefined && existingScore !== null) {
      const leaderboard = await getLeaderboard(postId);
      const response: SubmitSolveResponse = {
        status: 'already_solved',
        leaderboard,
        message: 'You already solved this puzzle!',
      };
      res.json(response);
      return;
    }

    // Record solve
    meta.solveCount = (meta.solveCount || 0) + 1;
    await setPostMeta(postId, meta);

    if (leaderboardActive) {
      await redis.zAdd(`post:${postId}:leaderboard`, { member: username, score: timeMs });
      await redis.hSet(`post:${postId}:solve_times`, { [username]: new Date().toISOString() });
    }

    // Update user level stats if it's a user level
    if (meta.postType === 'user') {
      await redis.hIncrBy(
        `user:${meta.creatorUsername}:level:${meta.levelData.id}:stats`,
        'solveCount',
        1
      );
    }

    const leaderboard = await getLeaderboard(postId);
    const rawRank = await redis.zRank(`post:${postId}:leaderboard`, username);

    const response: SubmitSolveResponse = {
      status: 'success',
      leaderboard,
    };
    if (rawRank !== undefined && rawRank !== null) response.rank = rawRank + 1;
    res.json(response);
  } catch (error) {
    console.error('Solve error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to record solve' });
  }
});

// ─── POST /api/publish-level ────────────────────────────────────────────────

router.post('/api/publish-level', async (req, res): Promise<void> => {
  try {
    const { levelData } = req.body as { levelData: LevelData };
    const username = await reddit.getCurrentUsername();
    if (!username) {
      res.status(401).json({ status: 'error', message: 'Must be logged in' });
      return;
    }

    // Create the Reddit post
    const post = await createUserLevelPost(levelData, username);

    // Store post metadata
    const meta: PostMetadata = {
      postId: post.id,
      postType: 'user',
      levelData,
      creatorUsername: username,
      createdAt: new Date().toISOString(),
      playCount: 0,
      solveCount: 0,
    };
    await setPostMeta(post.id, meta);

    // Update user's level list - mark as published
    const userLevelKey = `user:${username}:levels`;
    const existingRaw = await redis.hGet(userLevelKey, levelData.id);
    if (existingRaw) {
      const existing = JSON.parse(existingRaw) as UserLevel;
      existing.published = true;
      existing.postId = post.id;
      existing.postUrl = `https://reddit.com/r/${context.subredditName}/comments/${post.id}`;
      await redis.hSet(userLevelKey, { [levelData.id]: JSON.stringify(existing) });
    } else {
      const userLevel: UserLevel = {
        levelData,
        published: true,
        postId: post.id,
        postUrl: `https://reddit.com/r/${context.subredditName}/comments/${post.id}`,
        solveCount: 0,
        playCount: 0,
        createdAt: new Date().toISOString(),
      };
      await redis.hSet(userLevelKey, { [levelData.id]: JSON.stringify(userLevel) });
    }

    const response: PublishLevelResponse = {
      status: 'success',
      postId: post.id,
      postUrl: `https://reddit.com/r/${context.subredditName}/comments/${post.id}`,
    };
    res.json(response);
  } catch (error) {
    console.error('Publish level error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to publish level' });
  }
});

// ─── POST /api/publish-daily ────────────────────────────────────────────────

router.post('/api/publish-daily', async (req, res): Promise<void> => {
  try {
    const username = await reddit.getCurrentUsername();
    if (!username || !DAILY_PUZZLE_ADMINS.includes(username)) {
      res.status(403).json({ status: 'error', message: 'Not authorized to post daily puzzles' });
      return;
    }

    const { levelData } = req.body as { levelData: LevelData };
    const dailyNumber = await getNextDailyNumber();

    const post = await createDailyPuzzlePost(dailyNumber);

    const meta: PostMetadata = {
      postId: post.id,
      postType: 'daily',
      levelData,
      creatorUsername: username,
      dailyNumber,
      createdAt: new Date().toISOString(),
      leaderboardExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      playCount: 0,
      solveCount: 0,
    };
    await setPostMeta(post.id, meta);

    // Store in daily history list
    const historyEntry: DailyPuzzleHistoryEntry = {
      dailyNumber,
      levelData,
      postId: post.id,
      createdAt: meta.createdAt,
    };
    await redis.hSet('daily:history', { [String(dailyNumber)]: JSON.stringify(historyEntry) });

    // Store current daily post id
    await redis.set('daily:current:postId', post.id);

    const response: PublishDailyResponse = {
      status: 'success',
      postId: post.id,
      postUrl: `https://reddit.com/r/${context.subredditName}/comments/${post.id}`,
      dailyNumber,
    };
    res.json(response);
  } catch (error) {
    console.error('Publish daily error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to publish daily puzzle' });
  }
});

// ─── POST /api/save-draft ───────────────────────────────────────────────────

router.post('/api/save-draft', async (req, res): Promise<void> => {
  try {
    const username = await reddit.getCurrentUsername();
    if (!username) {
      res.status(401).json({ status: 'error', message: 'Must be logged in' });
      return;
    }

    const { levelData } = req.body as { levelData: LevelData };
    const userLevelKey = `user:${username}:levels`;

    const existingRaw = await redis.hGet(userLevelKey, levelData.id);
    if (existingRaw) {
      const existing = JSON.parse(existingRaw) as UserLevel;
      existing.levelData = levelData;
      await redis.hSet(userLevelKey, { [levelData.id]: JSON.stringify(existing) });
    } else {
      const userLevel: UserLevel = {
        levelData,
        published: false,
        solveCount: 0,
        playCount: 0,
        createdAt: new Date().toISOString(),
      };
      await redis.hSet(userLevelKey, { [levelData.id]: JSON.stringify(userLevel) });
    }

    const response: SaveDraftResponse = { status: 'success' };
    res.json(response);
  } catch (error) {
    console.error('Save draft error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to save draft' });
  }
});

// ─── DELETE /api/delete-draft ───────────────────────────────────────────────

router.post('/api/delete-draft', async (req, res): Promise<void> => {
  try {
    const username = await reddit.getCurrentUsername();
    if (!username) {
      res.status(401).json({ status: 'error', message: 'Must be logged in' });
      return;
    }

    const { levelId } = req.body as { levelId: string };
    await redis.hDel(`user:${username}:levels`, [levelId]);

    const response: DeleteDraftResponse = { status: 'success' };
    res.json(response);
  } catch (error) {
    console.error('Delete draft error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to delete draft' });
  }
});

// ─── GET /api/my-levels ─────────────────────────────────────────────────────

router.get('/api/my-levels', async (_req, res): Promise<void> => {
  try {
    const username = await reddit.getCurrentUsername();
    if (!username) {
      res.status(401).json({ status: 'error', message: 'Must be logged in' });
      return;
    }

    const allRaw = await redis.hGetAll(`user:${username}:levels`);
    const levels: UserLevel[] = [];

    if (allRaw) {
      for (const [, value] of Object.entries(allRaw)) {
        try {
          const ul = JSON.parse(value) as UserLevel;
          // Refresh stats if published
          if (ul.published && ul.postId) {
            const meta = await getPostMeta(ul.postId);
            if (meta) {
              ul.solveCount = meta.solveCount;
              ul.playCount = meta.playCount;
            }
          }
          levels.push(ul);
        } catch {
          /* skip malformed */
        }
      }
    }

    // Sort by creation date, newest first
    levels.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const response: UserLevelsResponse = { levels };
    res.json(response);
  } catch (error) {
    console.error('My levels error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to get levels' });
  }
});

// ─── GET /api/daily-history ─────────────────────────────────────────────────

router.get('/api/daily-history', async (_req, res): Promise<void> => {
  try {
    const allRaw = await redis.hGetAll('daily:history');
    const puzzles: DailyPuzzleHistoryEntry[] = [];

    if (allRaw) {
      for (const [, value] of Object.entries(allRaw)) {
        try {
          puzzles.push(JSON.parse(value) as DailyPuzzleHistoryEntry);
        } catch {
          /* skip malformed */
        }
      }
    }

    // Sort by daily number descending
    puzzles.sort((a, b) => b.dailyNumber - a.dailyNumber);

    const response: DailyHistoryResponse = { puzzles };
    res.json(response);
  } catch (error) {
    console.error('Daily history error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to get daily history' });
  }
});

// ─── GET /api/daily-current ─────────────────────────────────────────────────

router.get('/api/daily-current', async (_req, res): Promise<void> => {
  try {
    const postId = await redis.get('daily:current:postId');
    if (!postId) {
      // No admin-posted daily - return null so client uses built-in fallback
      res.json({ levelData: null, postId: null, dailyNumber: null });
      return;
    }

    const meta = await getPostMeta(postId);
    if (!meta) {
      res.json({ levelData: null, postId: null, dailyNumber: null });
      return;
    }

    const leaderboard = await getLeaderboard(postId);
    const leaderboardActive = meta.leaderboardExpiresAt
      ? new Date(meta.leaderboardExpiresAt).getTime() > Date.now()
      : false;

    res.json({
      levelData: meta.levelData,
      postId: meta.postId,
      dailyNumber: meta.dailyNumber,
      leaderboard,
      leaderboardActive,
    });
  } catch (error) {
    console.error('Daily current error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to get daily puzzle' });
  }
});

// ─── GET /api/is-admin ──────────────────────────────────────────────────────

router.get('/api/is-admin', async (_req, res): Promise<void> => {
  try {
    const username = await reddit.getCurrentUsername();
    res.json({ isAdmin: username ? DAILY_PUZZLE_ADMINS.includes(username) : false });
  } catch {
    res.json({ isAdmin: false });
  }
});

// ─── POST /api/leaderboard ──────────────────────────────────────────────────

router.get('/api/leaderboard/:postId', async (req, res): Promise<void> => {
  try {
    const pid = req.params.postId || context.postId;
    if (!pid) {
      res.status(400).json({ status: 'error', message: 'postId required' });
      return;
    }
    const leaderboard = await getLeaderboard(pid);
    res.json({ leaderboard });
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to get leaderboard' });
  }
});

// ─── Internal triggers / menu items ─────────────────────────────────────────

router.post('/internal/on-app-install', async (_req, res): Promise<void> => {
  try {
    const post = await createPost();
    res.json({
      status: 'success',
      message: `Post created in subreddit ${context.subredditName} with id ${post.id}`,
    });
  } catch (error) {
    console.error(`Error creating post: ${error}`);
    res.status(400).json({ status: 'error', message: 'Failed to create post' });
  }
});

router.post('/internal/menu/post-create', async (_req, res): Promise<void> => {
  try {
    const post = await createPost();
    res.json({
      navigateTo: `https://reddit.com/r/${context.subredditName}/comments/${post.id}`,
    });
  } catch (error) {
    console.error(`Error creating post: ${error}`);
    res.status(400).json({ status: 'error', message: 'Failed to create post' });
  }
});

app.use(router);

const port = getServerPort();
const server = createServer(app);
server.on('error', (err) => console.error(`server error; ${err.stack}`));
server.listen(port);
