import { Route, Routes } from "react-router-dom";

import { MainShell } from "./components/layout/MainShell";
import { ArchitecturePage } from "./pages/Architecture";
import { DashboardPage } from "./pages/Dashboard";
import { LibraryPage } from "./pages/Library";
import { MissionsPage } from "./pages/Missions";
import { WelcomePage } from "./pages/Welcome";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<WelcomePage />} />
      <Route element={<MainShell />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/missoes" element={<MissionsPage />} />
        <Route path="/biblioteca" element={<LibraryPage />} />
        <Route path="/arquitetura" element={<ArchitecturePage />} />
      </Route>
    </Routes>
  );
}
