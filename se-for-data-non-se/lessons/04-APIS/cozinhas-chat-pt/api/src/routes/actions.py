from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel.ext.asyncio.session import AsyncSession

from ..database import get_session
from ..models import ActivityLog, Dish, DishResponse
from ..services.cache import invalidate_dishes_cache

router = APIRouter()


async def log_activity(
    session: AsyncSession, dish_id: int, action: str, details: dict | None = None
):
    log = ActivityLog(dish_id=dish_id, action=action, details=details)
    session.add(log)
    await session.commit()


@router.post("/{dish_id}/prepare", response_model=DishResponse)
async def prepare_dish(dish_id: int, session: AsyncSession = Depends(get_session)):
    dish = await session.get(Dish, dish_id)
    if not dish:
        raise HTTPException(status_code=404, detail="Dish not found")
    if dish.status == "archived":
        raise HTTPException(status_code=400, detail="Archived dishes cannot be prepared")

    old_freshness = dish.freshness
    old_popularity = dish.popularity
    dish.freshness = min(100, dish.freshness + 30)
    dish.popularity = min(100, dish.popularity + 5)
    dish.updated_at = datetime.utcnow()

    await log_activity(
        session,
        dish_id,
        "prepare",
        {
            "freshness_before": old_freshness,
            "freshness_after": dish.freshness,
            "popularity_before": old_popularity,
            "popularity_after": dish.popularity,
        },
    )

    await session.commit()
    await session.refresh(dish)
    await invalidate_dishes_cache()
    return dish


@router.post("/{dish_id}/serve", response_model=DishResponse)
async def serve_dish(dish_id: int, session: AsyncSession = Depends(get_session)):
    dish = await session.get(Dish, dish_id)
    if not dish:
        raise HTTPException(status_code=404, detail="Dish not found")
    if dish.status == "archived":
        raise HTTPException(status_code=400, detail="Archived dishes cannot be served")

    old_freshness = dish.freshness
    old_popularity = dish.popularity
    dish.popularity = min(100, dish.popularity + 25)
    dish.freshness = max(0, dish.freshness - 10)
    dish.updated_at = datetime.utcnow()

    await log_activity(
        session,
        dish_id,
        "serve",
        {
            "freshness_before": old_freshness,
            "freshness_after": dish.freshness,
            "popularity_before": old_popularity,
            "popularity_after": dish.popularity,
        },
    )

    await session.commit()
    await session.refresh(dish)
    await invalidate_dishes_cache()
    return dish


@router.post("/{dish_id}/archive", response_model=DishResponse)
async def archive_dish(dish_id: int, session: AsyncSession = Depends(get_session)):
    dish = await session.get(Dish, dish_id)
    if not dish:
        raise HTTPException(status_code=404, detail="Dish not found")
    if dish.status == "archived":
        raise HTTPException(status_code=400, detail="Dish is already archived")

    dish.status = "archived"
    dish.updated_at = datetime.utcnow()

    await log_activity(session, dish_id, "archive", {"status": "archived"})

    await session.commit()
    await session.refresh(dish)
    await invalidate_dishes_cache()
    return dish


@router.post("/{dish_id}/reactivate", response_model=DishResponse)
async def reactivate_dish(dish_id: int, session: AsyncSession = Depends(get_session)):
    dish = await session.get(Dish, dish_id)
    if not dish:
        raise HTTPException(status_code=404, detail="Dish not found")
    if dish.status != "archived":
        raise HTTPException(status_code=400, detail="Dish is already available")

    dish.status = "available"
    dish.updated_at = datetime.utcnow()

    await log_activity(session, dish_id, "reactivate", {"status": "available"})

    await session.commit()
    await session.refresh(dish)
    await invalidate_dishes_cache()
    return dish
