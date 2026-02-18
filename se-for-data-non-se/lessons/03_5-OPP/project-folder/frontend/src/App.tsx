import { Navigate, Route, Routes } from "react-router-dom";
import AppShell from "./components/layout/AppShell";
import LabPage from "./pages/LabPage";
import LearnPage from "./pages/LearnPage";

export default function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Navigate to="/lab" replace />} />
        <Route path="/lab" element={<LabPage />} />
        <Route path="/learn" element={<LearnPage />} />
      </Routes>
    </AppShell>
  );
}
