import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import type { GameRecord, LevelDefinition } from "../../types";
import { getGameHistory } from "../../lib/storage";
import { getCustomLevels } from "../../lib/storage";
import { getLevelById } from "../../levels/builtInLevels";

export default function HistoryPage() {
  const navigate = useNavigate();
  const [history, setHistory] = useState<GameRecord[]>([]);
  const [customLevels, setCustomLevels] = useState<LevelDefinition[]>([]);

  useEffect(() => {
    setHistory(getGameHistory());
    setCustomLevels(getCustomLevels());
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
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleReplay = (levelId: string) => {
    navigate(`/play/${levelId}`);
  };

  return (
    <div
      className="flex flex-col h-screen w-screen"
      style={{ background: "#2C1810" }}
    >
      {/* Top bar */}
      <div
        className="flex items-center gap-4 px-6 py-3 shrink-0"
        style={{
          background: "linear-gradient(to bottom, #3E2723, #2C1810)",
          borderBottom: "2px solid #5D4037",
        }}
      >
        <button
          onClick={() => navigate("/")}
          className="px-4 py-2 rounded font-bold text-sm cursor-pointer"
          style={{
            background: "#5D4037",
            color: "#D7CCC8",
            border: "1px solid #795548",
          }}
        >
          &larr; Home
        </button>
        <h2
          className="text-xl font-bold"
          style={{ color: "#D7CCC8", fontFamily: "Georgia, serif" }}
        >
          Game History
        </h2>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {history.length === 0 ? (
          <div className="text-center mt-20">
            <div className="text-6xl mb-4" style={{ opacity: 0.2 }}>
              &#9881;
            </div>
            <p className="text-lg" style={{ color: "#795548" }}>
              No games played yet.
            </p>
            <p className="text-sm mt-2" style={{ color: "#5D4037" }}>
              Play the daily puzzle to start your history!
            </p>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto flex flex-col gap-3">
            {history.map((record, idx) => {
              const level = getLevelById(record.levelId, customLevels);
              return (
                <div
                  key={idx}
                  className="flex items-center justify-between p-4 rounded-lg"
                  style={{
                    background: "rgba(62,39,35,0.6)",
                    border: "1px solid #5D4037",
                  }}
                >
                  <div className="flex flex-col gap-1">
                    <div
                      className="font-bold text-sm"
                      style={{ color: "#D7CCC8", fontFamily: "Georgia, serif" }}
                    >
                      {record.levelName}
                    </div>
                    <div className="text-xs" style={{ color: "#8D6E63" }}>
                      {formatDate(record.playedAt)}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex flex-col items-end gap-1">
                      <span
                        className="text-xs font-bold px-2 py-0.5 rounded"
                        style={{
                          background: record.solved ? "#388E3C" : "#C62828",
                          color: "#fff",
                        }}
                      >
                        {record.solved ? "SOLVED" : "UNSOLVED"}
                      </span>
                      {record.solved && (
                        <span className="text-xs" style={{ color: "#A1887F" }}>
                          {formatTime(record.timeTakenMs)}
                        </span>
                      )}
                    </div>

                    {level && (
                      <button
                        onClick={() => handleReplay(record.levelId)}
                        className="px-3 py-1.5 rounded text-xs font-bold cursor-pointer"
                        style={{
                          background: "#5D4037",
                          color: "#D7CCC8",
                          border: "1px solid #795548",
                        }}
                      >
                        Replay
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
