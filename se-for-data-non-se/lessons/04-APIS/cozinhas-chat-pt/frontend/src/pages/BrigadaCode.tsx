import { Play, RotateCcw } from 'lucide-react';
import { useState } from 'react';

const EXERCICIOS = [
  {
    id: 1,
    titulo: 'Listar pratos',
    codigo: 'import httpx\nres = httpx.get("http://api:8000/dishes")\nprint(res.status_code)\nprint(res.json().get("total"))',
  },
  {
    id: 2,
    titulo: 'Criar prato',
    codigo: 'import httpx\npayload = {"name":"Polvo Grelhado","category":"plat","price":59,"preparation_time":28}\nres = httpx.post("http://api:8000/dishes", json=payload)\nprint(res.status_code)\nprint(res.json())',
  },
  {
    id: 3,
    titulo: 'Acompanhar salão',
    codigo: 'import httpx\nres = httpx.get("http://api:8000/hall/tables")\nprint(res.status_code)\nprint(len(res.json().get("tables", [])))',
  },
  {
    id: 4,
    titulo: 'Ver pedidos da cozinha',
    codigo: 'import httpx\nres = httpx.get("http://api:8000/kitchen/tickets?limit=20")\nprint(res.status_code)\ndata = res.json().get("tickets", [])\nprint("tickets:", len(data))\nfor t in data[:5]:\n    print(f\'#{t.get("id")} mesa={t.get("table_id")} status={t.get("status")} prato={t.get("dish_name")}\')',
  },
  {
    id: 5,
    titulo: 'Criar pedido e rastrear',
    codigo: 'import httpx\n\npayload = {"dish_id": 1, "quantity": 1, "notes": "pedido via brigada"}\ncreated = httpx.post("http://api:8000/hall/orders/from-menu", json=payload)\nprint("create:", created.status_code)\nprint(created.json())\n\nhall = httpx.get("http://api:8000/hall/tables").json().get("tables", [])\nwaiting = [t for t in hall if t.get("status") == "awaiting_dish"]\nprint("mesas aguardando:", len(waiting))\n\nkitchen = httpx.get("http://api:8000/kitchen/tickets?limit=20").json().get("tickets", [])\nprint("tickets cozinha:", len(kitchen))\nfor t in kitchen[:3]:\n    print(f\'ticket #{t.get("id")} mesa={t.get("table_id")} status={t.get("status")}\')',
  },
];

export default function BrigadaCode() {
  const [selecionado, setSelecionado] = useState(EXERCICIOS[0]);
  const [codigo, setCodigo] = useState(EXERCICIOS[0].codigo);
  const [saida, setSaida] = useState('');
  const [running, setRunning] = useState(false);

  async function run() {
    setRunning(true);
    try {
      const res = await fetch('/executor/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: codigo }),
      });
      const data = await res.json();
      setSaida(data.success ? data.output || '(sem saida)' : `Erro:\n${data.error}`);
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
      <aside className="rounded-xl border border-white/10 bg-[#121923] p-4 text-[#e8eef5]">
        <h2 className="mb-2 font-display text-3xl">Brigada Code</h2>
        <div className="space-y-2">
          {EXERCICIOS.map((ex) => (
            <button key={ex.id} onClick={() => { setSelecionado(ex); setCodigo(ex.codigo); }} className={`w-full rounded-md border px-3 py-2 text-left text-sm ${ex.id === selecionado.id ? 'border-[#d4641a] bg-[#1d2733]' : 'border-white/10 bg-[#0f141a]'}`}>
              {ex.id}. {ex.titulo}
            </button>
          ))}
        </div>
      </aside>
      <section className="space-y-3 rounded-xl border border-white/10 bg-[#121923] p-4 text-[#e8eef5]">
        <textarea value={codigo} onChange={(e) => setCodigo(e.target.value)} rows={14} className="w-full rounded-md border border-white/20 bg-[#0f141a] px-3 py-2 font-mono text-xs" />
        <div className="flex gap-2">
          <button onClick={run} className="inline-flex items-center gap-2 rounded-md bg-[#d4641a] px-4 py-2 text-sm font-semibold uppercase tracking-[0.12em] hover:bg-[#e27734]"><Play size={14} /> {running ? 'Executando...' : 'Executar'}</button>
          <button onClick={() => setCodigo(selecionado.codigo)} className="inline-flex items-center gap-2 rounded-md border border-white/20 px-4 py-2 text-sm uppercase tracking-[0.12em] hover:bg-white/10"><RotateCcw size={14} /> Resetar</button>
        </div>
        <pre className="max-h-[260px] overflow-auto rounded-lg border border-white/10 bg-[#0f141a] p-3 font-mono text-xs">{saida || 'Clique em Executar.'}</pre>
      </section>
    </div>
  );
}
