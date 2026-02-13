import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import type { UserLevel } from '../../../shared/types/api';
import { fetchMyLevels, deleteDraft } from '../../lib/api';
import GearSVG from '../Gear/GearSVG';

export default function MyLevelsPage() {
  const navigate = useNavigate();
  const [levels, setLevels] = useState<UserLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [heroAngle, setHeroAngle] = useState(0);

  useEffect(() => {
    fetchMyLevels()
      .then((r) => setLevels(r.levels))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Animate decorative gears
  useEffect(() => {
    let frame: number;
    const animate = () => {
      setHeroAngle((prev) => (prev + 0.3) % 360);
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, []);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleDelete = async (levelId: string) => {
    if (!confirm('Delete this draft?')) return;
    try {
      await deleteDraft(levelId);
      setLevels((prev) => prev.filter((l) => l.levelData.id !== levelId));
    } catch {
      // ignore
    }
  };

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
          Your Levels
        </h2>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="text-center mt-20">
            <p className="text-lg" style={{ color: '#795548' }}>
              Loading...
            </p>
          </div>
        ) : levels.length === 0 ? (
          <div className="text-center mt-20">
            <div className="flex justify-center mb-6" style={{ opacity: 0.3 }}>
              <GearSVG size="large" role="positional" angle={heroAngle} />
            </div>
            <p className="text-lg" style={{ color: '#795548' }}>
              No levels yet.
            </p>
            <p className="text-sm mt-2" style={{ color: '#5D4037' }}>
              Create one in the Level Editor!
            </p>
            <button
              onClick={() => void navigate('/editor')}
              className="mt-6 px-6 py-3 rounded-lg font-bold cursor-pointer transition-all hover:scale-105"
              style={{
                background: 'linear-gradient(to bottom, #66BB6A, #388E3C)',
                color: '#fff',
                border: '2px solid #4CAF50',
              }}
            >
              &#9881; Create a Level
            </button>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {levels.map((ul) => {
                const ld = ul.levelData;
                const startCount = ld.fixedGears.filter((g) => g.role === 'start').length;
                const goalCount = ld.fixedGears.filter((g) => g.role === 'goal').length;
                const invCount = ld.inventory.length;

                return (
                  <div
                    key={ld.id}
                    className="flex flex-col gap-2 p-4 rounded-lg"
                    style={{
                      background: 'rgba(62,39,35,0.6)',
                      border: ul.published ? '1px solid #4CAF50' : '1px solid #5D4037',
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3
                          className="font-bold text-base"
                          style={{
                            color: '#D7CCC8',
                          }}
                        >
                          {ld.name}
                        </h3>
                        <div className="text-xs mt-1" style={{ color: '#8D6E63' }}>
                          {formatDate(ul.createdAt)}
                        </div>
                      </div>
                      <span
                        className="text-xs px-2 py-0.5 rounded font-bold"
                        style={{
                          background: ul.published ? '#388E3C' : '#795548',
                          color: '#fff',
                        }}
                      >
                        {ul.published ? 'PUBLISHED' : 'DRAFT'}
                      </span>
                    </div>

                    {/* Level stats */}
                    <div className="flex gap-3 mt-1">
                      <span
                        className="text-xs px-2 py-0.5 rounded"
                        style={{ background: '#2E7D32', color: '#fff' }}
                      >
                        {startCount} start
                      </span>
                      <span
                        className="text-xs px-2 py-0.5 rounded"
                        style={{ background: '#C62828', color: '#fff' }}
                      >
                        {goalCount} goal
                      </span>
                      <span
                        className="text-xs px-2 py-0.5 rounded"
                        style={{ background: '#5D4037', color: '#D7CCC8' }}
                      >
                        {invCount} piece{invCount !== 1 ? 's' : ''}
                      </span>
                    </div>

                    {/* Play/solve stats for published */}
                    {ul.published && (
                      <div className="flex gap-4 mt-1">
                        <span className="text-xs" style={{ color: '#A1887F' }}>
                          ▶ {ul.playCount} plays
                        </span>
                        <span className="text-xs" style={{ color: '#A1887F' }}>
                          ✓ {ul.solveCount} solves
                        </span>
                      </div>
                    )}

                    <div className="flex gap-2 mt-2">
                      {!ul.published && (
                        <>
                          <button
                            onClick={() => void navigate(`/editor?draft=${ld.id}`)}
                            className="flex-1 px-3 py-2 rounded font-bold text-sm cursor-pointer"
                            style={{
                              background: '#5D4037',
                              color: '#D7CCC8',
                              border: '1px solid #795548',
                            }}
                          >
                            ✏️ Edit
                          </button>
                          <button
                            onClick={() => void handleDelete(ld.id)}
                            className="px-3 py-2 rounded font-bold text-sm cursor-pointer"
                            style={{
                              background: '#C62828',
                              color: '#fff',
                              border: '1px solid #E53935',
                            }}
                          >
                            🗑
                          </button>
                        </>
                      )}
                      {ul.published && ul.postUrl && (
                        <a
                          href={ul.postUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 px-3 py-2 rounded font-bold text-sm text-center cursor-pointer"
                          style={{
                            background: 'linear-gradient(to bottom, #FFD54F, #FF8F00)',
                            color: '#3E2723',
                            border: '1px solid #FFB300',
                            textDecoration: 'none',
                          }}
                        >
                          View Post
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Create more button at bottom */}
            <div className="flex justify-center mt-8">
              <button
                onClick={() => void navigate('/editor')}
                className="px-6 py-3 rounded-lg font-bold cursor-pointer transition-all hover:scale-105"
                style={{
                  background: 'linear-gradient(to bottom, #66BB6A, #388E3C)',
                  color: '#fff',
                  border: '2px solid #4CAF50',
                }}
              >
                + Create New Level
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
