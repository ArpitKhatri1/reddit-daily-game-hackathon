import { Routes, Route, HashRouter } from 'react-router-dom';
import HomePage from '../components/Home/HomePage';
import PlayPage from '../components/Play/PlayPage';
import EditorPage from '../components/Editor/EditorPage';
import HistoryPage from '../components/History/HistoryPage';
import CommunityPage from '../components/Community/CommunityPage';

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/play" element={<PlayPage />} />
        <Route path="/play/:levelId" element={<PlayPage />} />
        <Route path="/editor" element={<EditorPage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/community" element={<CommunityPage />} />
      </Routes>
    </HashRouter>
  );
}
