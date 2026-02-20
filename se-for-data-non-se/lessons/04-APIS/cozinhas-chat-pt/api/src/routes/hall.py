import random
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import func, select
from sqlmodel.ext.asyncio.session import AsyncSession

from ..database import get_session
from ..models import (
    Dish,
    HallEvent,
    HallEventsListResponse,
    HallEventResponse,
    HallOrder,
    HallOrderCreate,
    HallOrderResponse,
    HallOrderStatus,
    HallTable,
    HallTableResponse,
    HallTableStatus,
    HallTablesListResponse,
    KitchenEvent,
    KitchenTicket,
    KitchenTicketStatus,
    MenuOrderCreate,
    MenuOrderResponse,
)
from ..services.cache import cache_response, invalidate_hall_cache, invalidate_kitchen_cache

router = APIRouter(prefix="/hall", tags=["hall"])


async def _build_table_response(session: AsyncSession, table: HallTable) -> HallTableResponse:
    orders_result = await session.execute(
        select(HallOrder)
        .where(HallOrder.table_id == table.id)
        .where(HallOrder.status == HallOrderStatus.ABERTO.value)
        .order_by(HallOrder.created_at.asc())
    )
    orders = orders_result.scalars().all()
    return HallTableResponse(
        id=table.id,
        name=table.name,
        seats=table.seats,
        status=table.status,
        orders=[
            HallOrderResponse(
                id=o.id,
                dish_name=o.dish_name,
                quantity=o.quantity,
                notes=o.notes,
                status=o.status,
                created_at=o.created_at,
            )
            for o in orders
        ],
    )


async def _create_order_and_ticket(
    session: AsyncSession,
    table: HallTable,
    dish_name: str,
    quantity: int,
    notes: str | None,
    source: str,
) -> tuple[HallOrder, KitchenTicket]:
    order = HallOrder(
        table_id=table.id,
        dish_name=dish_name,
        quantity=quantity,
        notes=notes,
        status=HallOrderStatus.ABERTO.value,
    )
    session.add(order)
    await session.flush()

    ticket = KitchenTicket(
        hall_order_id=order.id,
        table_id=table.id,
        table_name_snapshot=table.name,
        dish_name=dish_name,
        quantity=quantity,
        notes=notes,
        status=KitchenTicketStatus.ABERTO.value,
    )
    session.add(ticket)
    await session.flush()

    table.status = HallTableStatus.AGUARDANDO_PRATO.value
    table.updated_at = datetime.utcnow()
    session.add(table)

    hall_event = HallEvent(
        table_id=table.id,
        event_type="pedido_adicionado",
        details={"dish_name": dish_name, "quantity": quantity, "origem": source},
    )
    kitchen_event = KitchenEvent(
        ticket_id=ticket.id,
        event_type="ticket_criado",
        details={"hall_order_id": order.id, "table_name": table.name, "origem": source},
    )
    session.add(hall_event)
    session.add(kitchen_event)

    await session.commit()
    await invalidate_hall_cache()
    await invalidate_kitchen_cache()
    await session.refresh(order)
    await session.refresh(ticket)
    return order, ticket


def _choose_random_table(tables: list[HallTable]) -> HallTable | None:
    free_tables = [table for table in tables if table.status == HallTableStatus.LIVRE.value]
    if free_tables:
        return random.choice(free_tables)

    occupied_tables = [table for table in tables if table.status == HallTableStatus.OCUPADA.value]
    if occupied_tables:
        return random.choice(occupied_tables)

    return None


@router.get("/tables", response_model=HallTablesListResponse)
@cache_response(ttl=5)
async def list_tables(session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(HallTable).order_by(HallTable.id.asc()))
    tables = result.scalars().all()
    rows = [await _build_table_response(session, table) for table in tables]
    return {"tables": rows, "total": len(rows)}


