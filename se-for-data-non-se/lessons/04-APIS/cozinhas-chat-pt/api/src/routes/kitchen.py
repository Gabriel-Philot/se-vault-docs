from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import func, select
from sqlmodel.ext.asyncio.session import AsyncSession

from ..database import get_session
from ..models import (
    HallOrder,
    HallOrderStatus,
    HallTable,
    HallTableStatus,
    KitchenEvent,
    KitchenEventsListResponse,
    KitchenEventResponse,
    KitchenTicket,
    KitchenTicketResponse,
    KitchenTicketsListResponse,
    KitchenTicketStatus,
)
from ..services.cache import cache_response, invalidate_hall_cache, invalidate_kitchen_cache

router = APIRouter(prefix="/kitchen", tags=["kitchen"])


def _to_ticket_response(ticket: KitchenTicket) -> KitchenTicketResponse:
    return KitchenTicketResponse(
        id=ticket.id,
        hall_order_id=ticket.hall_order_id,
        table_id=ticket.table_id,
        table_name_snapshot=ticket.table_name_snapshot,
        dish_name=ticket.dish_name,
        quantity=ticket.quantity,
        notes=ticket.notes,
        status=ticket.status,
        created_at=ticket.created_at,
    )


async def _change_status(
    session: AsyncSession,
    ticket_id: int,
    current: KitchenTicketStatus,
    target: KitchenTicketStatus,
    event_type: str,
):
    ticket = await session.get(KitchenTicket, ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket nao encontrado")

    if ticket.status != current.value:
        raise HTTPException(status_code=400, detail=f"Ticket deve estar em {current.value}")

    ticket.status = target.value
    ticket.updated_at = datetime.utcnow()
    session.add(ticket)

    event = KitchenEvent(
        ticket_id=ticket.id,
        event_type=event_type,
        details={"from": current.value, "to": target.value},
    )
    session.add(event)

    if target == KitchenTicketStatus.SERVIDO:
        hall_order = await session.get(HallOrder, ticket.hall_order_id)
        if hall_order:
            hall_order.status = HallOrderStatus.LIBERADO.value
            hall_order.updated_at = datetime.utcnow()
            session.add(hall_order)

        open_for_table_result = await session.execute(
            select(func.count(KitchenTicket.id)).where(KitchenTicket.table_id == ticket.table_id).where(
                KitchenTicket.status.in_(
                    [
                        KitchenTicketStatus.ABERTO.value,
                        KitchenTicketStatus.PREPARANDO.value,
                        KitchenTicketStatus.PRONTO.value,
                    ]
                )
            )
        )
        open_for_table = open_for_table_result.scalar() or 0
        table = await session.get(HallTable, ticket.table_id)
        if table:
            table.status = (
                HallTableStatus.OCUPADA.value if open_for_table == 0 else HallTableStatus.AGUARDANDO_PRATO.value
            )
            table.updated_at = datetime.utcnow()
            session.add(table)

    await session.commit()
    await invalidate_kitchen_cache()
    await invalidate_hall_cache()
    await session.refresh(ticket)
    return _to_ticket_response(ticket)


@router.get("/tickets", response_model=KitchenTicketsListResponse)
@cache_response(ttl=5)
async def list_kitchen_tickets(
    status: str | None = Query(default=None, pattern="^(aberto|preparando|pronto|servido)$"),
    limit: int = Query(60, ge=1, le=200),
    session: AsyncSession = Depends(get_session),
):
    query = select(KitchenTicket)
    count_query = select(func.count(KitchenTicket.id))

    if status:
        query = query.where(KitchenTicket.status == status)
        count_query = count_query.where(KitchenTicket.status == status)

    query = query.order_by(KitchenTicket.created_at.desc()).limit(limit)

    result = await session.execute(query)
    tickets = result.scalars().all()

    total_result = await session.execute(count_query)
    total = total_result.scalar() or 0

    return {"tickets": [_to_ticket_response(ticket) for ticket in tickets], "total": total}


@router.get("/tickets/{ticket_id}", response_model=KitchenTicketResponse)
@cache_response(ttl=5)
async def get_kitchen_ticket(ticket_id: int, session: AsyncSession = Depends(get_session)):
    ticket = await session.get(KitchenTicket, ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket nao encontrado")
    return _to_ticket_response(ticket)


@router.post("/tickets/{ticket_id}/start", response_model=KitchenTicketResponse)
async def start_ticket(ticket_id: int, session: AsyncSession = Depends(get_session)):
    return await _change_status(
        session,
        ticket_id,
        current=KitchenTicketStatus.ABERTO,
        target=KitchenTicketStatus.PREPARANDO,
        event_type="ticket_preparando",
    )


@router.post("/tickets/{ticket_id}/ready", response_model=KitchenTicketResponse)
async def ready_ticket(ticket_id: int, session: AsyncSession = Depends(get_session)):
    return await _change_status(
        session,
        ticket_id,
        current=KitchenTicketStatus.PREPARANDO,
        target=KitchenTicketStatus.PRONTO,
        event_type="ticket_pronto",
    )


@router.post("/tickets/{ticket_id}/serve", response_model=KitchenTicketResponse)
async def serve_ticket(ticket_id: int, session: AsyncSession = Depends(get_session)):
    return await _change_status(
        session,
        ticket_id,
        current=KitchenTicketStatus.PRONTO,
        target=KitchenTicketStatus.SERVIDO,
        event_type="ticket_servido",
    )


@router.get("/activity", response_model=KitchenEventsListResponse)
@cache_response(ttl=5)
async def list_kitchen_events(
    limit: int = Query(30, ge=1, le=150),
    session: AsyncSession = Depends(get_session),
):
    query = select(KitchenEvent).order_by(KitchenEvent.created_at.desc()).limit(limit)
    result = await session.execute(query)
    events = result.scalars().all()

    total_result = await session.execute(select(func.count(KitchenEvent.id)))
    total = total_result.scalar() or 0

    return {
        "events": [
            KitchenEventResponse(
                id=event.id,
                ticket_id=event.ticket_id,
                event_type=event.event_type,
                details=event.details,
                created_at=event.created_at,
            )
            for event in events
        ],
        "total": total,
    }
