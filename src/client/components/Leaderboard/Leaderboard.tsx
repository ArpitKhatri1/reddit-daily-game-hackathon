import type { LeaderboardEntry } from '../../../shared/types/api';

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  active: boolean;
  currentUser?: string;
}

function formatTime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (minutes > 0) return `${minutes}m ${secs}s`;
  return `${secs}.${Math.floor((ms % 1000) / 100)}s`;
}

export default function Leaderboard({ entries, active, currentUser }: LeaderboardProps) {
  if (entries.length === 0 && !active) return null;

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{
        background: 'rgba(62,39,35,0.8)',
        border: '1px solid #5D4037',
      }}
    >
      <div
        className="flex items-center justify-between px-3 py-2"
        style={{
          background: 'linear-gradient(to right, #3E2723, #5D4037)',
          borderBottom: '1px solid #5D4037',
        }}
      >
        <span
          className="text-xs font-bold uppercase tracking-wider"
          style={{ color: '#FFD54F', fontFamily: 'Georgia, serif' }}
        >
          🏆 Leaderboard
        </span>
        {active && (
          <span
            className="text-xs px-2 py-0.5 rounded"
            style={{ background: '#388E3C', color: '#fff' }}
          >
            LIVE
          </span>
        )}
        {!active && entries.length > 0 && (
          <span
            className="text-xs px-2 py-0.5 rounded"
            style={{ background: '#795548', color: '#D7CCC8' }}
          >
            CLOSED
          </span>
        )}
      </div>

      {entries.length === 0 ? (
        <div className="px-3 py-4 text-center">
          <p className="text-xs" style={{ color: '#795548' }}>
            No solves yet. Be the first!
          </p>
        </div>
      ) : (
        <div className="flex flex-col">
          {entries.slice(0, 10).map((entry, i) => {
            const isMe = currentUser === entry.username;
            const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`;
            return (
              <div
                key={entry.username}
                className="flex items-center justify-between px-3 py-1.5"
                style={{
                  background: isMe ? 'rgba(255,213,79,0.1)' : 'transparent',
                  borderBottom: '1px solid rgba(93,64,55,0.3)',
                }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs w-6 text-center" style={{ color: '#A1887F' }}>
                    {medal}
                  </span>
                  <span
                    className="text-xs font-bold"
                    style={{ color: isMe ? '#FFD54F' : '#D7CCC8' }}
                  >
                    {entry.username}
                    {isMe && ' (you)'}
                  </span>
                </div>
                <span className="text-xs font-mono" style={{ color: '#A1887F' }}>
                  {formatTime(entry.timeMs)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
