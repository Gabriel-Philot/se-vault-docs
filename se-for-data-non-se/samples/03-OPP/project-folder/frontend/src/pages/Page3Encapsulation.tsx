import { useState } from "react";
import VaultPuzzle from "@/components/page3/VaultPuzzle";
import CodeTerminal from "@/components/layout/CodeTerminal";

export default function Page3Encapsulation() {
  const [code, setCode] = useState("");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <VaultPuzzle onCodeChange={setCode} />
      <CodeTerminal code={code} title="Encapsulation Code" />
    </div>
  );
}
