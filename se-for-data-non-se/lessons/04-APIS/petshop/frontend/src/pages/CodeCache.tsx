import { Code2 } from 'lucide-react';

export default function CodeCache() {
  const cacheCode = `class CacheService:
    def __init__(self):
        self.client: Optional[redis.Redis] = None

    async def connect(self):
        self.client = redis.from_url(REDIS_URL, decode_responses=True)

    async def disconnect(self):
        if self.client:
            await self.client.close()

    async def get(self, key: str) -> Optional[dict]:
        value = await self.client.get(key)
        if value:
            return json.loads(value)
        return None

    async def set(self, key: str, value: dict, ttl: int = 5):
        await self.client.setex(key, ttl, json.dumps(value, default=str))

    async def delete(self, pattern: str):
        keys = await self.client.keys(pattern)
        if keys:
            await self.client.delete(*keys)


def cache_response(ttl: int = 5):
    def decorator(func: Callable):
        @functools.wraps(func)
        async def wrapper(*args, **kwargs):
            cache_key = generate_cache_key(func.__name__, **kwargs)
            
            cached = await cache.get(cache_key)
            if cached is not None:
                cached["cached"] = True
                return cached
            
            result = await func(*args, **kwargs)
            # Serializa e salva no cache
            await cache.set(cache_key, result_copy, ttl)
            return result
        return wrapper
    return decorator


async def invalidate_pets_cache():
    await cache.delete("list_pets:*")
    await cache.delete("get_stats:*")`;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">
          <Code2 size={28} />
          Code: Cache
        </h1>
        <p className="page-subtitle">Padrão de cache com Redis para otimização de performance</p>
      </div>

      <div className="card">
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          <span className="badge badge-red">Conecta: Redis</span>
        </div>
        
        <pre className="code-block">
          <code>{cacheCode}</code>
        </pre>
        
        <div className="lesson-box" style={{ marginTop: '1rem' }}>
          <h4>O que faz</h4>
          <p>
            <strong>CacheService:</strong> Cliente Redis assíncrono com métodos get/set/delete.
            <code>set()</code> usa TTL (time-to-live) para expiração automática.
          </p>
          <p>
            <strong>@cache_response(ttl=5):</strong> Decorador que cacheia resposta da função por 5 segundos.
            Gera chave única baseada nos parâmetros. Retorna dados do cache se existir.
          </p>
          <p>
            <strong>invalidate_pets_cache():</strong> Remove todas as chaves que começam com 
            "list_pets:" e "get_stats:". Chamada após qualquer modificação (create, update, delete).
          </p>
          <p>
            Padrão <strong>Cache-Aside:</strong> Aplicação verifica cache antes do banco, 
            e invalida após escritas.
          </p>
        </div>
      </div>
    </div>
  );
}
