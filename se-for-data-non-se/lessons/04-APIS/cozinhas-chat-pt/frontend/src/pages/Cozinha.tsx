import { Check, ChefHat, Search, Send, Utensils } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

type KitchenTicket = {
  id: number;
  hall_order_id: number;
  table_id: number;
  table_name_snapshot: string;
  dish_name: string;
  quantity: number;
  notes?: string | null;
  status: 'aberto' | 'preparando' | 'pronto' | 'servido';
  created_at: string;
};

type ColumnConfig = {
  status: KitchenTicket['status'];
  label: string;
  action?: 'start' | 'ready' | 'serve';
  actionLabel?: string;
};

const COLUMNS: ColumnConfig[] = [
  { status: 'aberto', label: 'Fila', action: 'start', actionLabel: 'Preparar' },
  { status: 'preparando', label: 'Preparando', action: 'ready', actionLabel: 'Despachar' },
  { status: 'pronto', label: 'Pronto', action: 'serve', actionLabel: 'Servir' },
  { status: 'servido', label: 'Servido' },
];

function badgeClass(status: KitchenTicket['status']) {
  if (status === 'aberto') return 'bg-[#2a1f17] text-[#f2d3b0] border-[#b57b45]/45';
  if (status === 'preparando') return 'bg-[#2a2417] text-[#f0ddaa] border-[#cc9f46]/45';
  if (status === 'pronto') return 'bg-[#1f2b24] text-[#cdebd9] border-[#4ca172]/40';
  return 'bg-[#1f2530] text-[#bfcbe0] border-[#6a7c9b]/45';
}

export default function Cozinha() {
  const bgUrl = "/images/ui/cozinha-bg.jpg?v=20260220-2";
  const [tickets, setTickets] = useState<KitchenTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  async function fetchTickets() {
    try {
      const res = await fetch('/api/kitchen/tickets?limit=180');
      const data = await res.json();
      setTickets(data.tickets || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchTickets();
    const timer = setInterval(() => {
      void fetchTickets();
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const filtered = useMemo(() => {
    const text = search.trim().toLowerCase();
    if (!text) return tickets;
    return tickets.filter((ticket) => (
      ticket.dish_name.toLowerCase().includes(text)
      || ticket.table_name_snapshot.toLowerCase().includes(text)
      || String(ticket.hall_order_id).includes(text)
      || String(ticket.id).includes(text)
    ));
  }, [tickets, search]);

  const grouped = useMemo(() => {
    return {
      aberto: filtered.filter((ticket) => ticket.status === 'aberto'),
      preparando: filtered.filter((ticket) => ticket.status === 'preparando'),
      pronto: filtered.filter((ticket) => ticket.status === 'pronto'),
      servido: filtered.filter((ticket) => ticket.status === 'servido').slice(0, 12),
    };
  }, [filtered]);

  async function move(ticket: KitchenTicket, action: 'start' | 'ready' | 'serve') {
    await fetch(`/api/kitchen/tickets/${ticket.id}/${action}`, { method: 'POST' });
    await fetchTickets();
  }

  return (
    <div
      className="relative min-h-[calc(100vh-8rem)] overflow-hidden rounded-2xl border border-white/10 bg-cover bg-center"
      style={{
        backgroundImage:
          `linear-gradient(140deg, rgba(22,53,73,0.42), rgba(10,20,30,0.72)), url('${bgUrl}')`,
      }}
    >
      <div className="absolute inset-0 bg-[#111925]/58" />
      <div className="relative z-10 p-5 text-[#e9eef4]">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-5xl">Estacao de Comando</h1>
            <p className="text-sm text-[#b9c6d3]">Controle de tickets por estagio, sem poluicao visual de cards com foto.</p>
          </div>
          <button onClick={() => void fetchTickets()} className="rounded-md border border-white/25 bg-white/10 px-3 py-2 text-xs uppercase tracking-[0.14em] hover:bg-white/20">Atualizar</button>
        </div>

        <div className="mb-4 inline-flex items-center gap-2 rounded-md border border-white/20 bg-black/25 px-3 py-2">
          <Search size={13} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por prato, mesa, pedido ou ticket"
            className="w-72 bg-transparent text-xs outline-none placeholder:text-[#95a7ba]"
          />
        </div>

        {loading ? <p className="mb-3">Carregando tickets...</p> : null}

        <div className="grid gap-3 xl:grid-cols-4">
          {COLUMNS.map((column) => (
            <section key={column.status} className="rounded-xl border border-white/10 bg-[#0f141a]/76 p-3 backdrop-blur-sm">
              <div className="mb-2 flex items-center justify-between">
                <h2 className="font-display text-2xl tracking-[0.05em]">{column.label}</h2>
                <span className="rounded-full bg-white/10 px-2 py-1 text-xs">{grouped[column.status].length}</span>
              </div>

              <div className="max-h-[67vh] space-y-2 overflow-y-auto pr-1">
                {grouped[column.status].map((ticket) => (
                  <article key={ticket.id} className="relative rounded-lg border border-[#e6d3bf]/35 bg-[#f1e6d8] p-3 text-[#2a1d13] shadow-sm">
                    <div className="pointer-events-none absolute left-3 right-3 top-1 flex justify-between opacity-45">
                      {Array.from({ length: 18 }).map((_, i) => (
                        <span key={i} className="h-1.5 w-1.5 rounded-full bg-[#b7a08a]" />
                      ))}
                    </div>

                    <div className="mb-2 mt-2 flex items-center justify-between gap-2">
                      <span className={`rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] ${badgeClass(ticket.status)}`}>
                        {ticket.status}
                      </span>
                      <span className="font-mono text-[10px] text-[#5a4638]">Ticket #{ticket.id}</span>
                    </div>

                    <p className="font-display text-4xl leading-none">{ticket.table_name_snapshot}</p>
                    <div className="my-2 border-b border-dashed border-[#c6b19c]" />
                    <p className="text-lg font-semibold leading-tight">{ticket.quantity}x {ticket.dish_name}</p>
                    <p className="mt-1 text-[11px] text-[#574334]">Pedido #{ticket.hall_order_id}</p>
                    {ticket.notes ? <p className="mt-1 text-[11px] text-[#5d4638]">Obs: {ticket.notes}</p> : null}

                    {column.action ? (
                      <button
                        onClick={() => void move(ticket, column.action as 'start' | 'ready' | 'serve')}
                        className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-md bg-[#8f1f2e] px-2 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-white hover:bg-[#a22839]"
                      >
                        {column.action === 'start' ? <ChefHat size={12} /> : null}
                        {column.action === 'ready' ? <Send size={12} /> : null}
                        {column.action === 'serve' ? <Utensils size={12} /> : null}
                        {column.actionLabel}
                      </button>
                    ) : (
                      <div className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-md border border-emerald-800/35 bg-emerald-100 px-2 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-900">
                        <Check size={12} /> concluido
                      </div>
                    )}
                  </article>
                ))}

                {grouped[column.status].length === 0 ? (
                  <div className="rounded-md border border-dashed border-white/20 p-3 text-center text-xs text-[#9fb0c3]">Sem tickets neste estado.</div>
                ) : null}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
