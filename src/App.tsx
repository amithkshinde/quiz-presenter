import { Route, Routes } from 'react-router-dom';
import { LibraryPage } from './pages/LibraryPage';
import { EditorPage } from './pages/EditorPage';
import { LaunchPage } from './pages/LaunchPage';
import { PresenterPage } from './pages/PresenterPage';
import { DisplayPage } from './pages/DisplayPage';
import { PreviewPage } from './pages/PreviewPage';
import { ResultsPage } from './pages/ResultsPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LibraryPage />} />
      <Route path="/quizzes/:quizId/edit" element={<EditorPage />} />
      <Route path="/quizzes/:quizId/preview" element={<PreviewPage />} />
      <Route path="/quizzes/:quizId/launch" element={<LaunchPage />} />
      <Route path="/quizzes/:quizId/results/:sessionId" element={<ResultsPage />} />
      <Route path="/session/:sessionId/present" element={<PresenterPage />} />
      <Route path="/session/:sessionId/display" element={<DisplayPage />} />
    </Routes>
  );
}
