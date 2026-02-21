import React, { createContext, useContext, useState } from "react";

interface CompletionState {
  srp: boolean;      // all 3 methods placed
  ocp: boolean;      // all 4 branches extracted
  lsp: boolean;      // at least one card clicked
  isp: boolean;      // slider value > 70
  dip: boolean;      // invert button clicked
}

interface CompletionContextType {
  completion: CompletionState;
  setCompletion: React.Dispatch<React.SetStateAction<CompletionState>>;
}

const CompletionContext = createContext<CompletionContextType | null>(null);

export function CompletionProvider({ children }: { children: React.ReactNode }) {
  const [completion, setCompletion] = useState<CompletionState>({
    srp: false,
    ocp: false,
    lsp: false,
    isp: false,
    dip: false,
  });

  return (
    <CompletionContext.Provider value={{ completion, setCompletion }}>
      {children}
    </CompletionContext.Provider>
  );
}

export function useCompletion() {
  const ctx = useContext(CompletionContext);
  if (!ctx) throw new Error("useCompletion must be used within CompletionProvider");
  return ctx;
}
