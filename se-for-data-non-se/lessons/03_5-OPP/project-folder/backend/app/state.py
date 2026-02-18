from __future__ import annotations

import asyncio
from dataclasses import dataclass, field
from datetime import UTC, datetime
from typing import Any


def utc_now_iso() -> str:
    return datetime.now(UTC).isoformat()


@dataclass
class Product:
    id: str
    name: str
    price: float


@dataclass
class Order:
    id: str
    user_id: str
    country: str
    channel: str
    product_id: str
    product_name: str
    quantity: int
    unit_price: float
    total_price: float
    status: str
    created_at: str
    updated_at: str


@dataclass
class Analytics:
    completed_orders: int = 0
    completed_revenue: float = 0.0
    by_product: dict[str, float] = field(default_factory=dict)
    by_country: dict[str, float] = field(default_factory=dict)
    by_channel: dict[str, float] = field(default_factory=dict)


class TaxStrategy:
    def apply(self, amount: float) -> float:
        return amount


class BrTaxStrategy(TaxStrategy):
    def apply(self, amount: float) -> float:
        return round(amount * 1.17, 2)


class UsTaxStrategy(TaxStrategy):
    def apply(self, amount: float) -> float:
        return round(amount * 1.08, 2)


class DefaultTaxStrategy(TaxStrategy):
    def apply(self, amount: float) -> float:
        return amount


class TaxStrategyFactory:
    @staticmethod
    def create(country: str) -> TaxStrategy:
        if country.upper() == "BR":
            return BrTaxStrategy()
        if country.upper() == "US":
            return UsTaxStrategy()
        return DefaultTaxStrategy()


class DebeziumAdapter:
    @staticmethod
    def to_canonical(envelope: dict[str, Any]) -> dict[str, Any]:
        payload = envelope["payload"]
        after = payload["after"]
        return {
            "event_id": envelope["event_id"],
            "order_id": after["id"],
            "status": after["status"],
            "country": after["country"],
            "channel": after["channel"],
            "product_name": after["product_name"],
            "total_price": after["total_price"],
            "ts_ms": payload["ts_ms"],
        }


class Sink:
    def write(self, _: dict[str, Any]) -> None:
        raise NotImplementedError


class AuditSink(Sink):
    def write(self, _: dict[str, Any]) -> None:
        return


class WarehouseSink(Sink):
    def write(self, _: dict[str, Any]) -> None:
        return


class SinkFactory:
    _registry = {
        "audit": AuditSink,
        "warehouse": WarehouseSink,
    }

    @classmethod
    def create(cls, sink_type: str) -> Sink:
        sink_cls = cls._registry.get(sink_type)
        if sink_cls is None:
            raise ValueError(f"unknown sink_type={sink_type}")
        return sink_cls()


class AppState:
    def __init__(self) -> None:
        self.products: list[Product] = [
            Product(id="p1", name="Wireless Mouse", price=39.9),
            Product(id="p2", name="Mechanical Keyboard", price=129.0),
            Product(id="p3", name="4K Monitor", price=499.0),
            Product(id="p4", name="USB-C Dock", price=179.5),
        ]
        self.orders: dict[str, Order] = {}
        self.analytics = Analytics()
        self.route_threshold = 300.0

        self._lock = asyncio.Lock()
        self._subscribers: set[asyncio.Queue[dict[str, Any]]] = set()
        self._tasks: set[asyncio.Task[Any]] = set()

        self.processed_event_ids: set[str] = set()
        self.last_envelope: dict[str, Any] | None = None

    async def subscribe(self) -> asyncio.Queue[dict[str, Any]]:
        q: asyncio.Queue[dict[str, Any]] = asyncio.Queue()
        async with self._lock:
            self._subscribers.add(q)
        return q

    async def unsubscribe(self, q: asyncio.Queue[dict[str, Any]]) -> None:
        async with self._lock:
            self._subscribers.discard(q)

    async def publish(self, event_type: str, data: dict[str, Any]) -> None:
        event = {
            "event_type": event_type,
            "timestamp": utc_now_iso(),
            "data": data,
        }
        async with self._lock:
            subs = list(self._subscribers)
        for q in subs:
            await q.put(event)

    async def reset(self) -> None:
        async with self._lock:
            for t in list(self._tasks):
                t.cancel()
            self._tasks.clear()
            self.orders.clear()
            self.analytics = Analytics()
            self.processed_event_ids.clear()
            self.last_envelope = None
        await self.publish("sim_reset", {"message": "simulation state reset"})

    async def register_task(self, task: asyncio.Task[Any]) -> None:
        async with self._lock:
            self._tasks.add(task)

        def _on_done(done_task: asyncio.Task[Any]) -> None:
            self._tasks.discard(done_task)

        task.add_done_callback(_on_done)


state = AppState()
