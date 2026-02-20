import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Salon from './pages/Salon';
import LaCarte from './pages/LaCarte';
import LaCuisine from './pages/LaCuisine';
import LeCellier from './pages/LeCellier';
import LePlan from './pages/LePlan';
import LaBrigade from './pages/LaBrigade';
import CodeModels from './pages/CodeModels';
import CodeCrud from './pages/CodeCrud';
import CodeActions from './pages/CodeActions';
import CodeCache from './pages/CodeCache';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Salon />} />
          <Route path="carte" element={<LaCarte />} />
          <Route path="cuisine" element={<LaCuisine />} />
          <Route path="cellier" element={<LeCellier />} />
          <Route path="plan" element={<LePlan />} />
          <Route path="brigade" element={<LaBrigade />} />
          <Route path="code/models" element={<CodeModels />} />
          <Route path="code/crud" element={<CodeCrud />} />
          <Route path="code/actions" element={<CodeActions />} />
          <Route path="code/cache" element={<CodeCache />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
