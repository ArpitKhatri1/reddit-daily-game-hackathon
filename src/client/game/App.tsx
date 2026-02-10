import { Routes, Route, MemoryRouter } from 'react-router-dom';
import HomePage from '../components/Home/HomePage';
import PlayPage from '../components/Play/PlayPage';
import EditorPage from '../components/Editor/EditorPage';
import HistoryPage from '../components/History/HistoryPage';
import MyLevelsPage from '../components/MyLevels/MyLevelsPage';

export default function App() {
  return (
    <MemoryRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/play" element={<PlayPage />} />
        <Route path="/play/:levelId" element={<PlayPage />} />
        <Route path="/editor" element={<EditorPage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/my-levels" element={<MyLevelsPage />} />
      </Routes>
    </MemoryRouter>
  );
}
