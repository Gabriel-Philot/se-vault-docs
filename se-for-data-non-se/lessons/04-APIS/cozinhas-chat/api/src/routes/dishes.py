from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import func, select
from sqlmodel.ext.asyncio.session import AsyncSession

from ..database import get_session
from ..models import Dish, DishCreate, DishListResponse, DishResponse, DishUpdate
from ..services.cache import cache_response, invalidate_dishes_cache

router = APIRouter()


@router.get("", response_model=DishListResponse)
@cache_response(ttl=5)
async def list_dishes(
    category: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    min_popularity: Optional[int] = None,
    limit: int = Query(10, ge=1, le=100),
    offset: int = Query(0, ge=0),
    sort_by: str = Query(
        "name", pattern="^(name|price|preparation_time|freshness|popularity|created_at)$"
    ),
    order: str = Query("asc", pattern="^(asc|desc)$"),
    session: AsyncSession = Depends(get_session),
):
    query = select(Dish)
    count_query = select(func.count(Dish.id))

    if category:
        query = query.where(Dish.category == category)
        count_query = count_query.where(Dish.category == category)
    if min_price is not None:
        query = query.where(Dish.price >= min_price)
        count_query = count_query.where(Dish.price >= min_price)
    if max_price is not None:
        query = query.where(Dish.price <= max_price)
        count_query = count_query.where(Dish.price <= max_price)
    if min_popularity is not None:
        query = query.where(Dish.popularity >= min_popularity)
        count_query = count_query.where(Dish.popularity >= min_popularity)

    sort_column = getattr(Dish, sort_by, Dish.name)
    if order == "desc":
        sort_column = sort_column.desc()

    query = query.order_by(sort_column).offset(offset).limit(limit)

    result = await session.execute(query)
    dishes = result.scalars().all()

    total_result = await session.execute(count_query)
    total = total_result.scalar() or 0

    return {"dishes": dishes, "total": total}


@router.get("/{dish_id}", response_model=DishResponse)
async def get_dish(dish_id: int, session: AsyncSession = Depends(get_session)):
    dish = await session.get(Dish, dish_id)
    if not dish:
        raise HTTPException(status_code=404, detail="Dish not found")
    return dish


@router.post("", response_model=DishResponse, status_code=201)
async def create_dish(dish_data: DishCreate, session: AsyncSession = Depends(get_session)):
    dish = Dish(**dish_data.model_dump())
    session.add(dish)
    await session.commit()
    await session.refresh(dish)
    await invalidate_dishes_cache()
    return dish


@router.put("/{dish_id}", response_model=DishResponse)
async def update_dish(
    dish_id: int, dish_data: DishCreate, session: AsyncSession = Depends(get_session)
):
    dish = await session.get(Dish, dish_id)
    if not dish:
        raise HTTPException(status_code=404, detail="Dish not found")

    for key, value in dish_data.model_dump().items():
        setattr(dish, key, value)

    dish.updated_at = datetime.utcnow()
    await session.commit()
    await session.refresh(dish)
    await invalidate_dishes_cache()
    return dish


@router.patch("/{dish_id}", response_model=DishResponse)
async def partial_update_dish(
    dish_id: int, dish_data: DishUpdate, session: AsyncSession = Depends(get_session)
):
    dish = await session.get(Dish, dish_id)
    if not dish:
        raise HTTPException(status_code=404, detail="Dish not found")

    update_data = dish_data.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    for key, value in update_data.items():
        setattr(dish, key, value)

    dish.updated_at = datetime.utcnow()
    await session.commit()
    await session.refresh(dish)
    await invalidate_dishes_cache()
    return dish


@router.delete("/{dish_id}", status_code=204)
async def delete_dish(dish_id: int, session: AsyncSession = Depends(get_session)):
    dish = await session.get(Dish, dish_id)
    if not dish:
        raise HTTPException(status_code=404, detail="Dish not found")

    await session.delete(dish)
    await session.commit()
    await invalidate_dishes_cache()
    return None
