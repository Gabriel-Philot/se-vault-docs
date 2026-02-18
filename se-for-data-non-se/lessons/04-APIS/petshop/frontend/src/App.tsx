import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import PetManager from './pages/PetManager';
import ApiExplorer from './pages/ApiExplorer';
import DatabaseExplorer from './pages/DatabaseExplorer';
import Architecture from './pages/Architecture';
import CodeLab from './pages/CodeLab';
import './styles/pet-theme.css';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="pets" element={<PetManager />} />
          <Route path="explorer" element={<ApiExplorer />} />
          <Route path="database" element={<DatabaseExplorer />} />
          <Route path="architecture" element={<Architecture />} />
          <Route path="codelab" element={<CodeLab />} />
          <Route path="lessons/:id" element={<LessonPlaceholder />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

function LessonPlaceholder() {
  return (
    <div className="card">
      <div className="page-header">
        <h1 className="page-title">Licao em Desenvolvimento</h1>
        <p className="page-subtitle">
          Esta licao ainda esta sendo escrita. Consulte os arquivos markdown em lessons/ para o conteudo.
        </p>
      </div>
    </div>
  );
}
