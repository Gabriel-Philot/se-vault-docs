type Props = {
  file: string;
  snippet: string;
};

export default function CodeRefBlock({ file, snippet }: Props) {
  return (
    <div className="code-ref">
      <div className="code-ref-topbar">
        <div className="code-ref-dots" aria-hidden="true">
          <span className="dot dot-red" />
          <span className="dot dot-amber" />
          <span className="dot dot-green" />
        </div>
        <div className="code-ref-file">{file}</div>
      </div>
      <div className="code-ref-body">
        <pre>{snippet}</pre>
      </div>
    </div>
  );
}
