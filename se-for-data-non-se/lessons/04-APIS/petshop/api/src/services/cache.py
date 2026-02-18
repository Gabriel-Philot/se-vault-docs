import os
import json
import hashlib
import functools
from typing import Optional, Any, Callable
import redis.asyncio as redis

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")


class CacheService:
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

    async def flush(self):
        await self.client.flushdb()


cache = CacheService()


def generate_cache_key(prefix: str, **kwargs) -> str:
    excluded_keys = {"session"}
    filtered_kwargs = {k: v for k, v in kwargs.items() if k not in excluded_keys}
    sorted_params = sorted(filtered_kwargs.items())
    param_str = str(sorted_params)
    hash_obj = hashlib.md5(param_str.encode())
    return f"{prefix}:{hash_obj.hexdigest()}"


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
            if isinstance(result, dict):
                result_copy = {}
                for key, value in result.items():
                    if hasattr(value, "model_dump"):
                        result_copy[key] = value.model_dump()
                    elif isinstance(value, list):
                        result_copy[key] = [
                            item.model_dump() if hasattr(item, "model_dump") else item
                            for item in value
                        ]
                    else:
                        result_copy[key] = value
                result_copy["cached"] = False
                await cache.set(cache_key, result_copy, ttl)
                result["cached"] = False

            return result

        return wrapper

    return decorator


async def invalidate_pets_cache():
    await cache.delete("list_pets:*")
    await cache.delete("get_stats:*")
