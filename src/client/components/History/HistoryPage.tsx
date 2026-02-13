import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import type { GameRecord, LevelDefinition } from '../../types';
import type { DailyPuzzleHistoryEntry } from '../../../shared/types/api';
import { getGameHistory, saveGameRecord } from '../../lib/storage';
import { builtInLevels } from '../../levels/builtInLevels';
import { fetchDailyHistory, toLevelDefinition } from '../../lib/api';
import GameBoard from '../GameBoard/GameBoard';

type TabType = 'daily' | 'personal';

export default function HistoryPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<TabType>('daily');
  const [history, setHistory] = useState<GameRecord[]>([]);
  const [dailyPuzzles, setDailyPuzzles] = useState<DailyPuzzleHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [playingLevel, setPlayingLevel] = useState<LevelDefinition | null>(null);

  useEffect(() => {
    setHistory(getGameHistory());
    fetchDailyHistory()
      .then((r) => setDailyPuzzles(r.puzzles))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (minutes > 0) return `${minutes}m ${secs}s`;
    return `${secs}s`;
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handlePlayDaily = (entry: DailyPuzzleHistoryEntry) => {
    setPlayingLevel(toLevelDefinition(entry.levelData));
  };

  const handlePlayBuiltIn = (level: LevelDefinition) => {
    setPlayingLevel(level);
  };

  const handleWin = useCallback(
    (timeTakenMs: number) => {
      if (!playingLevel) return;
      saveGameRecord({
        levelId: playingLevel.id,
        levelName: playingLevel.name,
        playedAt: new Date().toISOString(),
        solved: true,
        timeTakenMs,
      });
    },
    [playingLevel]
  );

  const handleBackFromPlay = useCallback(() => {
    setPlayingLevel(null);
  }, []);

  // If playing a level in-app, show GameBoard
  if (playingLevel) {
    return <GameBoard level={playingLevel} onWin={handleWin} onBack={handleBackFromPlay} />;
  }

  const tabBtnStyle = (isActive: boolean) => ({
    background: isActive ? '#FFD54F' : '#5D4037',
    color: isActive ? '#3E2723' : '#D7CCC8',
    border: isActive ? '2px solid #FFB300' : '1px solid #795548',
  });

  return (
    <div className="flex flex-col h-screen w-screen" style={{ background: '#2C1810' }}>
      {/* Top bar */}
      <div
        className="flex items-center gap-4 px-6 py-3 shrink-0"
        style={{
          background: 'linear-gradient(to bottom, #3E2723, #2C1810)',
          borderBottom: '2px solid #5D4037',
        }}
      >
        <button
          onClick={() => void navigate('/')}
          className="px-4 py-2 rounded font-bold text-sm cursor-pointer"
          style={{
            background: '#5D4037',
            color: '#D7CCC8',
            border: '1px solid #795548',
          }}
        >
          &larr; Home
        </button>
        <h2 className="text-xl font-bold" style={{ color: '#D7CCC8' }}>
          History
        </h2>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 px-6 py-2 shrink-0" style={{ borderBottom: '1px solid #5D4037' }}>
        <button
          onClick={() => setTab('daily')}
          className="px-4 py-1.5 rounded font-bold text-sm cursor-pointer"
          style={tabBtnStyle(tab === 'daily')}
        >
          Daily Puzzles
        </button>
        <button
          onClick={() => setTab('personal')}
          className="px-4 py-1.5 rounded font-bold text-sm cursor-pointer"
          style={tabBtnStyle(tab === 'personal')}
        >
          My History
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {tab === 'daily' && (
          <>
            {loading ? (
              <div className="text-center mt-20">
                <p className="text-lg" style={{ color: '#795548' }}>
                  Loading...
                </p>
              </div>
            ) : dailyPuzzles.length === 0 ? (
              <div>
                <p className="text-center text-sm mb-6" style={{ color: '#795548' }}>
                  No daily puzzles posted yet. Showing built-in levels:
                </p>
                <div className="max-w-2xl mx-auto flex flex-col gap-3">
                  {builtInLevels.map((level) => (
                    <div
                      key={level.id}
                      className="flex items-center justify-between p-4 rounded-lg"
                      style={{
                        background: 'rgba(62,39,35,0.6)',
                        border: '1px solid #5D4037',
                      }}
                    >
                      <div className="flex flex-col gap-1">
                        <div className="font-bold text-sm" style={{ color: '#D7CCC8' }}>
                          {level.name}
                        </div>
                        {level.description && (
                          <div className="text-xs" style={{ color: '#8D6E63' }}>
                            {level.description}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => handlePlayBuiltIn(level)}
                        className="px-4 py-1.5 rounded font-bold text-sm cursor-pointer"
                        style={{
                          background: 'linear-gradient(to bottom, #FFD54F, #FF8F00)',
                          color: '#3E2723',
                          border: '1px solid #FFB300',
                        }}
                      >
                        ▶ Play
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="max-w-2xl mx-auto flex flex-col gap-3">
                {dailyPuzzles.map((entry) => (
                  <div
                    key={entry.dailyNumber}
                    className="flex items-center justify-between p-4 rounded-lg"
                    style={{
                      background: 'rgba(62,39,35,0.6)',
                      border: '1px solid #5D4037',
                    }}
                  >
                    <div className="flex flex-col gap-1">
                      <div className="font-bold text-sm" style={{ color: '#FFD54F' }}>
                        Daily Puzzle #{entry.dailyNumber}
                      </div>
                      <div className="text-xs" style={{ color: '#8D6E63' }}>
                        {entry.levelData.name} · {formatDate(entry.createdAt)}
                      </div>
                    </div>
                    <button
                      onClick={() => handlePlayDaily(entry)}
                      className="px-4 py-1.5 rounded font-bold text-sm cursor-pointer"
                      style={{
                        background: 'linear-gradient(to bottom, #FFD54F, #FF8F00)',
                        color: '#3E2723',
                        border: '1px solid #FFB300',
                      }}
                    >
                      Play
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {tab === 'personal' && (
          <>
            {history.length === 0 ? (
              <div className="text-center mt-20">
                <div className="text-6xl mb-4" style={{ opacity: 0.2 }}>
                  &#9881;
                </div>
                <p className="text-lg" style={{ color: '#795548' }}>
                  No games played yet.
                </p>
                <p className="text-sm mt-2" style={{ color: '#5D4037' }}>
                  Play the daily puzzle to start your history!
                </p>
              </div>
            ) : (
              <div className="max-w-2xl mx-auto flex flex-col gap-3">
                {history.map((record, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-4 rounded-lg"
                    style={{
                      background: 'rgba(62,39,35,0.6)',
                      border: '1px solid #5D4037',
                    }}
                  >
                    <div className="flex flex-col gap-1">
                      <div className="font-bold text-sm" style={{ color: '#D7CCC8' }}>
                        {record.levelName}
                      </div>
                      <div className="text-xs" style={{ color: '#8D6E63' }}>
                        {formatDate(record.playedAt)}
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="flex flex-col items-end gap-1">
                        <span
                          className="text-xs font-bold px-2 py-0.5 rounded"
                          style={{
                            background: record.solved ? '#388E3C' : '#C62828',
                            color: '#fff',
                          }}
                        >
                          {record.solved ? 'SOLVED' : 'UNSOLVED'}
                        </span>
                        {record.solved && (
                          <span className="text-xs" style={{ color: '#A1887F' }}>
                            {formatTime(record.timeTakenMs)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
