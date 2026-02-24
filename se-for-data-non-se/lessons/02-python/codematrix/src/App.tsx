/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { TopNav } from "./components/TopNav";
import { Landing } from "./pages/Landing";
import { BytesExplorer } from "./pages/BytesExplorer";
import { ShellExplorer } from "./pages/ShellExplorer";
import { CompilerExplorer } from "./pages/CompilerExplorer";
import { MemoryVisualizer } from "./pages/MemoryVisualizer";

export default function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col relative z-0">
        <TopNav />
        <main className="flex-1 relative z-10">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/bytes" element={<BytesExplorer />} />
            <Route path="/shell" element={<ShellExplorer />} />
            <Route path="/compiler" element={<CompilerExplorer />} />
            <Route path="/memory" element={<MemoryVisualizer />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

