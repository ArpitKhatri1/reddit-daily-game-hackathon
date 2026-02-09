import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import type { LevelDefinition } from "../../types";
import { getDailyLevel, getLevelById } from "../../levels/builtInLevels";
import { getCustomLevels, saveGameRecord } from "../../lib/storage";
import GameBoard from "../GameBoard/GameBoard";

export default function PlayPage() {
  const navigate = useNavigate();
  const { levelId } = useParams<{ levelId?: string }>();
  const [level, setLevel] = useState<LevelDefinition | null>(null);

  useEffect(() => {
    if (levelId) {
      const customLevels = getCustomLevels();
      const found = getLevelById(levelId, customLevels);
      if (found) {
        setLevel(found);
      } else {
        // Level not found, fall back to daily
        setLevel(getDailyLevel());
      }
    } else {
      setLevel(getDailyLevel());
    }
  }, [levelId]);

  const handleWin = useCallback(
    (timeTakenMs: number) => {
      if (!level) return;
      saveGameRecord({
        levelId: level.id,
        levelName: level.name,
        playedAt: new Date().toISOString(),
        solved: true,
        timeTakenMs,
      });
    },
    [level],
  );

  const handleBack = useCallback(() => {
    navigate("/");
  }, [navigate]);

  if (!level) {
    return (
      <div
        className="flex items-center justify-center h-screen w-screen"
        style={{ background: "#2C1810", color: "#A1887F" }}
      >
        Loading...
      </div>
    );
  }

  return <GameBoard level={level} onWin={handleWin} onBack={handleBack} />;
}
