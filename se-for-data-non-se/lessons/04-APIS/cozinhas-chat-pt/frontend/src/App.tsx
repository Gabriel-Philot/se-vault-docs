import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import CodeTopNav from './components/layout/CodeTopNav';
import MainShell from './components/layout/MainShell';
import ApiExplorer from './pages/ApiExplorer';
import AdegaSql from './pages/AdegaSql';
import Arquitetura from './pages/Arquitetura';
import BrigadaCode from './pages/BrigadaCode';
import Cardapio from './pages/Cardapio';
import Cozinha from './pages/Cozinha';
import CodeActions from './pages/CodeActions';
import CodeCache from './pages/CodeCache';
import CodeCrud from './pages/CodeCrud';
import CodeModels from './pages/CodeModels';
import Salao from './pages/Salao';
import Welcome from './pages/Welcome';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainShell />}>
          <Route index element={<Welcome />} />
          <Route path="salao" element={<Salao />} />
          <Route path="cardapio" element={<Cardapio />} />
          <Route path="cozinha" element={<Cozinha />} />
          <Route path="api-explorer" element={<ApiExplorer />} />
          <Route path="adega-sql" element={<AdegaSql />} />
          <Route path="arquitetura" element={<Arquitetura />} />
          <Route path="brigada-code" element={<BrigadaCode />} />
          <Route path="codigo" element={<CodeTopNav />}>
            <Route index element={<Navigate to="/codigo/models" replace />} />
            <Route path="models" element={<CodeModels />} />
            <Route path="crud" element={<CodeCrud />} />
            <Route path="acoes" element={<CodeActions />} />
            <Route path="cache" element={<CodeCache />} />
          </Route>

          <Route path="carte" element={<Navigate to="/cardapio" replace />} />
          <Route path="cuisine" element={<Navigate to="/cozinha" replace />} />
          <Route path="cellier" element={<Navigate to="/adega-sql" replace />} />
          <Route path="plan" element={<Navigate to="/arquitetura" replace />} />
          <Route path="brigade" element={<Navigate to="/brigada-code" replace />} />
        </Route>

        <Route path="/code/models" element={<Navigate to="/codigo/models" replace />} />
        <Route path="/code/crud" element={<Navigate to="/codigo/crud" replace />} />
        <Route path="/code/actions" element={<Navigate to="/codigo/acoes" replace />} />
        <Route path="/code/cache" element={<Navigate to="/codigo/cache" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
