import { useState } from "react";
import { AppShell } from "./components/layout/AppShell";
import { LandingPage } from "./components/landing/LandingPage";
import { BytesExplorer } from "./components/bytes/BytesExplorer";
import { ShellSimulator } from "./components/shell/ShellSimulator";
import { CompileView } from "./components/compiler/CompileView";
import { StackHeapVisualizer } from "./components/memory/StackHeapVisualizer";
import type { PanelId } from "./lib/types";

export default function App() {
  const [hasEntered, setHasEntered] = useState(false);
  const [activePanel, setActivePanel] = useState<PanelId>("bytes");

  if (!hasEntered) {
    return (
      <LandingPage
        onEnter={(panel) => {
          setActivePanel(panel);
          setHasEntered(true);
        }}
      />
    );
  }

  return (
    <AppShell
      activePanel={activePanel}
      onPanelChange={(panel) => {
        setActivePanel(panel);
        setHasEntered(true);
      }}
      onGoStart={() => setHasEntered(false)}
      isStartActive={false}
    >
      {activePanel === "bytes" && <BytesExplorer />}
      {activePanel === "shell" && <ShellSimulator />}
      {activePanel === "compiler" && <CompileView />}
      {activePanel === "memory" && <StackHeapVisualizer />}
    </AppShell>
  );
}
