import { useState } from "react";
import VaultPuzzle from "@/components/page3/VaultPuzzle";
import CodeTerminal from "@/components/layout/CodeTerminal";
import ResetButton from "@/components/shared/ResetButton";

export default function Page3Encapsulation() {
  const [code, setCode] = useState("");
  const [resetKey, setResetKey] = useState(0);
  const [resetting, setResetting] = useState(false);

  const handleReset = async () => {
    setResetting(true);
    try {
      await fetch("/api/encapsulation/reset", { method: "POST" });
      setCode("");
      setResetKey((k) => k + 1);
    } catch {
      // ignore
    } finally {
      setResetting(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <ResetButton onReset={handleReset} loading={resetting} />
      </div>
      <VaultPuzzle onCodeChange={setCode} resetKey={resetKey} />
      <CodeTerminal code={code} title="Encapsulation Code" />
    </div>
  );
}
