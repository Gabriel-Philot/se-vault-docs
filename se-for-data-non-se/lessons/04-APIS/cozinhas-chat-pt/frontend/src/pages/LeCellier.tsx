import { Database, Play } from 'lucide-react';
import { useState } from 'react';

const QUERIES = [
  { label: 'Tous les plats', query: 'SELECT * FROM dishes' },
  { label: 'Top popularite', query: 'SELECT name, popularity FROM dishes ORDER BY popularity DESC' },
  { label: 'Par categorie', query: 'SELECT category, COUNT(*) as total FROM dishes GROUP BY category' },
  { label: 'Journal activite', query: 'SELECT * FROM activity_log ORDER BY created_at DESC LIMIT 20' },
];

interface QueryResult {
  columns: string[];
  rows: Array<Record<string, unknown>>;
}

export default function LeCellier() {
  const [query, setQuery] = useState('SELECT * FROM dishes');
  const [result, setResult] = useState<QueryResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function executeQuery() {
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const res = await fetch('/api/sql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.detail || 'Erreur SQL');
        return;
      }

      const rows = data.rows.map((row: unknown[]) => {
        const obj: Record<string, unknown> = {};
        data.columns.forEach((col: string, idx: number) => {
          obj[col] = row[idx];
        });
        return obj;
      });

      setResult({ columns: data.columns, rows });
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title"><Database size={26} /> Le Cellier</h1>
        <p className="page-subtitle">Exploration SQL read-only de la base de donnees.</p>
      </div>

      <div className="card" style={{ marginBottom: '1rem' }}>
        <div className="card-header">
          <h3 className="card-title">Requete SQL</h3>
        </div>

        <div style={{ marginBottom: '0.8rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {QUERIES.map((q) => (
            <button key={q.label} className="btn btn-secondary btn-sm" onClick={() => setQuery(q.query)}>{q.label}</button>
          ))}
        </div>

        <textarea className="form-input" rows={6} style={{ fontFamily: 'var(--font-mono)' }} value={query} onChange={(event) => setQuery(event.target.value)} />

        <div style={{ marginTop: '0.8rem' }}>
          <button className="btn btn-primary" onClick={executeQuery} disabled={loading || !query.trim()}>
            <Play size={14} /> {loading ? 'Execution...' : 'Executer'}
          </button>
        </div>
      </div>

      {error && (
        <div className="card" style={{ borderLeft: '2px solid #c81e1e', marginBottom: '1rem' }}>
          <h3 className="card-title" style={{ color: '#c81e1e' }}>Erreur</h3>
          <pre className="code-block">{error}</pre>
        </div>
      )}

      {result && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Resultats</h3>
            <span className="page-subtitle">{result.rows.length} lignes</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>{result.columns.map((column) => <th key={column}>{column}</th>)}</tr>
              </thead>
              <tbody>
                {result.rows.map((row, idx) => (
                  <tr key={idx}>
                    {result.columns.map((column) => <td key={`${idx}-${column}`}>{String(row[column] ?? 'NULL')}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
