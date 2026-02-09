import '../index.css';

import { context, requestExpandedMode } from '@devvit/web/client';
import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';

type SplashData = {
  postType?: string;
  levelName?: string;
  dailyNumber?: number;
  creatorUsername?: string;
  gearCount?: number;
};

const Splash = () => {
  const [data, setData] = useState<SplashData>({});

  useEffect(() => {
    // Try to fetch init data for this post's splash preview
    fetch('/api/init')
      .then((r) => r.json())
      .then((init) => {
        const d: SplashData = {
          postType: init.postType,
          creatorUsername: init.creatorUsername,
        };
        if (init.levelData) {
          d.levelName = init.levelData.name;
          d.gearCount =
            (init.levelData.fixedGears?.length ?? 0) + (init.levelData.inventory?.length ?? 0);
        }
        if (init.dailyNumber) d.dailyNumber = init.dailyNumber;
        setData(d);
      })
      .catch(() => {});
  }, []);

  const title = data.dailyNumber
    ? `Daily Puzzle #${data.dailyNumber}`
    : data.levelName
      ? data.levelName
      : 'Gear Puzzle';

  const subtitle =
    data.postType === 'user' && data.creatorUsername
      ? `Created by ${data.creatorUsername}`
      : data.postType === 'daily'
        ? "Can you solve today's puzzle?"
        : 'Connect the gears. Open the door.';

  return (
    <div
      className="flex relative flex-col justify-center items-center min-h-screen gap-4"
      style={{
        background: 'radial-gradient(ellipse at center, #4E342E 0%, #2C1810 50%, #1a0f0a 100%)',
      }}
    >
      {/* Animated gear icons */}
      <div className="flex items-center gap-3 mb-2">
        <svg
          width="48"
          height="48"
          viewBox="0 0 48 48"
          className="animate-spin"
          style={{ animationDuration: '8s' }}
        >
          <circle
            cx="24"
            cy="24"
            r="18"
            fill="none"
            stroke="#FFD54F"
            strokeWidth="3"
            strokeDasharray="4 4"
          />
          <circle cx="24" cy="24" r="8" fill="#FFD54F" opacity="0.3" />
          <circle cx="24" cy="24" r="3" fill="#3E2723" />
        </svg>
        <svg
          width="36"
          height="36"
          viewBox="0 0 36 36"
          className="animate-spin"
          style={{ animationDuration: '6s', animationDirection: 'reverse' }}
        >
          <circle
            cx="18"
            cy="18"
            r="13"
            fill="none"
            stroke="#66BB6A"
            strokeWidth="3"
            strokeDasharray="3 3"
          />
          <circle cx="18" cy="18" r="6" fill="#66BB6A" opacity="0.3" />
          <circle cx="18" cy="18" r="2" fill="#3E2723" />
        </svg>
      </div>

      <h1
        className="text-2xl font-bold text-center"
        style={{
          color: '#FFD54F',
          fontFamily: 'Georgia, serif',
          textShadow: '0 2px 8px rgba(255,213,79,0.4)',
        }}
      >
        {title}
      </h1>

      <p className="text-sm text-center" style={{ color: '#A1887F', fontFamily: 'Georgia, serif' }}>
        {subtitle}
      </p>

      {data.gearCount && data.gearCount > 0 && (
        <p className="text-xs text-center" style={{ color: '#795548' }}>
          {data.gearCount} gears to work with
        </p>
      )}

      <div className="flex flex-col items-center gap-2 mt-3">
        <p className="text-xs" style={{ color: '#5D4037' }}>
          Hey {context.username ?? 'user'} 👋
        </p>
      </div>

      <div className="flex items-center justify-center mt-4">
        <button
          className="flex items-center justify-center w-auto h-11 rounded-full cursor-pointer transition-all px-6 font-bold"
          style={{
            background: 'linear-gradient(to bottom, #FFD54F, #FF8F00)',
            color: '#3E2723',
            border: '2px solid #FFB300',
            boxShadow: '0 4px 16px rgba(255,183,0,0.3)',
            fontFamily: 'Georgia, serif',
          }}
          onClick={(e) => requestExpandedMode(e.nativeEvent, 'game')}
        >
          ⚙ Solve This!
        </button>
      </div>

      <footer className="absolute bottom-4 text-xs" style={{ color: '#5D4037' }}>
        A calm, precision-based gear puzzle
      </footer>
    </div>
  );
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Splash />
  </StrictMode>
);
