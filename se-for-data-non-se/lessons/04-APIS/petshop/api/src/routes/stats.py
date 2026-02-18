from fastapi import APIRouter, Depends, Query
from sqlmodel import select, func
from sqlmodel.ext.asyncio.session import AsyncSession
from typing import Optional

from ..models import (
    Pet,
    ActivityLog,
    StatsResponse,
    ActivityResponse,
    ActivityListResponse,
)
from ..database import get_session
from ..services.cache import cache_response

router = APIRouter()


@router.get("/stats", response_model=StatsResponse)
@cache_response(ttl=10)
async def get_stats(session: AsyncSession = Depends(get_session)):
    total_result = await session.execute(select(func.count(Pet.id)))
    total_pets = total_result.scalar() or 0

    avg_happiness_result = await session.execute(select(func.avg(Pet.happiness)))
    avg_happiness = float(avg_happiness_result.scalar() or 0)

    avg_hunger_result = await session.execute(select(func.avg(Pet.hunger_level)))
    avg_hunger = float(avg_hunger_result.scalar() or 0)

    species_result = await session.execute(
        select(Pet.species, func.count(Pet.id)).group_by(Pet.species)
    )
    by_species = {row[0]: row[1] for row in species_result.all()}

    return {
        "total_pets": total_pets,
        "avg_happiness": round(avg_happiness, 2),
        "avg_hunger": round(avg_hunger, 2),
        "by_species": by_species,
    }


@router.get("/activity", response_model=ActivityListResponse)
async def get_activity(
    pet_id: Optional[int] = None,
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    session: AsyncSession = Depends(get_session),
):
    query = (
        select(ActivityLog, Pet.name)
        .join(Pet, ActivityLog.pet_id == Pet.id, isouter=True)
        .order_by(ActivityLog.created_at.desc())
    )

    count_query = select(func.count(ActivityLog.id))

    if pet_id:
        query = query.where(ActivityLog.pet_id == pet_id)
        count_query = count_query.where(ActivityLog.pet_id == pet_id)

    query = query.offset(offset).limit(limit)

    result = await session.execute(query)
    rows = result.all()

    total_result = await session.execute(count_query)
    total = total_result.scalar() or 0

    activities = []
    for log, pet_name in rows:
        activities.append(
            ActivityResponse(
                id=log.id,
                pet_id=log.pet_id,
                pet_name=pet_name or "Unknown",
                action=log.action,
                details=log.details,
                created_at=log.created_at,
            )
        )

    return {"activities": activities, "total": total}
