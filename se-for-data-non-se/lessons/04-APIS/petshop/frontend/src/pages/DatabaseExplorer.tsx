import { useState } from 'react';
import { Database, Play, Loader2 } from 'lucide-react';

const EXAMPLE_QUERIES = [
  { label: 'Show all pets', query: 'SELECT * FROM pets' },
  { label: 'Count by species', query: 'SELECT species, COUNT(*) as count FROM pets GROUP BY species' },
  { label: 'Happy pets', query: "SELECT * FROM pets WHERE happiness > 50" },
  { label: 'Hungry pets', query: "SELECT * FROM pets WHERE hunger_level > 50" },
];

interface QueryResult {
  columns: string[];
  rows: Record<string, unknown>[];
}

export default function DatabaseExplorer() {
  const [query, setQuery] = useState('SELECT * FROM pets');
  const [result, setResult] = useState<QueryResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function executeQuery() {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/sql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.detail || 'Query failed');
        return;
      }

      const transformedRows = data.rows.map((row: (string | number | null)[]) => {
        const obj: Record<string, unknown> = {};
        data.columns.forEach((col: string, idx: number) => {
          obj[col] = row[idx];
        });
        return obj;
      });

      setResult({ columns: data.columns, rows: transformedRows });
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  function handleExampleClick(exampleQuery: string) {
    setQuery(exampleQuery);
    setError(null);
    setResult(null);
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">
          <Database size={28} />
          Database Explorer
        </h1>
        <p className="page-subtitle">
          Execute SQL queries directly on the database
        </p>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-header">
          <h3 className="card-title">SQL Query</h3>
        </div>

        <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {EXAMPLE_QUERIES.map((ex) => (
            <button
              key={ex.label}
              className="btn"
              style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
              onClick={() => handleExampleClick(ex.query)}
            >
              {ex.label}
            </button>
          ))}
        </div>

        <div className="form-group">
          <textarea
            className="form-input"
            rows={5}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}
            placeholder="Enter SQL query..."
          />
        </div>

        <button
          className="btn btn-primary"
          onClick={executeQuery}
          disabled={loading || !query.trim()}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          {loading ? <Loader2 size={16} className="spin" /> : <Play size={16} />}
          {loading ? 'Executing...' : 'Execute'}
        </button>
      </div>

      {error && (
        <div className="card" style={{ marginBottom: '1.5rem', borderLeft: '4px solid #dc2626' }}>
          <div className="card-header">
            <h3 className="card-title" style={{ color: '#dc2626' }}>Error</h3>
          </div>
          <pre style={{ 
            background: '#fef2f2', 
            color: '#dc2626', 
            padding: '1rem', 
            borderRadius: '0.5rem',
            overflow: 'auto',
            fontFamily: 'monospace',
            fontSize: '0.875rem'
          }}>
            {error}
          </pre>
        </div>
      )}

      {result && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Results</h3>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              {result.rows.length} row{result.rows.length !== 1 ? 's' : ''}
            </span>
          </div>

          {result.rows.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ 
                width: '100%', 
                borderCollapse: 'collapse',
                fontSize: '0.875rem'
              }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--pet-brown-200)' }}>
                    {result.columns.map((col) => (
                      <th 
                        key={col}
                        style={{ 
                          textAlign: 'left', 
                          padding: '0.75rem',
                          background: 'var(--pet-brown-100)',
                          fontWeight: 600,
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.rows.map((row, i) => (
                    <tr 
                      key={i}
                      style={{ 
                        borderBottom: '1px solid var(--pet-brown-100)',
                        background: i % 2 === 0 ? 'white' : 'var(--pet-brown-50)'
                      }}
                    >
                      {result.columns.map((col) => (
                        <td 
                          key={col}
                          style={{ 
                            padding: '0.75rem',
                            fontFamily: typeof row[col] === 'number' ? 'monospace' : 'inherit'
                          }}
                        >
                          {row[col] === null ? (
                            <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>NULL</span>
                          ) : String(row[col])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>
              Query returned no results
            </p>
          )}
        </div>
      )}
    </div>
  );
}
