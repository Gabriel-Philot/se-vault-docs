import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function CodeShell() {
  return (
    <div className="app-layout zone-kitchen">
      <Sidebar />
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
