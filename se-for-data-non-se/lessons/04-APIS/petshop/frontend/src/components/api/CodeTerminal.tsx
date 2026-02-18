import { useState } from 'react';
import { ChevronDown, Copy, Check } from 'lucide-react';

interface CodeTerminalProps {
  title?: string;
  request: {
    method: string;
    url: string;
    headers?: Record<string, string>;
    body?: object | null;
  };
  response: {
    status: number;
    statusText?: string;
    data: unknown;
    duration: number;
  };
  defaultExpanded?: boolean;
}

export default function CodeTerminal({
  title = 'API Terminal',
  request,
  response,
  defaultExpanded = false,
}: CodeTerminalProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [copied, setCopied] = useState(false);

  const isSuccess = response.status >= 200 && response.status < 300;

  async function handleCopy() {
    const text = JSON.stringify(response.data, null, 2);
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className={`code-terminal ${expanded ? 'expanded' : ''}`}>
      <div 
        className="code-terminal-header"
        onClick={() => setExpanded(!expanded)}
      >
        <span className="code-terminal-title">
          📡 {title}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {expanded && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleCopy();
              }}
              style={{
                background: 'none',
                border: 'none',
                color: copied ? '#4ade80' : '#888',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
            </button>
          )}
          <ChevronDown 
            size={16} 
            className="code-terminal-toggle"
          />
        </div>
      </div>
      
      <div className="code-terminal-content">
        <div className="code-terminal-inner">
          <div className="code-terminal-request">
            <div className="code-terminal-label">Request</div>
            <div>
              <span className="code-terminal-method">{request.method}</span>{' '}
              <span className="code-terminal-url">{request.url}</span>
            </div>
            {request.body && (
              <pre className="code-terminal-body">
                {JSON.stringify(request.body, null, 2)}
              </pre>
            )}
          </div>
          
          <div className="code-terminal-response">
            <div className="code-terminal-label">
              Response
              <span 
                className={`code-terminal-status ${isSuccess ? 'success' : 'error'}`}
                style={{ marginLeft: '0.5rem' }}
              >
                {response.status}
              </span>
              <span className="code-terminal-time">
                {' '}{response.duration}ms
              </span>
            </div>
            <pre style={{ margin: 0 }}>
              {JSON.stringify(response.data, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
