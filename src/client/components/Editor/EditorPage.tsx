import { useNavigate, useSearchParams } from 'react-router-dom';
import { useCallback, useState, useEffect } from 'react';
import type { LevelDefinition } from '../../types';
import { getCustomLevels } from '../../lib/storage';
import { fetchMyLevels, toLevelDefinition } from '../../lib/api';
import LevelEditor from '../Editor/LevelEditor';

export default function EditorPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isDailyMode = searchParams.get('mode') === 'daily';
  const draftId = searchParams.get('draft');

  const [existingLevel, setExistingLevel] = useState<LevelDefinition | undefined>(undefined);
  const [loading, setLoading] = useState(!!draftId);

  useEffect(() => {
    if (!draftId) return;

    // Try loading from localStorage first
    const local = getCustomLevels().find((l) => l.id === draftId);
    if (local) {
      setExistingLevel(local);
      setLoading(false);
      return;
    }

    // Otherwise try loading from server
    fetchMyLevels()
      .then((r) => {
        const found = r.levels.find((ul) => ul.levelData.id === draftId);
        if (found) {
          setExistingLevel(toLevelDefinition(found.levelData));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [draftId]);

  const handleBack = useCallback(() => {
    void navigate('/');
  }, [navigate]);

  if (loading) {
    return (
      <div
        className="flex items-center justify-center h-screen w-screen"
        style={{ background: '#2C1810', color: '#795548' }}
      >
        Loading draft...
      </div>
    );
  }

  return (
    <LevelEditor onBack={handleBack} existingLevel={existingLevel} isDailyMode={isDailyMode} />
  );
}
