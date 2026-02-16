import { useState } from "react";
import Arena from "@/components/page4/Arena";
import CodeTerminal from "@/components/layout/CodeTerminal";

export default function Page4Polymorphism() {
  const [code, setCode] = useState("");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <Arena onCodeChange={setCode} />
      <CodeTerminal code={code} title="Polymorphism Code" />
    </div>
  );
}
