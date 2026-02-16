import { useState } from "react";
import BlueprintBuilder from "@/components/page1/BlueprintBuilder";
import InteractiveExecutor from "@/components/page1/InteractiveExecutor";
import ResetButton from "@/components/shared/ResetButton";

export default function Page1Classes() {
  const [code, setCode] = useState("");
  const [resetKey, setResetKey] = useState(0);
  const [resetting, setResetting] = useState(false);

  const handleReset = async () => {
    setResetting(true);
    try {
      await fetch("/api/class/reset", { method: "POST" });
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
      <BlueprintBuilder
        onCodeChange={setCode}
        resetKey={resetKey}
        renderBeforeInstantiate={<InteractiveExecutor classCode={code} />}
      />
    </div>
  );
}
