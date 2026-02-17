import { useState } from "react";
import Arena from "@/components/page4/Arena";
import CodeTerminal from "@/components/layout/CodeTerminal";
import ResetButton from "@/components/shared/ResetButton";

export default function Page4Polymorphism() {
  const [code, setCode] = useState("");
  const [resetKey, setResetKey] = useState(0);

  const handleReset = () => {
    setCode("");
    setResetKey((k) => k + 1);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <ResetButton onReset={handleReset} />
      </div>
      <Arena onCodeChange={setCode} resetKey={resetKey} />
      <CodeTerminal code={code} title="Polymorphism Code" />
    </div>
  );
}
