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
  const [loading, setLoading] = useState(true);
  const [loadingAngle, setLoadingAngle] = useState(0);
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

  // Loading animation
  useEffect(() => {
    if (!loading) return;
    const animateLoading = () => {
      setLoadingAngle((prev) => (prev + 2) % 360);
    };
    const interval = setInterval(animateLoading, 16); // ~60fps
    return () => clearInterval(interval);
  }, [loading]);
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
      .catch(() => {})
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const title = data.dailyNumber
    ? `Daily Puzzle #${data.dailyNumber}`
    : data.levelName
      ? data.levelName
      : 'Gear Puzzle';

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
      {loading ? (
        // Loading screen
        <div className="flex flex-col items-center justify-center gap-4">
          <div>
            <GearSVG size="medium" role="positional" angle={loadingAngle} />
          </div>
          <p className="text-sm" style={{ color: '#A1887F' }}>
            Loading...
          </p>
        </div>
      ) : (
        <>
          {/* Title section */}
          {isAdminDailyPost ? (
            <div className="flex items-center gap-5 mb-2">
              <div className="transform scale-75 sm:scale-90 md:scale-100">
                <GearSVG size="small" role="start" angle={0} />
              </div>
              <h1
                className="text-2xl sm:text-4xl md:text-6xl font-bold text-center -mx-2 w-fit"
                style={{
                  color: '#FFD54F',
                  textShadow: '0 3px 12px rgba(255,213,79,0.4)',
                }}
              >
                {title}
              </h1>
              <div className="transform scale-75 sm:scale-90 md:scale-100">
                <GearSVG size="small" role="goal" angle={0} />
              </div>
            </div>
          ) : (
            <></>
          )}

          {/* Board preview container or admin menu for admin-created daily posts */}
          {isAdminDailyPost ? (
            <div>
              {/* Menu buttons */}
              <div className="flex flex-col gap-4 w-64 sm:w-72">
                <button
                  onClick={(e) => handleExpandNav(e, '/play')}
                  className="px-4 py-3 sm:px-6 sm:py-4 font-bold text-base sm:text-lg cursor-pointer transition-all hover:scale-105"
                  style={{
                    background: '#FFD54F',
                    color: '#3E2723',
                    border: '4px solid #000',
                    boxShadow: '8px 8px 0px #000',
                  }}
                >
                  Solve
                </button>
                <button
                  onClick={(e) => handleExpandNav(e, '/how-to-play')}
                  className="px-4 py-3 sm:px-6 sm:py-4 font-bold text-base sm:text-lg cursor-pointer transition-all hover:scale-105"
                  style={{
                    background: '#AB47BC',
                    color: '#fff',
                    border: '4px solid #000',
                    boxShadow: '8px 8px 0px #000',
                  }}
                >
                  How to Play
                </button>

                <button
                  onClick={(e) => handleExpandNav(e, '/editor')}
                  className="px-4 py-3 sm:px-6 sm:py-4 font-bold text-base sm:text-lg cursor-pointer transition-all hover:scale-105"
                  style={{
                    background: '#66BB6A',
                    color: '#fff',
                    border: '4px solid #000',
                    boxShadow: '8px 8px 0px #000',
                  }}
                >
                  Level Editor
                </button>

                <button
                  onClick={(e) => handleExpandNav(e, '/history')}
                  className="px-4 py-3 sm:px-6 sm:py-4 font-bold text-base sm:text-lg cursor-pointer transition-all hover:scale-105"
                  style={{
                    background: '#5D4037',
                    color: '#D7CCC8',
                    border: '4px solid #000',
                    boxShadow: '8px 8px 0px #000',
                  }}
                >
                  History
                </button>
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
                    className="flex items-center justify-center w-auto h-11 cursor-pointer transition-all px-6 font-bold"
                    style={{
                      background: '#FFD54F',
                      color: '#3E2723',
                      border: '4px solid #000',
                      boxShadow: '8px 8px 0px #000',
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
        </>
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
