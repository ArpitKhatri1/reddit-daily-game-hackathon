import '../index.css';
import { requestExpandedMode } from '@devvit/web/client';
import { StrictMode, useEffect, useState, useRef, type MouseEvent } from 'react';
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
  const [isUserPost, setIsUserPost] = useState(false);
  const [isAdminDailyPost, setIsAdminDailyPost] = useState(false);
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
          const fixed: GearInstance[] = (
            init.levelData.fixedGears as LevelData['fixedGears'][number][]
          ).map((fg) => ({
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
          // Detect whether this is a user-level post (created by a user) or an admin daily with level data
          setIsUserPost(init.postType === 'user' && !!init.levelData);
          setIsAdminDailyPost(init.postType === 'daily' && !!init.levelData);
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

  const handleSolveClick = (e: MouseEvent<HTMLButtonElement>) => {
    if (isUserPost) {
      try {
        localStorage.setItem('devvit_navigate_after_expand', '/play?source=server');
      } catch (err) {
        console.debug('localStorage write failed', err);
      }
    }
    void requestExpandedMode(e.nativeEvent, 'game');
  };

  const handleExpandNav = (e: MouseEvent<HTMLButtonElement>, path: string) => {
    try {
      localStorage.setItem('devvit_navigate_after_expand', path);
    } catch (err) {
      console.debug('localStorage write failed', err);
    }
    void requestExpandedMode(e.nativeEvent, 'game');
  };

  return (
    <div
      className="flex relative flex-col justify-center items-center h-screen gap-1 overflow-y-hidden"
      style={{
        background: 'radial-gradient(ellipse at center, #4E342E 0%, #2C1810 50%, #1a0f0a 100%)',
        padding: '40px 16px',
      }}
    >
      {/* Board preview container or admin menu for admin-created daily posts */}
      {isAdminDailyPost ? (
        <div>
          <p
            className="text-base sm:text-lg mb-10"
            style={{ color: '#A1887F', fontFamily: 'Georgia, serif' }}
          >
            Connect the gears.
          </p>

          {/* Menu buttons */}
          <div className="flex flex-col gap-4 w-64 sm:w-72">
            <button
              onClick={(e) => handleExpandNav(e, '/play')}
              className="px-4 py-3 sm:px-6 sm:py-4 rounded-lg font-bold text-base sm:text-lg cursor-pointer transition-all hover:scale-105"
              style={{
                background: 'linear-gradient(to bottom, #FFD54F, #FF8F00)',
                color: '#3E2723',
                border: '2px solid #FFB300',
                boxShadow: '0 4px 16px rgba(255,183,0,0.3)',
                fontFamily: 'Georgia, serif',
              }}
            >
              &#9654;&ensp;Daily Puzzle
            </button>

            <button
              onClick={(e) => handleExpandNav(e, '/editor')}
              className="px-4 py-3 sm:px-6 sm:py-4 rounded-lg font-bold text-base sm:text-lg cursor-pointer transition-all hover:scale-105"
              style={{
                background: 'linear-gradient(to bottom, #66BB6A, #388E3C)',
                color: '#fff',
                border: '2px solid #4CAF50',
                boxShadow: '0 4px 16px rgba(76,175,80,0.3)',
                fontFamily: 'Georgia, serif',
              }}
            >
              &#9881;&ensp;Level Editor
            </button>

            <button
              onClick={(e) => handleExpandNav(e, '/my-levels')}
              className="px-4 py-3 sm:px-6 sm:py-4 rounded-lg font-bold text-base sm:text-lg cursor-pointer transition-all hover:scale-105"
              style={{
                background: 'linear-gradient(to bottom, #FF8F00, #E65100)',
                color: '#fff',
                border: '2px solid #FF6F00',
                boxShadow: '0 4px 16px rgba(255,111,0,0.3)',
                fontFamily: 'Georgia, serif',
              }}
            >
              &#128736;&ensp;Your Levels
            </button>

            <button
              onClick={(e) => handleExpandNav(e, '/history')}
              className="px-4 py-3 sm:px-6 sm:py-4 rounded-lg font-bold text-base sm:text-lg cursor-pointer transition-all hover:scale-105"
              style={{
                background: 'linear-gradient(to bottom, #5D4037, #3E2723)',
                color: '#D7CCC8',
                border: '2px solid #795548',
                boxShadow: '0 4px 16px rgba(93,64,55,0.3)',
                fontFamily: 'Georgia, serif',
              }}
            >
              &#128214;&ensp;History
            </button>

            {isAdminDailyPost && (
              <button
                onClick={(e) => handleExpandNav(e, '/editor?mode=daily')}
                className="px-4 py-3 sm:px-6 sm:py-4 rounded-lg font-bold text-base sm:text-lg cursor-pointer transition-all hover:scale-105"
                style={{
                  background: 'linear-gradient(to bottom, #AB47BC, #7B1FA2)',
                  color: '#fff',
                  border: '2px solid #9C27B0',
                  boxShadow: '0 4px 16px rgba(156,39,176,0.3)',
                  fontFamily: 'Georgia, serif',
                }}
              >
                &#9733;&ensp;Post Daily Puzzle
              </button>
            )}
          </div>
        </div>
      ) : (
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
              <svg
                className="absolute inset-0"
                width={2400}
                height={1600}
                style={{ opacity: 0.06 }}
              >
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
      )}
      {isAdminDailyPost ? (
        ''
      ) : (
        <div className="flex justify-end" style={{ zIndex: 1 }}>
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
                onClick={handleSolveClick}
              >
                ⚙ Solve This!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Splash;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Splash />
  </StrictMode>
);
