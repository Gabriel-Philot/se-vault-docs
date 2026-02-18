import { useEffect, useMemo, useState } from "react";

type Product = { id: string; name: string; price: number };
type Order = {
  id: string;
  user_id: string;
  country: string;
  channel: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  status: "CREATED" | "PAYMENT_PENDING" | "COMPLETED";
  created_at: string;
  updated_at: string;
};
type Analytics = {
  completed_orders: number;
  completed_revenue: number;
  by_product: Record<string, number>;
  by_country: Record<string, number>;
  by_channel: Record<string, number>;
  route_threshold: number;
};

type StreamEvent = {
  event_type: string;
  timestamp: string;
  data: Record<string, unknown>;
};

const API_BASE = import.meta.env.VITE_API_URL || "";

async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<T>;
}

export default function LabPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [events, setEvents] = useState<StreamEvent[]>([]);

  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [userId, setUserId] = useState("user-001");
  const [country, setCountry] = useState("BR");
  const [channel, setChannel] = useState("web");
  const [routeThreshold, setRouteThreshold] = useState(300);

  const selectedProduct = useMemo(
    () => products.find((p) => p.id === productId) ?? null,
    [products, productId]
  );

  async function loadAll() {
    const [p, o, a] = await Promise.all([
      api<Product[]>("/api/products"),
      api<Order[]>("/api/orders/list"),
      api<Analytics>("/api/analytics/summary"),
    ]);
    setProducts(p);
    if (!productId && p.length) setProductId(p[0].id);
    setOrders(o);
    setAnalytics(a);
    setRouteThreshold(a.route_threshold);
  }

  useEffect(() => {
    loadAll().catch(console.error);
    const source = new EventSource(`${API_BASE}/api/stream/events`);
    source.onmessage = (evt) => {
      const parsed = JSON.parse(evt.data) as StreamEvent;
      setEvents((old) => [parsed, ...old].slice(0, 120));
      if (["order_created", "order_status_changed", "aggregated", "sim_reset"].includes(parsed.event_type)) {
        loadAll().catch(console.error);
      }
    };
    return () => source.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function createOrder() {
    await api("/api/orders/create", {
      method: "POST",
      body: JSON.stringify({ product_id: productId, quantity, user_id: userId, country, channel }),
    });
  }

  async function replayDuplicate() {
    await api("/api/orders/replay-last-event", { method: "POST" });
  }

  async function applyThreshold() {
    await api("/api/pipeline/config", {
      method: "POST",
      body: JSON.stringify({ route_threshold: routeThreshold }),
    });
    await loadAll();
  }

  async function resetAll() {
    await api("/api/sim/reset", { method: "POST" });
    setEvents([]);
    await loadAll();
  }

  return (
    <div className="page-wrap">
      <header className="hero-compact">
        <div>
          <h2>Live Data Ops Lab</h2>
          <p>Create fake purchases and observe the full CDC + pattern pipeline in real time.</p>
        </div>
        <div className="hero-actions">
          <button onClick={replayDuplicate}>Replay Last Event</button>
          <button onClick={resetAll}>Reset Simulation</button>
        </div>
      </header>

      <div className="pattern-tags">
        <a href="/learn#strategy">Strategy</a>
        <a href="/learn#factory">Factory</a>
        <a href="/learn#adapter">Adapter</a>
        <a href="/learn#observer">Observer</a>
        <a href="/learn#idempotent">Idempotent</a>
        <a href="/learn#router">Router/Translator/Aggregator</a>
      </div>

      <main className="grid">
        <section className="panel">
          <h3>User Purchases</h3>
          <div className="stack">
            <label>
              Product
              <select value={productId} onChange={(e) => setProductId(e.target.value)}>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} - ${p.price.toFixed(2)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Quantity
              <input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value || 1))}
              />
            </label>
            <label>
              User ID
              <input value={userId} onChange={(e) => setUserId(e.target.value)} />
            </label>
            <label>
              Country
              <select value={country} onChange={(e) => setCountry(e.target.value)}>
                <option value="BR">BR</option>
                <option value="US">US</option>
                <option value="DE">DE</option>
              </select>
            </label>
            <label>
              Channel
              <select value={channel} onChange={(e) => setChannel(e.target.value)}>
                <option value="web">web</option>
                <option value="app">app</option>
                <option value="partner">partner</option>
              </select>
            </label>
            <div className="quote">
              Current order total: ${((selectedProduct?.price ?? 0) * quantity).toFixed(2)}
            </div>
            <button onClick={createOrder}>Create Fake Purchase</button>
          </div>

          <h4>Orders</h4>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Product</th>
                  <th>Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td>{o.id.slice(0, 8)}</td>
                    <td>{o.product_name}</td>
                    <td>${o.total_price.toFixed(2)}</td>
                    <td>
                      <span className={`badge ${o.status.toLowerCase()}`}>{o.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="panel">
          <h3>Flow Timeline (CDC + Pipeline)</h3>
          <div className="timeline">
            {events.map((e, idx) => (
              <div key={`${e.timestamp}-${idx}`} className="event-row">
                <div className="event-meta">
                  <span className="etype">{e.event_type}</span>
                  <span>{new Date(e.timestamp).toLocaleTimeString()}</span>
                </div>
                <pre>{JSON.stringify(e.data, null, 2)}</pre>
              </div>
            ))}
          </div>
        </section>

        <section className="panel">
          <h3>Analytics View</h3>
          <div className="metric-grid">
            <div className="metric">
              <span>Completed Orders</span>
              <strong>{analytics?.completed_orders ?? 0}</strong>
            </div>
            <div className="metric">
              <span>Completed Revenue</span>
              <strong>${(analytics?.completed_revenue ?? 0).toFixed(2)}</strong>
            </div>
          </div>

          <h4>Routing Config</h4>
          <div className="stack">
            <label>
              High-value threshold
              <input
                type="number"
                min={1}
                value={routeThreshold}
                onChange={(e) => setRouteThreshold(Number(e.target.value || 1))}
              />
            </label>
            <button onClick={applyThreshold}>Apply Threshold</button>
          </div>

          <h4>By Product</h4>
          <pre className="stats-pre">{JSON.stringify(analytics?.by_product ?? {}, null, 2)}</pre>

          <h4>By Country</h4>
          <pre className="stats-pre">{JSON.stringify(analytics?.by_country ?? {}, null, 2)}</pre>

          <h4>By Channel</h4>
          <pre className="stats-pre">{JSON.stringify(analytics?.by_channel ?? {}, null, 2)}</pre>
        </section>
      </main>
    </div>
  );
}
