import { Check, ChevronDown, Copy } from 'lucide-react';
import { useState } from 'react';

interface CodeTerminalProps {
  title?: string;
  request: {
    method: string;
    url: string;
    body?: object | null;
  };
  response: {
    status: number;
    data: unknown;
    duration: number;
  };
}

export default function CodeTerminal({ title = 'Terminal API', request, response }: CodeTerminalProps) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(JSON.stringify(response.data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <section className={`code-terminal ${expanded ? 'expanded' : ''}`}>
      <button className="code-terminal-header" onClick={() => setExpanded(!expanded)}>
        <span>{title}</span>
        <ChevronDown size={16} className="code-terminal-toggle" />
      </button>
      <div className="code-terminal-content">
        <div className="code-terminal-toolbar">
          <span className="status-badge status-200">{response.status}</span>
          <span className="code-terminal-time">{response.duration}ms</span>
          <button className="icon-btn" onClick={handleCopy}>
            {copied ? <Check size={14} /> : <Copy size={14} />}
          </button>
        </div>
        <pre className="code-block">{request.method} {request.url}
{request.body ? `\n\n${JSON.stringify(request.body, null, 2)}` : ''}</pre>
        <pre className="code-block">{JSON.stringify(response.data, null, 2)}</pre>
      </div>
    </section>
  );
}
