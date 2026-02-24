import { useState } from "react";
import { useBytesCompare } from "../../hooks/useBytesCompare";
import { LoadingSpinner } from "../shared/LoadingSpinner";
import { GlassPanel } from "../shared/GlassPanel";
import { PageTitleBlock } from "../shared/PageTitleBlock";
import { AsciiTable } from "./AsciiTable";
import { EncodingCompare } from "./EncodingCompare";
import { MultiBaseDisplay } from "./MultiBaseDisplay";
import { SizeCompare } from "./SizeCompare";

const VALUE_TYPES = ["int", "float", "str", "char"] as const;
const ENCODINGS = ["utf-8", "ascii", "latin-1"] as const;

export function BytesExplorer() {
  const [value, setValue] = useState("42");
  const [valueType, setValueType] = useState("int");
  const [text, setText] = useState("Hello");
  const [encoding, setEncoding] = useState("utf-8");

  const { compare, encodeText, compareResult, encodeResult, loading, error } =
    useBytesCompare();

  const handleCompare = () => {
    compare({ value, type: valueType });
  };

  const handleEncode = () => {
    encodeText({ text, encoding });
  };

  return (
    <div className="space-y-6">
      <PageTitleBlock
        eyebrow="Panel 01"
        title="Bytes & Encoding Explorer"
        subtitle="Compare C/Python memory footprint, inspect text encodings, and navigate ASCII code points from control bytes to printable symbols."
        accent="cyan"
      />

      <GlassPanel accent="cyan" className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-ci-cyan">C vs Python Size Compare</h2>
          <span className="rounded-full border border-ci-cyan/30 bg-ci-cyan/10 px-2 py-0.5 text-[11px] font-mono text-ci-cyan">
            sizeof lens
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_auto_auto] lg:items-end">
          <div>
            <label className="mb-1 block text-xs text-ci-muted">Value</label>
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="w-full rounded-lg border border-ci-border bg-ci-surface px-3 py-2 font-mono text-sm text-ci-text transition-colors duration-200 focus:border-ci-cyan focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-ci-muted">Type</label>
            <select
              value={valueType}
              onChange={(e) => setValueType(e.target.value)}
              className="rounded-lg border border-ci-border bg-ci-surface px-3 py-2 text-sm text-ci-text focus:border-ci-cyan focus:outline-none"
            >
              {VALUE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={handleCompare}
            disabled={loading}
            className="rounded-lg border border-ci-cyan/30 bg-ci-cyan/20 px-4 py-2 text-sm font-medium text-ci-cyan transition-colors duration-200 hover:bg-ci-cyan/30 disabled:opacity-50"
          >
            {loading ? <LoadingSpinner size="sm" color="border-ci-cyan" /> : "Compare"}
          </button>
        </div>

        {error && (
          <div className="text-sm text-ci-red bg-ci-red/10 rounded p-2">
            {error}
          </div>
        )}

        {compareResult && <SizeCompare result={compareResult} />}
      </GlassPanel>

      <GlassPanel accent="cyan" className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-ci-cyan">Text Encoding</h2>
          <span className="rounded-full border border-ci-cyan/30 bg-ci-cyan/10 px-2 py-0.5 text-[11px] font-mono text-ci-cyan">
            bytes by charset
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_auto_auto] lg:items-end">
          <div>
            <label className="mb-1 block text-xs text-ci-muted">Text</label>
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full rounded-lg border border-ci-border bg-ci-surface px-3 py-2 font-mono text-sm text-ci-text transition-colors duration-200 focus:border-ci-cyan focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-ci-muted">
              Encoding
            </label>
            <select
              value={encoding}
              onChange={(e) => setEncoding(e.target.value)}
              className="rounded-lg border border-ci-border bg-ci-surface px-3 py-2 text-sm text-ci-text focus:border-ci-cyan focus:outline-none"
            >
              {ENCODINGS.map((e) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={handleEncode}
            disabled={loading}
            className="rounded-lg border border-ci-cyan/30 bg-ci-cyan/20 px-4 py-2 text-sm font-medium text-ci-cyan transition-colors duration-200 hover:bg-ci-cyan/30 disabled:opacity-50"
          >
            Encode
          </button>
        </div>

        {encodeResult && (
          <MultiBaseDisplay
            bytes={encodeResult.bytes_list}
            binary={encodeResult.binary}
            hex={encodeResult.hex}
          />
        )}

        <EncodingCompare result={encodeResult} text={text} encoding={encoding} />
      </GlassPanel>

      <GlassPanel accent="cyan" className="p-6">
        <AsciiTable />
      </GlassPanel>
    </div>
  );
}
