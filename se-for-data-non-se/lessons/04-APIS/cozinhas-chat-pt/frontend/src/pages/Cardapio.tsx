import { Star } from 'lucide-react';
import { useEffect, useState } from 'react';

type Dish = {
  id: number;
  name: string;
  category: string;
  price: number;
  preparation_time: number;
  image_url?: string | null;
  freshness: number;
  popularity: number;
  status: string;
};

const CATEGORIES = ['entree', 'plat', 'dessert', 'fromage'];

function dishFallback(name: string) {
  const map: Record<string, string> = {
    'Filet de Boeuf Rossini': '/images/dishes/filet-boeuf-rossini.jpg',
    "Saumon a l'Oseille": '/images/dishes/saumon-oseille.jpg',
    "Soupe a l'Oignon": '/images/dishes/soupe-oignon.jpg',
    'Fondant au Chocolat': '/images/dishes/fondant-chocolat.jpg',
    'Plateau de Fromages': '/images/dishes/plateau-fromages.jpg',
  };
  return map[name] || '/images/ui/empty-plate.png';
}

function renderStars(score: number) {
  const stars = Math.max(1, Math.min(5, Math.round(score / 20)));
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, index) => {
        const active = index < stars;
        return (
          <Star
            key={index}
            size={12}
            className={active ? 'text-amber-300' : 'text-white/25'}
            fill={active ? 'currentColor' : 'none'}
          />
        );
      })}
    </div>
  );
}

export default function Cardapio() {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('');
  const [selectedDish, setSelectedDish] = useState<Dish | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    void fetchDishes();
  }, [activeCategory]);

  async function fetchDishes() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ sort_by: 'name', order: 'asc', limit: '100' });
      if (activeCategory) params.append('category', activeCategory);
      const res = await fetch(`/api/dishes?${params.toString()}`);
      const data = await res.json();
      setDishes(data.dishes || []);
    } finally {
      setLoading(false);
    }
  }

  async function orderDish() {
    if (!selectedDish) return;
    setSending(true);
    try {
      const res = await fetch('/api/hall/orders/from-menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dish_id: selectedDish.id, quantity, notes: notes || null }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback(data.detail || 'Nao foi possivel criar o pedido.');
        return;
      }
      setFeedback(`Pedido enviado para ${data.table_name} (ticket #${data.kitchen_ticket_id}).`);
      setSelectedDish(null);
      setQuantity(1);
      setNotes('');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-white/10 bg-[#1a120f] p-4 text-[#f3dfcf]">
        <h1 className="font-display text-4xl">Cardapio</h1>
        <p className="mt-1 text-sm text-[#d5bca7]">Selecione um prato e envie o pedido. O sistema aloca mesa livre automaticamente.</p>

        <div className="mt-4 flex flex-wrap gap-2">
          <button onClick={() => setActiveCategory('')} className={`rounded-full px-3 py-1 text-sm ${activeCategory === '' ? 'bg-[#f1d8be] text-[#2b1710]' : 'bg-white/10'}`}>Todos</button>
          {CATEGORIES.map((category) => (
            <button key={category} onClick={() => setActiveCategory(category)} className={`rounded-full px-3 py-1 text-sm ${activeCategory === category ? 'bg-[#f1d8be] text-[#2b1710]' : 'bg-white/10'}`}>{category}</button>
          ))}
        </div>

        {feedback ? <p className="mt-3 rounded-md border border-emerald-300/35 bg-emerald-400/10 px-3 py-2 text-sm text-emerald-200">{feedback}</p> : null}
      </div>

      {loading ? <p className="text-[#f3dfcf]">Carregando...</p> : null}

      <div className="grid gap-4 lg:grid-cols-2">
        {dishes.map((dish) => (
          <article key={dish.id} className="overflow-hidden rounded-xl border border-white/10 bg-[#1a120f] text-[#f3dfcf]">
            <img
              src={dish.image_url || dishFallback(dish.name)}
              alt={dish.name}
              className="h-56 w-full object-cover"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = '/images/ui/empty-plate.png';
              }}
            />
            <div className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-display text-3xl">{dish.name}</h3>
                  <p className="text-sm text-[#d5bca7]">{dish.preparation_time} min  •  € {dish.price.toFixed(2)}</p>
                </div>
                <span className="rounded-full bg-[#6f4b32] px-2 py-1 text-xs uppercase">{dish.category}</span>
              </div>

              <div className="mt-4 flex items-center justify-between text-xs text-[#d5bca7]">
                <span>Frescor</span>
                {renderStars(dish.freshness)}
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-[#d5bca7]">
                <span>Popularidade</span>
                {renderStars(dish.popularity)}
              </div>

              <button
                onClick={() => {
                  setSelectedDish(dish);
                  setFeedback('');
                }}
                className="mt-4 w-full rounded-md bg-[#8f1f2e] px-3 py-2 text-sm font-semibold uppercase tracking-[0.12em] hover:bg-[#a22839]"
              >
                Pedir
              </button>
            </div>
          </article>
        ))}
      </div>

      {selectedDish ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setSelectedDish(null)}>
          <div className="w-full max-w-md rounded-xl border border-white/20 bg-[#1a120f] p-4 text-[#f3dfcf]" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display text-3xl">Confirmar pedido</h3>
            <p className="mt-1 text-sm text-[#d5bca7]">{selectedDish.name}</p>

            <div className="mt-4 space-y-3">
              <input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value) || 1)}
                className="w-full rounded-md border border-white/20 bg-black/25 px-3 py-2"
              />
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Observacoes (opcional)"
                className="w-full rounded-md border border-white/20 bg-black/25 px-3 py-2 text-sm"
              />
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button className="rounded-md border border-white/20 px-4 py-2" onClick={() => setSelectedDish(null)}>Cancelar</button>
              <button className="rounded-md bg-[#8f1f2e] px-4 py-2" onClick={orderDish} disabled={sending}>{sending ? 'Enviando...' : 'Confirmar pedido'}</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
