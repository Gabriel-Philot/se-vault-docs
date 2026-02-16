import { useState } from "react";
import BlueprintBuilder from "@/components/page1/BlueprintBuilder";
import CodeTerminal from "@/components/layout/CodeTerminal";

export default function Page1Classes() {
  const [code, setCode] = useState("");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <BlueprintBuilder onCodeChange={setCode} />
      <CodeTerminal code={code} />
    </div>
  );
}
