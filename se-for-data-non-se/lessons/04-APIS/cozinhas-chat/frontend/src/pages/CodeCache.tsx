import { Code2, DatabaseZap, TimerReset } from 'lucide-react';

export default function CodeCache() {
  const code = `def cache_response(ttl: int = 5):
    def decorator(func: Callable):
        async def wrapper(*args, **kwargs):
            cache_key = generate_cache_key(func.__name__, **kwargs)
            cached = await cache.get(cache_key)
            if cached is not None:
                cached["cached"] = True
                return cached
            result = await func(*args, **kwargs)
            await cache.set(cache_key, result_copy, ttl)
            return result

async def invalidate_dishes_cache():
    await cache.delete("list_dishes:*")
    await cache.delete("get_stats:*")`;

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title"><Code2 size={26} /> Code: Cache</h1>
        <p className="page-subtitle">Pattern cache-aside Redis pour accelerer les lectures repetitives.</p>
      </div>

      <div className="code-page-grid">
        <section className="code-panel">
          <div className="code-panel-head">
            <span className="code-panel-title">services/cache.py</span>
            <span className="badge badge-success"><DatabaseZap size={12} /> Redis</span>
          </div>
          <pre className="code-block"><code>{code}</code></pre>
        </section>

        <aside className="code-note">
          <h3 className="card-title" style={{ marginBottom: '0.5rem' }}>Estrategia</h3>
          <p className="page-subtitle" style={{ marginBottom: '0.6rem' }}>Leitura: a API tenta Redis antes do PostgreSQL.</p>
          <p className="page-subtitle" style={{ marginBottom: '0.6rem' }}>Escrita: invalida imediatamente as chaves de lista e estatisticas.</p>
          <div className="lesson-box"><TimerReset size={14} style={{ marginRight: 6 }} /> TTL curto para manter o conteudo fresco sem sobrecarregar o banco.</div>
        </aside>
      </div>
    </div>
  );
}
