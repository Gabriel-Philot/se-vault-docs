import { Play } from 'lucide-react';
import { useState } from 'react';

const SUGESTOES = [
  'SELECT id, name, category, popularity, freshness FROM dishes ORDER BY popularity DESC LIMIT 20',
  'SELECT id, name, status FROM hall_tables ORDER BY id',
  'SELECT id, table_id, dish_name, quantity, status, created_at FROM hall_orders ORDER BY created_at DESC LIMIT 20',
  'SELECT id, hall_order_id, table_name_snapshot, dish_name, quantity, status, created_at FROM kitchen_tickets ORDER BY created_at DESC LIMIT 20',
  'SELECT status, COUNT(*) AS total FROM kitchen_tickets GROUP BY status ORDER BY status',
  'SELECT he.created_at, ht.name AS mesa, he.event_type, he.details FROM hall_events he JOIN hall_tables ht ON ht.id = he.table_id ORDER BY he.created_at DESC LIMIT 20',
];

export default function AdegaSql() {
  const [query, setQuery] = useState(SUGESTOES[0]);
  const [result, setResult] = useState<{ columns: string[]; rows: Array<Array<string | number | boolean | null>>; row_count: number } | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function execute() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/sql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      const data = await res.json();
      if (!res.ok) {
        setResult(null);
        setError(data?.detail || 'Erro ao executar SQL');
        return;
      }
      setResult(data);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4 rounded-xl border border-white/10 bg-[#1a120f] p-4 text-[#f3dfcf]">
      <h1 className="font-display text-4xl">Adega SQL</h1>
      <p className="text-sm text-[#d5bca7]">Consultas read-only para acompanhar salao, cozinha e integracao de pedidos.</p>
      <div className="flex flex-wrap gap-2">
        {SUGESTOES.map((sql) => (
          <button key={sql} onClick={() => setQuery(sql)} className="rounded-md bg-white/10 px-3 py-1 text-xs hover:bg-white/20">{sql.slice(0, 52)}...</button>
        ))}
      </div>
      <textarea value={query} onChange={(e) => setQuery(e.target.value)} rows={7} className="w-full rounded-md border border-white/20 bg-black/25 px-3 py-2 font-mono text-xs" />
      <button onClick={execute} className="inline-flex items-center gap-2 rounded-md bg-[#8f1f2e] px-4 py-2 text-sm font-semibold uppercase tracking-[0.12em] hover:bg-[#a22839]"><Play size={14} /> {loading ? 'Executando...' : 'Executar SQL'}</button>
      {error ? (
        <div className="rounded-lg border border-red-400/40 bg-red-950/40 p-3 text-sm text-red-200">{error}</div>
      ) : null}
      <div className="rounded-lg border border-white/15 bg-[#0f141a] p-3">
        {!result ? (
          <p className="text-sm text-[#ced9e4]">Nenhum resultado ainda.</p>
        ) : result.columns.length === 0 ? (
          <p className="text-sm text-[#ced9e4]">Consulta sem colunas retornadas.</p>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-[#b4c0cd]">Linhas retornadas: {result.row_count}</p>
            <div className="max-h-[420px] overflow-auto rounded-md border border-white/10">
              <table className="min-w-full border-collapse text-left text-xs text-[#d8e2ee]">
                <thead className="sticky top-0 bg-[#151e27]">
                  <tr>
                    {result.columns.map((column) => (
                      <th key={column} className="border-b border-white/10 px-3 py-2 font-semibold text-[#f3dfcf]">{column}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.rows.map((row, rowIndex) => (
                    <tr key={rowIndex} className="odd:bg-white/0 even:bg-white/[0.03]">
                      {row.map((value, colIndex) => (
                        <td key={`${rowIndex}-${colIndex}`} className="border-b border-white/5 px-3 py-2 align-top font-mono">
                          {value === null ? 'NULL' : String(value)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
