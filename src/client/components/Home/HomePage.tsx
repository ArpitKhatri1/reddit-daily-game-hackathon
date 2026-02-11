import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { fetchIsAdmin } from '../../lib/api';
import GearSVG from '../Gear/GearSVG';

export default function HomePage() {
  const navigate = useNavigate();
  const [heroAngle, setHeroAngle] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);

  // Check admin status
  useEffect(() => {
    fetchIsAdmin()
      .then((r) => setIsAdmin(r.isAdmin))
      .catch(() => {});
  }, []);

  // If splash set a navigation flag before requesting expanded mode, follow it once HomePage mounts
  useEffect(() => {
    try {
      const navPath = localStorage.getItem('devvit_navigate_after_expand');
      if (navPath) {
        localStorage.removeItem('devvit_navigate_after_expand');
        void navigate(navPath);
      }
    } catch (err) {
      // ignore
    }
  }, [navigate]);

  // Animate hero gears
  useEffect(() => {
    let frame: number;
    const animate = () => {
      setHeroAngle((prev) => (prev + 0.3) % 360);
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div
      className="flex flex-col items-center justify-center h-screen w-screen relative overflow-hidden"
      style={{
        background: 'radial-gradient(ellipse at center, #4E342E 0%, #2C1810 50%, #1a0f0a 100%)',
      }}
    >
      {/* Decorative background gears (one is hidden on small screens to reduce clutter) */}
      <div
        className="absolute pointer-events-none transform scale-75 md:scale-100"
        style={{ top: -40, left: -20, opacity: 0.08 }}
      >
        <GearSVG size="extraLarge" role="positional" angle={heroAngle * 0.5} />
      </div>
      <div
        className="absolute pointer-events-none hidden md:block"
        style={{ bottom: -140, right: -60, opacity: 0.08 }}
      >
        {/* This gear is hidden on phones to reduce clutter */}
        <GearSVG size="extraLarge" role="positional" angle={-heroAngle * 0.3} />
      </div>
      <div
        className="absolute pointer-events-none transform scale-75 md:scale-100"
        style={{ top: 80, right: 60, opacity: 0.06 }}
      >
        <GearSVG size="large" role="positional" angle={heroAngle * 0.7} />
      </div>

      {/* Title section */}
      <div className="flex items-center gap-3 mb-2">
        <div className="transform scale-75 sm:scale-90 md:scale-100">
          <GearSVG size="small" role="start" angle={heroAngle} />
        </div>
        <h1
          className="text-2xl sm:text-4xl md:text-6xl font-bold -mx-2 w-fit"
          style={{
            color: '#FFD54F',
            fontFamily: 'Georgia, serif',
            textShadow: '0 3px 12px rgba(255,213,79,0.4)',
          }}
        >
          Gear Puzzle
        </h1>
        <div className="transform scale-75 sm:scale-90 md:scale-100">
          <GearSVG size="small" role="goal" angle={-heroAngle} />
        </div>
      </div>

      <p
        className="text-base sm:text-lg mb-10"
        style={{ color: '#A1887F', fontFamily: 'Georgia, serif' }}
      >
        Connect the gears. Open the door.
      </p>

      {/* Menu buttons */}
      <div className="flex flex-col gap-4 w-64 sm:w-72">
        <button
          onClick={() => navigate('/play')}
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
          onClick={() => navigate('/editor')}
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
          onClick={() => navigate('/my-levels')}
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
          onClick={() => navigate('/history')}
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

        {isAdmin && (
          <button
            onClick={() => navigate('/editor?mode=daily')}
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
  );
}
