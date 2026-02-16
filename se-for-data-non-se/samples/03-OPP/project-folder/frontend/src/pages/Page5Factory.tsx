import { useState } from "react";
import PipelineBuilder from "@/components/page5/PipelineBuilder";
import CodeTerminal from "@/components/layout/CodeTerminal";

export default function Page5Factory() {
  const [code, setCode] = useState("");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <PipelineBuilder onCodeChange={setCode} />
      <CodeTerminal code={code} title="Pipeline Code" />
    </div>
  );
}