@router.get("/tables/{table_id}", response_model=HallTableResponse)
@cache_response(ttl=5)
async def get_table(table_id: int, session: AsyncSession = Depends(get_session)):
    table = await session.get(HallTable, table_id)
    if not table:
        raise HTTPException(status_code=404, detail="Mesa nao encontrada")
    return await _build_table_response(session, table)


@router.post("/tables/{table_id}/orders", response_model=HallTableResponse, status_code=201)
async def create_order(
    table_id: int,
    payload: HallOrderCreate,
    session: AsyncSession = Depends(get_session),
):
    table = await session.get(HallTable, table_id)
    if not table:
        raise HTTPException(status_code=404, detail="Mesa nao encontrada")

    await _create_order_and_ticket(
        session,
        table,
        payload.dish_name,
        payload.quantity,
        payload.notes,
        source="salao",
    )
    return await _build_table_response(session, table)


@router.post("/orders/from-menu", response_model=MenuOrderResponse, status_code=201)
async def create_order_from_menu(
    payload: MenuOrderCreate,
    session: AsyncSession = Depends(get_session),
):
    dish = await session.get(Dish, payload.dish_id)
    if not dish:
        raise HTTPException(status_code=404, detail="Prato nao encontrado")

    tables_result = await session.execute(select(HallTable).order_by(HallTable.id.asc()))
    tables = tables_result.scalars().all()
    table = _choose_random_table(tables)
    if not table:
        raise HTTPException(status_code=400, detail="Nao ha mesas disponiveis")

    order, ticket = await _create_order_and_ticket(
        session,
        table,
        dish.name,
        payload.quantity,
        payload.notes,
        source="cardapio",
    )

    return MenuOrderResponse(
        hall_order_id=order.id,
        kitchen_ticket_id=ticket.id,
        table_id=table.id,
        table_name=table.name,
        dish_name=dish.name,
        quantity=payload.quantity,
    )


@router.post("/tables/{table_id}/release", response_model=HallTableResponse)
async def release_orders(table_id: int, session: AsyncSession = Depends(get_session)):
    table = await session.get(HallTable, table_id)
    if not table:
        raise HTTPException(status_code=404, detail="Mesa nao encontrada")

    open_orders_result = await session.execute(
        select(HallOrder)
        .where(HallOrder.table_id == table.id)
        .where(HallOrder.status == HallOrderStatus.ABERTO.value)
    )
    open_orders = open_orders_result.scalars().all()
    if not open_orders:
        raise HTTPException(status_code=400, detail="Nao ha pedidos em aberto")

    for order in open_orders:
        order.status = HallOrderStatus.LIBERADO.value
        order.updated_at = datetime.utcnow()
        session.add(order)

    table.status = HallTableStatus.OCUPADA.value
    table.updated_at = datetime.utcnow()
    session.add(table)

    event = HallEvent(
        table_id=table.id,
        event_type="pedido_liberado",
        details={"itens": len(open_orders)},
    )
    session.add(event)

    await session.commit()
    await invalidate_hall_cache()

    return await _build_table_response(session, table)


@router.get("/activity", response_model=HallEventsListResponse)
@cache_response(ttl=5)
async def list_hall_events(
    limit: int = Query(20, ge=1, le=100),
    session: AsyncSession = Depends(get_session),
):
    query = (
        select(HallEvent, HallTable.name)
        .join(HallTable, HallTable.id == HallEvent.table_id)
        .order_by(HallEvent.created_at.desc())
        .limit(limit)
    )
    result = await session.execute(query)
    rows = result.all()
    events = [
        HallEventResponse(
            id=event.id,
            table_id=event.table_id,
            table_name=table_name,
            event_type=event.event_type,
            details=event.details,
            created_at=event.created_at,
        )
        for event, table_name in rows
    ]

    total_result = await session.execute(select(func.count(HallEvent.id)))
    total = total_result.scalar() or 0

    return {"events": events, "total": total}
