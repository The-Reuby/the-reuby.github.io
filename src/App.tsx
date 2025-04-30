import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { About } from './pages/About';
import { Reader } from './pages/Reader';
import { Archive } from './pages/Archive';
import { Contributors } from './pages/Contributors';
import { Submission } from './pages/Submission';

export const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/reader" element={<Reader />} />
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="about" element={<About />} />
          <Route path="archive" element={<Archive />} />
          <Route path="contributors" element={<Contributors />} />
          <Route path="submission" element={<Submission />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};
