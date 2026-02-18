from __future__ import annotations

import asyncio
import json
import uuid
from datetime import UTC, datetime

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse

from app.routers.models import CreateOrderRequest, PipelineConfigRequest
from app.state import DebeziumAdapter, SinkFactory, TaxStrategyFactory, state, utc_now_iso

router = APIRouter(prefix="/api")


def _json_default(value):
    if hasattr(value, "__dict__"):
        return value.__dict__
    raise TypeError(f"unsupported type {type(value)}")


async def _emit_cdc_for_order(order_id: str, from_status: str, to_status: str) -> None:
    order = state.orders[order_id]
    event_id = str(uuid.uuid4())
    envelope = {
        "event_id": event_id,
        "source": {"connector": "postgres", "name": "debezium_sim"},
        "op": "u",
        "payload": {
            "before": {"status": from_status},
            "after": {
                "id": order.id,
                "status": to_status,
                "country": order.country,
                "channel": order.channel,
                "product_name": order.product_name,
                "total_price": order.total_price,
            },
            "ts_ms": int(datetime.now(UTC).timestamp() * 1000),
        },
    }
    state.last_envelope = envelope

    if event_id in state.processed_event_ids:
        await state.publish("duplicate_skipped", {"event_id": event_id})
        return

    state.processed_event_ids.add(event_id)
    await state.publish("cdc_emitted", {"event_id": event_id, "status": to_status})

    canonical = DebeziumAdapter.to_canonical(envelope)
    await state.publish("translated", canonical)

    route = "high_value" if canonical["total_price"] >= state.route_threshold else "normal"
    await state.publish("routed", {"order_id": canonical["order_id"], "route": route})

    tax_strategy = TaxStrategyFactory.create(canonical["country"])
    taxed_total = tax_strategy.apply(float(canonical["total_price"]))
    canonical["taxed_total"] = taxed_total
    await state.publish("transformed", {"order_id": canonical["order_id"], "taxed_total": taxed_total})

    SinkFactory.create("audit").write(canonical)
    await state.publish("sink_written", {"sink": "audit", "order_id": canonical["order_id"]})

    if canonical["status"] == "COMPLETED":
        state.analytics.completed_orders += 1
        state.analytics.completed_revenue = round(state.analytics.completed_revenue + taxed_total, 2)
        state.analytics.by_product[canonical["product_name"]] = round(
            state.analytics.by_product.get(canonical["product_name"], 0.0) + taxed_total, 2
        )
        state.analytics.by_country[canonical["country"]] = round(
            state.analytics.by_country.get(canonical["country"], 0.0) + taxed_total, 2
        )
        state.analytics.by_channel[canonical["channel"]] = round(
            state.analytics.by_channel.get(canonical["channel"], 0.0) + taxed_total, 2
        )
        SinkFactory.create("warehouse").write(canonical)
        await state.publish("aggregated", {"completed_orders": state.analytics.completed_orders})
        await state.publish("sink_written", {"sink": "warehouse", "order_id": canonical["order_id"]})


async def _advance_lifecycle(order_id: str) -> None:
    await asyncio.sleep(2)
    if order_id not in state.orders:
        return
    order = state.orders[order_id]
    old = order.status
    order.status = "PAYMENT_PENDING"
    order.updated_at = utc_now_iso()
    await state.publish("order_status_changed", {"order_id": order_id, "from": old, "to": order.status})
    await _emit_cdc_for_order(order_id, old, order.status)

    await asyncio.sleep(3)
    if order_id not in state.orders:
        return
    order = state.orders[order_id]
    old = order.status
    order.status = "COMPLETED"
    order.updated_at = utc_now_iso()
    await state.publish("order_status_changed", {"order_id": order_id, "from": old, "to": order.status})
    await _emit_cdc_for_order(order_id, old, order.status)


@router.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@router.get("/products")
def list_products() -> list[dict]:
    return [p.__dict__ for p in state.products]


@router.post("/orders/create")
async def create_order(req: CreateOrderRequest) -> dict:
    product = next((p for p in state.products if p.id == req.product_id), None)
    if product is None:
        raise HTTPException(status_code=400, detail="product_id not found")

    order_id = str(uuid.uuid4())
    total = round(product.price * req.quantity, 2)

    order = {
        "id": order_id,
        "user_id": req.user_id,
        "country": req.country.upper(),
        "channel": req.channel.lower(),
        "product_id": product.id,
        "product_name": product.name,
        "quantity": req.quantity,
        "unit_price": product.price,
        "total_price": total,
        "status": "CREATED",
        "created_at": utc_now_iso(),
        "updated_at": utc_now_iso(),
    }
    from app.state import Order

    state.orders[order_id] = Order(**order)

    await state.publish("order_created", {"order_id": order_id, "status": "CREATED", "total_price": total})
    await _emit_cdc_for_order(order_id, "NONE", "CREATED")

    task = asyncio.create_task(_advance_lifecycle(order_id))
    await state.register_task(task)

    return {"order_id": order_id, "status": "CREATED"}


@router.get("/orders/list")
def list_orders() -> list[dict]:
    return [o.__dict__ for o in state.orders.values()]


@router.post("/orders/replay-last-event")
async def replay_last_event() -> dict:
    if state.last_envelope is None:
        raise HTTPException(status_code=400, detail="no envelope to replay")
    envelope = dict(state.last_envelope)
    event_id = envelope["event_id"]
    if event_id in state.processed_event_ids:
        await state.publish("duplicate_skipped", {"event_id": event_id})
        return {"status": "skipped", "event_id": event_id}
    return {"status": "unexpected", "event_id": event_id}


@router.get("/analytics/summary")
def analytics_summary() -> dict:
    return {
        "completed_orders": state.analytics.completed_orders,
        "completed_revenue": state.analytics.completed_revenue,
        "by_product": state.analytics.by_product,
        "by_country": state.analytics.by_country,
        "by_channel": state.analytics.by_channel,
        "route_threshold": state.route_threshold,
    }


@router.post("/pipeline/config")
def set_pipeline_config(req: PipelineConfigRequest) -> dict:
    state.route_threshold = req.route_threshold
    return {"route_threshold": state.route_threshold}


@router.post("/sim/reset")
async def sim_reset() -> dict[str, str]:
    await state.reset()
    return {"status": "ok"}


@router.get("/stream/events")
async def stream_events(request: Request):
    async def event_generator():
        queue = await state.subscribe()
        try:
            while True:
                if await request.is_disconnected():
                    break
                try:
                    event = await asyncio.wait_for(queue.get(), timeout=15)
                    payload = json.dumps(event, default=_json_default)
                    yield f"data: {payload}\n\n"
                except TimeoutError:
                    yield ": keepalive\n\n"
        finally:
            await state.unsubscribe(queue)

    return StreamingResponse(event_generator(), media_type="text/event-stream")
