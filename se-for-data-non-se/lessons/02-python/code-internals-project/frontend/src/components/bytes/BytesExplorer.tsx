import { useState } from "react";
import { useBytesCompare } from "../../hooks/useBytesCompare";
import { LoadingSpinner } from "../shared/LoadingSpinner";
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
      {/* Compare Section */}
      <section className="bg-ci-panel rounded-xl border border-ci-border p-6 space-y-4">
        <h2 className="text-lg font-semibold text-ci-cyan">
          C vs Python Size Compare
        </h2>

        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="block text-xs text-ci-muted mb-1">Value</label>
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="w-full px-3 py-2 bg-ci-surface border border-ci-border rounded-lg text-ci-text font-mono text-sm focus:outline-none focus:border-ci-cyan transition-colors duration-200"
            />
          </div>
          <div>
            <label className="block text-xs text-ci-muted mb-1">Type</label>
            <select
              value={valueType}
              onChange={(e) => setValueType(e.target.value)}
              className="px-3 py-2 bg-ci-surface border border-ci-border rounded-lg text-ci-text text-sm focus:outline-none focus:border-ci-cyan"
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
            className="px-4 py-2 bg-ci-cyan/20 text-ci-cyan border border-ci-cyan/30 rounded-lg text-sm font-medium hover:bg-ci-cyan/30 transition-colors duration-200 disabled:opacity-50"
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
      </section>

      {/* Encoding Section */}
      <section className="bg-ci-panel rounded-xl border border-ci-border p-6 space-y-4">
        <h2 className="text-lg font-semibold text-ci-cyan">Text Encoding</h2>

        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="block text-xs text-ci-muted mb-1">Text</label>
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full px-3 py-2 bg-ci-surface border border-ci-border rounded-lg text-ci-text font-mono text-sm focus:outline-none focus:border-ci-cyan transition-colors duration-200"
            />
          </div>
          <div>
            <label className="block text-xs text-ci-muted mb-1">
              Encoding
            </label>
            <select
              value={encoding}
              onChange={(e) => setEncoding(e.target.value)}
              className="px-3 py-2 bg-ci-surface border border-ci-border rounded-lg text-ci-text text-sm focus:outline-none focus:border-ci-cyan"
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
            className="px-4 py-2 bg-ci-cyan/20 text-ci-cyan border border-ci-cyan/30 rounded-lg text-sm font-medium hover:bg-ci-cyan/30 transition-colors duration-200 disabled:opacity-50"
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
      </section>

      {/* ASCII Table */}
      <section className="bg-ci-panel rounded-xl border border-ci-border p-6">
        <AsciiTable />
      </section>
    </div>
  );
}
