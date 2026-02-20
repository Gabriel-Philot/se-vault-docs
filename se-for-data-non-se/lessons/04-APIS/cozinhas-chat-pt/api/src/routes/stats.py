from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlmodel import func, select
from sqlmodel.ext.asyncio.session import AsyncSession

from ..database import get_session
from ..models import ActivityListResponse, ActivityLog, ActivityResponse, Dish, StatsResponse
from ..services.cache import cache_response

router = APIRouter()


@router.get("/stats", response_model=StatsResponse)
@cache_response(ttl=10)
async def get_stats(session: AsyncSession = Depends(get_session)):
    total_result = await session.execute(select(func.count(Dish.id)))
    total_dishes = total_result.scalar() or 0

    avg_price_result = await session.execute(select(func.avg(Dish.price)))
    avg_price = float(avg_price_result.scalar() or 0)

    avg_freshness_result = await session.execute(select(func.avg(Dish.freshness)))
    avg_freshness = float(avg_freshness_result.scalar() or 0)

    avg_popularity_result = await session.execute(select(func.avg(Dish.popularity)))
    avg_popularity = float(avg_popularity_result.scalar() or 0)

    category_result = await session.execute(
        select(Dish.category, func.count(Dish.id)).group_by(Dish.category)
    )
    by_category = {row[0]: row[1] for row in category_result.all()}

    return {
        "total_dishes": total_dishes,
        "avg_price": round(avg_price, 2),
        "avg_freshness": round(avg_freshness, 2),
        "avg_popularity": round(avg_popularity, 2),
        "by_category": by_category,
    }


@router.get("/activity", response_model=ActivityListResponse)
async def get_activity(
    dish_id: Optional[int] = None,
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    session: AsyncSession = Depends(get_session),
):
    query = (
        select(ActivityLog, Dish.name)
        .join(Dish, ActivityLog.dish_id == Dish.id, isouter=True)
        .order_by(ActivityLog.created_at.desc())
    )
    count_query = select(func.count(ActivityLog.id))

    if dish_id:
        query = query.where(ActivityLog.dish_id == dish_id)
        count_query = count_query.where(ActivityLog.dish_id == dish_id)

    query = query.offset(offset).limit(limit)

    result = await session.execute(query)
    rows = result.all()

    total_result = await session.execute(count_query)
    total = total_result.scalar() or 0

    activities = [
        ActivityResponse(
            id=log.id,
            dish_id=log.dish_id,
            dish_name=dish_name or "Unknown",
            action=log.action,
            details=log.details,
            created_at=log.created_at,
        )
        for log, dish_name in rows
    ]

    return {"activities": activities, "total": total}
