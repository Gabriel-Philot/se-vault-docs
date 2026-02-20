import { AnimatePresence, motion } from 'framer-motion';
import { Clock3, Plus, SendHorizonal, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

type HallOrder = {
  id: number;
  dish_name: string;
  quantity: number;
  notes?: string | null;
  status: string;
  created_at: string;
};

type HallTable = {
  id: number;
  name: string;
  seats: number;
  status: 'livre' | 'ocupada' | 'aguardando_prato';
  orders: HallOrder[];
};

const STATUS_STYLE: Record<HallTable['status'], string> = {
  livre: 'border-emerald-300/50 bg-emerald-200/10 text-emerald-100',
  ocupada: 'border-amber-300/50 bg-amber-200/10 text-amber-100',
  aguardando_prato: 'border-orange-300/50 bg-orange-200/10 text-orange-100',
};

export default function Salao() {
  const bgUrl = "/images/ui/salao-bg.jpg?v=20260220-2";
  const [tables, setTables] = useState<HallTable[]>([]);
  const [selected, setSelected] = useState<HallTable | null>(null);
  const [loading, setLoading] = useState(true);
  const [dishName, setDishName] = useState('');
  const [qty, setQty] = useState(1);

  async function fetchTables(selectId?: number) {
    const res = await fetch('/api/hall/tables');
    const data = await res.json();
    const rows = data.tables || [];
    setTables(rows);
    if (selectId) {
      const updated = rows.find((t: HallTable) => t.id === selectId) || null;
      setSelected(updated);
    }
  }

  useEffect(() => {
    fetchTables().finally(() => setLoading(false));
  }, []);

  const stats = useMemo(() => {
    const livre = tables.filter((t) => t.status === 'livre').length;
    const ocupada = tables.filter((t) => t.status === 'ocupada').length;
    const aguardando = tables.filter((t) => t.status === 'aguardando_prato').length;
    return { livre, ocupada, aguardando };
  }, [tables]);

  async function addOrder() {
    if (!selected || !dishName.trim()) return;
    await fetch(`/api/hall/tables/${selected.id}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dish_name: dishName, quantity: qty }),
    });
    setDishName('');
    setQty(1);
    await fetchTables(selected.id);
  }

  async function releaseOrder() {
    if (!selected) return;
    await fetch(`/api/hall/tables/${selected.id}/release`, { method: 'POST' });
    await fetchTables(selected.id);
  }

  return (
    <div
      className="relative min-h-[calc(100vh-8rem)] overflow-hidden rounded-2xl border border-white/10 bg-cover bg-center"
      style={{
        backgroundImage:
          `linear-gradient(120deg, rgba(130,85,40,0.35), rgba(35,28,21,0.65)), url('${bgUrl}')`,
      }}
    >
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative z-10 p-6">
        <div className="mb-6 flex flex-wrap gap-3">
          <span className="rounded-md border border-white/20 bg-black/30 px-3 py-1 text-sm text-white">Mesas livres: {stats.livre}</span>
          <span className="rounded-md border border-white/20 bg-black/30 px-3 py-1 text-sm text-white">Ocupadas: {stats.ocupada}</span>
          <span className="rounded-md border border-white/20 bg-black/30 px-3 py-1 text-sm text-white">Aguardando prato: {stats.aguardando}</span>
        </div>

        {loading ? (
          <p className="text-white">Carregando...</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-5">
            {tables.map((table) => (
              <button
                key={table.id}
                onClick={() => setSelected(table)}
                className={`rounded-xl border p-4 text-left shadow-warm backdrop-blur-sm transition hover:scale-[1.02] ${STATUS_STYLE[table.status]}`}
              >
                <p className="font-display text-2xl">{table.name}</p>
                <p className="text-sm opacity-90">{table.status.replace('_', ' ')}</p>
                <p className="mt-2 text-xs">{table.seats} lugares</p>
              </button>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {selected && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-20 bg-black/50"
              onClick={() => setSelected(null)}
            />
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 240 }}
              className="absolute right-0 top-0 z-30 h-full w-full max-w-md border-l border-white/20 bg-[#1b120f]/80 p-6 text-[#f5e7d8] backdrop-blur-xl"
            >
              <div className="mb-5 flex items-center justify-between">
                <h2 className="font-display text-4xl">{selected.name}</h2>
                <button onClick={() => setSelected(null)} className="rounded-md border border-white/25 p-1 hover:bg-white/10"><X size={18} /></button>
              </div>
              <p className="mb-3 text-sm uppercase tracking-[0.14em] text-[#dcb996]">Pedidos em aberto</p>

              <div className="max-h-[48vh] space-y-2 overflow-y-auto rounded-lg border border-white/15 bg-black/25 p-3">
                {selected.orders.length === 0 ? (
                  <p className="text-sm text-[#d7c0ac]">Nenhum pedido em aberto.</p>
                ) : (
                  selected.orders.map((order) => (
                    <div key={order.id} className="rounded-md border border-white/10 bg-black/20 p-3">
                      <p className="font-medium">{order.quantity}x {order.dish_name}</p>
                      {order.notes ? <p className="mt-1 text-sm opacity-80">{order.notes}</p> : null}
                    </div>
                  ))
                )}
              </div>

              <div className="mt-5 space-y-3">
                <div className="rounded-lg border border-white/15 bg-black/25 p-3">
                  <label className="mb-1 block text-xs uppercase tracking-[0.12em] text-[#dcb996]">Novo pedido</label>
                  <input
                    value={dishName}
                    onChange={(e) => setDishName(e.target.value)}
                    placeholder="Nome do prato"
                    className="mb-2 w-full rounded-md border border-white/20 bg-black/30 px-3 py-2 text-sm outline-none"
                  />
                  <input
                    value={qty}
                    onChange={(e) => setQty(Number(e.target.value) || 1)}
                    type="number"
                    min={1}
                    className="w-full rounded-md border border-white/20 bg-black/30 px-3 py-2 text-sm outline-none"
                  />
                </div>

                <button onClick={addOrder} className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#8f1f2e] px-4 py-3 text-sm font-semibold uppercase tracking-[0.14em] hover:bg-[#a22839]">
                  <Plus size={16} /> Adicionar pedido
                </button>
                <button onClick={releaseOrder} className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#dcb996]/60 bg-[#2d2018] px-4 py-3 text-sm font-semibold uppercase tracking-[0.14em] hover:bg-[#3a271c]">
                  <Clock3 size={16} /> Liberar para cozinha
                </button>
                <button onClick={() => fetchTables(selected.id)} className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/20 bg-transparent px-4 py-3 text-sm font-semibold uppercase tracking-[0.14em] hover:bg-white/10">
                  <SendHorizonal size={16} /> Atualizar
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
