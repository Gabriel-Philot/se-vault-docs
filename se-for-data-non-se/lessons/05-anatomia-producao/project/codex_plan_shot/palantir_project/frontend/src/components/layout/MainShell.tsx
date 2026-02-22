import { Outlet } from "react-router-dom";

import { TopNav } from "./TopNav";

export function MainShell() {
  return (
    <div className="min-h-screen bg-pal-bg text-pal-text">
      <TopNav />
      <main className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">
        <Outlet />
      </main>
    </div>
  );
}
