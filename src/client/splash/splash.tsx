import '../index.css';

import { context, requestExpandedMode } from '@devvit/web/client';
import { StrictMode, useEffect, useState, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import GearSVG from '../components/Gear/GearSVG';
import { initializeStartGears, propagateRotation } from '../lib/engine';
import type { GearInstance } from '../types';
import type { LevelData } from '../../shared/types/api';

type SplashData = {
  postType?: string;
  levelName?: string;
  dailyNumber?: number;
  creatorUsername?: string;
  gearCount?: number;
};

const Splash = () => {
  const [data, setData] = useState<SplashData>({});
  const [previewGears, setPreviewGears] = useState<GearInstance[] | null>(null);
  const previewRef = useRef<HTMLDivElement | null>(null);
  const [previewSize, setPreviewSize] = useState({ width: 720, height: 480 });
  const animRef = useRef<number | null>(null);

  // Resize handler to compute scale for the 2400x1600 board
  useEffect(() => {
    const update = () => {
      const container = previewRef.current;
      const maxW = Math.min(window.innerWidth * 0.86, 900);
      const w = container ? container.clientWidth : maxW;
      const h = Math.round((w * 1600) / 2400);
      setPreviewSize({ width: Math.round(w), height: h });
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  // Simple animation loop for preview gears
  useEffect(() => {
    const animate = () => {
      setPreviewGears((prev) => {
        if (!prev) return prev;
        return prev.map((g) => {
          if (g.locked) {
            const jitter = Math.sin(Date.now() * 0.02) * 2;
            return { ...g, angle: (g.angle + jitter * 0.1) % 360 };
          }
          return { ...g, angle: (g.angle + g.rotationSpeed) % 360 };
        });
      });
      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

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

          // Build a preview gear set for rendering animation
          const fixed: GearInstance[] = init.levelData.fixedGears.map((fg: any) => ({
            id: fg.id,
            role: fg.role,
            size: fg.size,
            position: fg.position,
            angle: 0,
            rotationSpeed: fg.rotationSpeed ?? 0,
            meshedWith: [],
            requiredDirection: fg.requiredDirection,
          }));
          const initialized = initializeStartGears(fixed);
          const propagated = propagateRotation(initialized);
          setPreviewGears(propagated);
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
      className="flex relative flex-col justify-center items-center min-h-screen gap-1"
      style={{
        background: 'radial-gradient(ellipse at center, #4E342E 0%, #2C1810 50%, #1a0f0a 100%)',
        padding: '40px 16px',
      }}
    >
      <div className="flex justify-end" style={{ zIndex: 1 }}>
        <div>
          <h1
            className="text-2xl font-bold text-center "
            style={{
              color: '#FFD54F',
              fontFamily: 'Georgia, serif',
              textShadow: '0 2px 8px rgba(255,213,79,0.4)',
              marginBottom: 6,
            }}
          >
            {title}
          </h1>

          <p
            className="text-sm text-center"
            style={{ color: '#A1887F', fontFamily: 'Georgia, serif' }}
          >
            {subtitle}
          </p>
        </div>

        <div>
          <div className="flex items-center justify-center mt-4">
            <button
              className="flex items-center justify-center w-auto h-11 rounded-full cursor-pointer transition-all px-6 font-bold"
              style={{
                background: 'linear-gradient(to bottom, #FFD54F, #FF8F00)',
                color: '#3E2723',
                border: '2px solid #FFB300',
                boxShadow: '0 4px 16px rgba(255,183,0,0.3)',
                fontFamily: 'Georgia, serif',
                marginTop: 12,
              }}
              onClick={(e) => requestExpandedMode(e.nativeEvent, 'game')}
            >
              ⚙ Solve This!
            </button>
          </div>
        </div>
      </div>

      {/* Board preview container */}
      <div ref={previewRef} style={{ width: 'min(86vw, 900px)', marginTop: 18 }}>
        <div
          style={{
            width: previewSize.width,
            height: previewSize.height,
            margin: '0 auto',
            borderRadius: 12,
            overflow: 'hidden',
            background: 'radial-gradient(ellipse at center, #4E342E 0%, #2C1810 70%)',
            border: '2px solid rgba(93,64,55,0.6)',
          }}
        >
          <div
            style={{
              width: 2400,
              height: 1600,
              transform: `scale(${previewSize.width / 2400})`,
              transformOrigin: '0 0',
              position: 'relative',
              pointerEvents: 'none',
            }}
          >
            {/* Grid (subtle) */}
            <svg className="absolute inset-0" width={2400} height={1600} style={{ opacity: 0.06 }}>
              <defs>
                <pattern id="splashGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#D7CCC8" strokeWidth="1" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#splashGrid)" />
            </svg>

            {/* Render fixed gears */}
            {previewGears &&
              previewGears.map((g) => (
                <div
                  key={g.id}
                  className="absolute"
                  style={{ left: g.position.x, top: g.position.y }}
                >
                  <GearSVG
                    size={g.size}
                    role={g.role}
                    angle={g.angle}
                    locked={g.locked}
                    requiredDirection={g.requiredDirection}
                  />
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Splash />
  </StrictMode>
);

// Original splash layout (kept commented intentionally)
// <div
//   className="flex relative flex-col justify-center items-center min-h-screen gap-4"
//   style={{
//     background: 'radial-gradient(ellipse at center, #4E342E 0%, #2C1810 50%, #1a0f0a 100%)',
//   }}
// >
//   {/* Animated gear icons */}
//   <div className="flex items-center gap-3 mb-2">
//     <svg
//       width="48"
//       height="48"
//       viewBox="0 0 48 48"
//       className="animate-spin"
//       style={{ animationDuration: '8s' }}
//     >
//       <circle
//         cx="24"
//         cy="24"
//         r="18"
//         fill="none"
//         stroke="#FFD54F"
//         strokeWidth="3"
//         strokeDasharray="4 4"
//       />
//       <circle cx="24" cy="24" r="8" fill="#FFD54F" opacity="0.3" />
//       <circle cx="24" cy="24" r="3" fill="#3E2723" />
//     </svg>
//     <svg
//       width="36"
//       height="36"
//       viewBox="0 0 36 36"
//       className="animate-spin"
//       style={{ animationDuration: '6s', animationDirection: 'reverse' }}
//     >
//       <circle
//         cx="18"
//         cy="18"
//         r="13"
//         fill="none"
//         stroke="#66BB6A"
//         strokeWidth="3"
//         strokeDasharray="3 3"
//       />
//       <circle cx="18" cy="18" r="6" fill="#66BB6A" opacity="0.3" />
//       <circle cx="18" cy="18" r="2" fill="#3E2723" />
//     </svg>
//   </div>
//
//   <h1
//     className="text-2xl font-bold text-center"
//     style={{
//       color: '#FFD54F',
//       fontFamily: 'Georgia, serif',
//       textShadow: '0 2px 8px rgba(255,213,79,0.4)',
//     }}
//   >
//     {title}
//   </h1>
//
//   <p className="text-sm text-center" style={{ color: '#A1887F', fontFamily: 'Georgia, serif' }}>
//     {subtitle}
//   </p>
//
//   {data.gearCount && data.gearCount > 0 && (
//     <p className="text-xs text-center" style={{ color: '#795548' }}>
//       {data.gearCount} gears to work with
//     </p>
//   )}
//
//   <div className="flex flex-col items-center gap-2 mt-3">
//     <p className="text-xs" style={{ color: '#5D4037' }}>
//       Hey {context.username ?? 'user'} 👋
//     </p>
//   </div>
//
//   <div className="flex items-center justify-center mt-4">
//     <button
//       className="flex items-center justify-center w-auto h-11 rounded-full cursor-pointer transition-all px-6 font-bold"
//       style={{
//         background: 'linear-gradient(to bottom, #FFD54F, #FF8F00)',
//         color: '#3E2723',
