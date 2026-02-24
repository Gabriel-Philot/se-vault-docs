import { useState } from "react";
import { ASCII_PRINTABLE_START } from "../../lib/constants";

interface AsciiChar {
  code: number;
  char: string;
}

const CONTROL_NAMES = [
  "NUL", "SOH", "STX", "ETX", "EOT", "ENQ", "ACK", "BEL",
  "BS", "HT", "LF", "VT", "FF", "CR", "SO", "SI",
  "DLE", "DC1", "DC2", "DC3", "DC4", "NAK", "SYN", "ETB",
  "CAN", "EM", "SUB", "ESC", "FS", "GS", "RS", "US",
];

function getAsciiChar(code: number): AsciiChar {
  let char: string;
  if (code < ASCII_PRINTABLE_START) char = CONTROL_NAMES[code] ?? "CTL";
  else if (code === 127) char = "DEL";
  else char = String.fromCharCode(code);
  return { code, char };
}

export function AsciiTable() {
  const [selected, setSelected] = useState<number | null>(null);

  const chars = Array.from({ length: 128 }, (_, i) => getAsciiChar(i));

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-medium text-ci-muted">ASCII Table</h3>
        <span className="text-xs text-ci-dim">
          CTL values are non-printable control characters.
        </span>
      </div>

      {selected !== null && (
        <div className="flex flex-wrap gap-3 rounded-lg border border-ci-cyan/35 bg-linear-to-r from-ci-cyan/12 to-ci-cyan/4 px-3 py-2 text-xs font-mono shadow-sm shadow-ci-cyan/8">
          <span className="text-ci-cyan">Char: {chars[selected].char}</span>
          <span className="text-ci-text">Dec: {selected}</span>
          <span className="text-ci-cyan">Hex: 0x{selected.toString(16).padStart(2, "0")}</span>
          <span className="text-ci-green">Bin: {selected.toString(2).padStart(8, "0")}</span>
        </div>
      )}

      <div
        className="grid gap-1 font-mono text-xs"
        style={{ gridTemplateColumns: "repeat(16, minmax(0, 1fr))" }}
      >
        {chars.map(({ code, char }) => {
          const isControl = code < ASCII_PRINTABLE_START || code === 127;
          const isSelected = selected === code;
          const baseClass =
            "rounded border border-ci-border px-1 py-1.5 text-center leading-none transition-all duration-150 hover:-translate-y-0.5";
          const defaultClass =
            "bg-ci-surface text-ci-text hover:bg-ci-border/70 hover:border-ci-muted/50";
          const controlClass =
            "bg-ci-red/8 text-ci-red/80 hover:bg-ci-red/14 hover:border-ci-red/35";
          const selectedClass =
            "bg-ci-cyan/18 text-ci-cyan border-ci-cyan/70 ring-1 ring-ci-cyan/45 shadow-sm shadow-ci-cyan/25";

          return (
            <button
              key={code}
              onClick={() => setSelected(code)}
              className={
                isSelected
                  ? baseClass + " " + selectedClass
                  : isControl
                    ? baseClass + " " + controlClass
                    : baseClass + " " + defaultClass
              }
              title={`${code} (0x${code.toString(16).padStart(2, "0")})`}
              aria-pressed={isSelected}
            >
              <span className={isControl ? "text-[10px]" : ""}>{char}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
