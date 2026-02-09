import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import type { LevelDefinition } from '../../types';
import type { LeaderboardEntry } from '../../../shared/types/api';
import { getDailyLevel, getLevelById } from '../../levels/builtInLevels';
import { getCustomLevels, saveGameRecord } from '../../lib/storage';
import { fetchInit, fetchDailyCurrent, submitSolve, toLevelDefinition } from '../../lib/api';
import GameBoard from '../GameBoard/GameBoard';

export default function PlayPage() {
  const navigate = useNavigate();
  const { levelId } = useParams<{ levelId?: string }>();
  const [searchParams] = useSearchParams();
  const [level, setLevel] = useState<LevelDefinition | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [leaderboardActive, setLeaderboardActive] = useState(false);
  const [postId, setPostId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<string>('');
  const [solveResult, setSolveResult] = useState<
    | {
        leaderboard: LeaderboardEntry[];
        rank?: number;
        message?: string;
      }
    | undefined
  >(undefined);

  const source = searchParams.get('source'); // 'server' | 'local' | null

  useEffect(() => {
    async function load() {
      // If called from a Devvit post (has server context), try server first
      if (source === 'server' || (!levelId && !source)) {
        try {
          // Inside a post: use /api/init
          const init = await fetchInit();
          setCurrentUser(init.username);

          if (init.levelData) {
            setLevel(toLevelDefinition(init.levelData));
            setLeaderboard(init.leaderboard);
            setLeaderboardActive(init.leaderboardActive);
            setPostId(init.postId);
            return;
          }

          // No level data on this post — try fetching current daily
          const daily = await fetchDailyCurrent();
          if (daily.levelData) {
            setLevel(toLevelDefinition(daily.levelData));
            if (daily.leaderboard) setLeaderboard(daily.leaderboard);
            setLeaderboardActive(daily.leaderboardActive ?? false);
            if (daily.postId) setPostId(daily.postId);
            return;
          }
        } catch {
          // Server unavailable, fall through to local
        }
      }

      // Local fallback
      if (levelId) {
        const customLevels = getCustomLevels();
        const found = getLevelById(levelId, customLevels);
        if (found) {
          setLevel(found);
          return;
        }
      }

      // Default to built-in daily level
      setLevel(getDailyLevel());
    }

    void load();
  }, [levelId, source]);

  const handleWin = useCallback(
    async (timeTakenMs: number) => {
      if (!level) return;
      // Save locally
      saveGameRecord({
        levelId: level.id,
        levelName: level.name,
        playedAt: new Date().toISOString(),
        solved: true,
        timeTakenMs,
      });

      // Submit to server if we have a postId
      if (postId) {
        try {
          const result = await submitSolve(timeTakenMs);
          const solveData: { leaderboard: LeaderboardEntry[]; rank?: number; message?: string } = {
            leaderboard: result.leaderboard,
          };
          if (result.rank !== undefined) solveData.rank = result.rank;
          if (result.message) solveData.message = result.message;
          setSolveResult(solveData);
        } catch {
          // Solve submission failed, not critical
        }
      }
    },
    [level, postId]
  );

  const handleBack = useCallback(() => {
    void navigate('/');
  }, [navigate]);

  if (!level) {
    return (
      <div
        className="flex items-center justify-center h-screen w-screen"
        style={{ background: '#2C1810', color: '#A1887F' }}
      >
        Loading...
      </div>
    );
  }

  return (
    <GameBoard
      level={level}
      onWin={handleWin}
      onBack={handleBack}
      leaderboard={leaderboard}
      leaderboardActive={leaderboardActive}
      currentUser={currentUser}
      {...(solveResult ? { solveResult } : {})}
    />
  );
}
