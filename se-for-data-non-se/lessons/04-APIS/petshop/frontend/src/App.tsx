import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import PetManager from './pages/PetManager';
import ApiExplorer from './pages/ApiExplorer';
import DatabaseExplorer from './pages/DatabaseExplorer';
import Architecture from './pages/Architecture';
import CodeLab from './pages/CodeLab';
import CodeModels from './pages/CodeModels';
import CodeCrud from './pages/CodeCrud';
import CodeActions from './pages/CodeActions';
import CodeCache from './pages/CodeCache';
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
          <Route path="code/models" element={<CodeModels />} />
          <Route path="code/crud" element={<CodeCrud />} />
          <Route path="code/actions" element={<CodeActions />} />
          <Route path="code/cache" element={<CodeCache />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
