import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function Layout() {
  const location = useLocation();
  const isKitchenZone =
    location.pathname.startsWith('/cuisine')
    || location.pathname.startsWith('/plan')
    || location.pathname.startsWith('/brigade')
    || location.pathname.startsWith('/code/');

  return (
    <div className={`app-layout ${isKitchenZone ? 'zone-kitchen' : ''}`}>
      <Sidebar />
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
