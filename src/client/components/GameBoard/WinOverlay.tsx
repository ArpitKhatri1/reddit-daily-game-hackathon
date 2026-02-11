import { useEffect, useState } from 'react';
import type { LeaderboardEntry } from '../../../shared/types/api';
import Leaderboard from '../Leaderboard/Leaderboard';
import { fetchLeaderboard } from '../../lib/api';

interface WinOverlayProps {
  timeTakenMs: number;
  onContinue: () => void;
  leaderboard?: LeaderboardEntry[];
  leaderboardActive?: boolean;
  rank?: number;
  currentUser?: string;
  message?: string;
  postId?: string;
}

export default function WinOverlay({
  timeTakenMs,
  onContinue,
  leaderboard,
  leaderboardActive,
  rank,
  currentUser,
  message,
  postId,
}: WinOverlayProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>(leaderboard ?? []);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    let intervalId: number | undefined;

    // Use the passed-in leaderboard as seed
    setEntries(leaderboard ?? []);

    const doFetch = async () => {
      if (!postId) return;
      setLoading(true);
      try {
        const res = await fetchLeaderboard(postId);
        if (!mounted) return;
        setEntries(res.leaderboard ?? []);
      } catch (err) {
        // ignore
      } finally {
        if (mounted) setLoading(false);
      }
    };

    // Start fetching immediately (in background) and poll every few seconds
    if (postId) {
      void doFetch();
      intervalId = window.setInterval(() => {
        void doFetch();
      }, 3000);
    }

    // Delay showing the leaderboard visually
    const showTimer = window.setTimeout(() => setShowLeaderboard(true), 1000);

    return () => {
      mounted = false;
      if (intervalId) window.clearInterval(intervalId);
      clearTimeout(showTimer);
    };
  }, [postId, leaderboard]);

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (minutes > 0) return `${minutes}m ${secs}s`;
    return `${secs}s`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto">
      {/* Backdrop */}
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.75)' }} />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center py-8 px-4 max-h-full">
        {/* Gear icon */}
        <div
          className="text-5xl mb-4"
          style={{ filter: 'drop-shadow(0 0 12px rgba(255,213,79,0.6))' }}
        >
          ⚙️
        </div>

        <h1
          className="text-3xl font-bold mb-2"
          style={{
            color: '#FFD54F',
            fontFamily: 'Georgia, serif',
            textShadow: '0 2px 8px rgba(255,213,79,0.5)',
          }}
        >
          Puzzle Solved!
        </h1>

        <p className="text-lg mb-1" style={{ color: '#D7CCC8' }}>
          Completed in <strong style={{ color: '#FFD54F' }}>{formatTime(timeTakenMs)}</strong>
        </p>

        <p className="text-sm mb-4" style={{ color: '#A1887F' }}>
          {message || 'The gears aligned perfectly.'}
          {rank && rank <= 10 && <span style={{ color: '#FFD54F' }}> 🏅 You ranked #{rank}!</span>}
        </p>

        {/* Leaderboard: hidden for 1.5s, continues to fetch in background */}
        <div
          className="w-80 mb-6 transition-opacity duration-300"
          style={{
            opacity: showLeaderboard ? 1 : 0,
            pointerEvents: showLeaderboard ? 'auto' : 'none',
          }}
        >
          {showLeaderboard ? (
            entries.length > 0 ? (
              <Leaderboard
                entries={entries}
                active={leaderboardActive ?? false}
                currentUser={currentUser ?? ''}
              />
            ) : (
              <div className="p-3 text-center text-sm" style={{ color: '#A1887F' }}>
                {loading ? 'Loading leaderboard...' : 'No solves yet.'}
              </div>
            )
          ) : (
            <div className="p-3 text-center text-sm" style={{ color: '#A1887F' }}>
              {loading ? 'Loading leaderboard...' : 'Fetching leaderboard...'}
            </div>
          )}
        </div>

        <button
          onClick={onContinue}
          className="px-8 py-3 rounded-lg font-bold text-lg cursor-pointer transition-colors"
          style={{
            background: 'linear-gradient(to bottom, #FFD54F, #FF8F00)',
            color: '#3E2723',
            border: '2px solid #FFB300',
            boxShadow: '0 4px 12px rgba(255,183,0,0.3)',
          }}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
