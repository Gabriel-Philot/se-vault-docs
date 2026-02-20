import { Send } from 'lucide-react';
import { useEffect, useState } from 'react';

type Endpoint = {
  method: string;
  path: string;
  descricao: string;
  body?: Record<string, unknown>;
};

const ENDPOINTS: Endpoint[] = [
  { method: 'GET', path: '/dishes?limit=10&offset=0', descricao: 'Listar pratos' },
  { method: 'POST', path: '/hall/orders/from-menu', descricao: 'Criar pedido via cardapio', body: { dish_id: 1, quantity: 2, notes: 'Sem cebola' } },
  { method: 'GET', path: '/hall/tables', descricao: 'Mesas do salao' },
  { method: 'GET', path: '/hall/activity', descricao: 'Eventos do salao' },
  { method: 'GET', path: '/kitchen/tickets', descricao: 'Fila da cozinha' },
  { method: 'POST', path: '/kitchen/tickets/1/start', descricao: 'Mover ticket para preparando' },
  { method: 'POST', path: '/kitchen/tickets/1/ready', descricao: 'Mover ticket para pronto' },
  { method: 'POST', path: '/kitchen/tickets/1/serve', descricao: 'Marcar ticket servido' },
  { method: 'GET', path: '/kitchen/activity', descricao: 'Eventos da cozinha' },
  { method: 'POST', path: '/sql', descricao: 'SQL read-only', body: { query: 'SELECT * FROM kitchen_tickets LIMIT 5' } },
];

export default function ApiExplorer() {
  const [current, setCurrent] = useState<Endpoint>(ENDPOINTS[0]);
  const [path, setPath] = useState(ENDPOINTS[0].path);
  const [body, setBody] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setPath(current.path);
    setBody(current.body ? JSON.stringify(current.body, null, 2) : '');
  }, [current]);

  async function run() {
    setLoading(true);
    try {
      const init: RequestInit = { method: current.method, headers: { 'Content-Type': 'application/json' } };
      if (body.trim() && current.method !== 'GET') init.body = body;
      const res = await fetch(`/api${path}`, init);
      const data = await res.json().catch(() => ({}));
      setResponse(JSON.stringify({ status: res.status, data }, null, 2));
    } catch (error) {
      setResponse(String(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
      <aside className="rounded-xl border border-white/10 bg-[#1a120f] p-4 text-[#f3dfcf]">
        <h2 className="mb-3 font-display text-3xl">API Explorer</h2>
        <div className="space-y-2">
          {ENDPOINTS.map((endpoint) => (
            <button
              key={`${endpoint.method}-${endpoint.path}`}
              onClick={() => setCurrent(endpoint)}
              className={`w-full rounded-md border px-3 py-2 text-left text-sm ${endpoint === current ? 'border-[#d2a978] bg-[#2f1c15]' : 'border-white/10 bg-black/25'}`}
            >
              <p className="font-semibold">{endpoint.method} {endpoint.path}</p>
              <p className="text-xs text-[#d5bca7]">{endpoint.descricao}</p>
            </button>
          ))}
        </div>
      </aside>

      <section className="space-y-4 rounded-xl border border-white/10 bg-[#1a120f] p-4 text-[#f3dfcf]">
        <h3 className="font-display text-3xl">Requisicao</h3>
        <div className="grid gap-3">
          <input value={path} onChange={(e) => setPath(e.target.value)} className="w-full rounded-md border border-white/20 bg-black/25 px-3 py-2 text-sm" />
          <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={8} className="w-full rounded-md border border-white/20 bg-black/25 px-3 py-2 font-mono text-xs" placeholder="Body JSON" />
          <button onClick={run} className="inline-flex w-fit items-center gap-2 rounded-md bg-[#8f1f2e] px-4 py-2 text-sm font-semibold uppercase tracking-[0.12em] hover:bg-[#a22839]"><Send size={14} /> {loading ? 'Enviando...' : 'Executar'}</button>
        </div>

        <div>
          <h3 className="mb-2 font-display text-2xl">Resposta</h3>
          <pre className="max-h-[420px] overflow-auto rounded-lg border border-white/15 bg-[#0f141a] p-3 font-mono text-xs text-[#ced9e4]">{response || 'Execute uma chamada para ver o retorno.'}</pre>
        </div>
      </section>
    </div>
  );
}
