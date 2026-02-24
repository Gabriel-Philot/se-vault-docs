import type { BytesEncodeResponse } from "../../lib/types";

interface EncodingCompareProps {
  result: BytesEncodeResponse | null;
  text: string;
  encoding: string;
}

export function EncodingCompare({
  result,
  text,
  encoding,
}: EncodingCompareProps) {
  if (!result) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-ci-muted">
        Encoding: {encoding.toUpperCase()} for &quot;{text}&quot;
      </h3>

      <div className="flex flex-wrap gap-1">
        {result.bytes_list.map((byte, i) => {
          const isMultibyte =
            encoding === "utf-8" && result.hex[i]?.length > 2;
          return (
            <div
              key={i}
              className={
                isMultibyte
                  ? "flex flex-col items-center rounded border border-ci-purple/30 bg-ci-purple/10 p-2 text-xs font-mono"
                  : "flex flex-col items-center rounded border border-ci-border bg-ci-surface p-2 text-xs font-mono"
              }
            >
              <span className="text-ci-cyan">{result.hex[i]}</span>
              <span className="text-ci-text">{byte}</span>
              <span className="text-ci-green text-[10px]">
                {result.binary[i]}
              </span>
            </div>
          );
        })}
      </div>

      <div className="text-xs text-ci-muted">
        Total:{" "}
        <span className="font-mono text-ci-text">
          {result.total_bytes} bytes
        </span>
      </div>
    </div>
  );
}
