from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import select, func
from sqlmodel.ext.asyncio.session import AsyncSession
from typing import Optional
from datetime import datetime

from ..models import (
    Pet,
    PetCreate,
    PetUpdate,
    PetResponse,
    PetListResponse,
    ActivityLog,
    ActivityResponse,
    ActivityListResponse,
)
from ..database import get_session
from ..services.cache import cache_response, invalidate_pets_cache

router = APIRouter()


@router.get("", response_model=PetListResponse)
@cache_response(ttl=5)
async def list_pets(
    species: Optional[str] = None,
    min_age: Optional[int] = None,
    max_age: Optional[int] = None,
    min_happiness: Optional[int] = None,
    limit: int = Query(10, ge=1, le=100),
    offset: int = Query(0, ge=0),
    sort_by: str = Query(
        "name", pattern="^(name|age|happiness|hunger_level|created_at)$"
    ),
    order: str = Query("asc", pattern="^(asc|desc)$"),
    session: AsyncSession = Depends(get_session),
):
    query = select(Pet)
    count_query = select(func.count(Pet.id))

    if species:
        query = query.where(Pet.species == species)
        count_query = count_query.where(Pet.species == species)
    if min_age is not None:
        query = query.where(Pet.age >= min_age)
        count_query = count_query.where(Pet.age >= min_age)
    if max_age is not None:
        query = query.where(Pet.age <= max_age)
        count_query = count_query.where(Pet.age <= max_age)
    if min_happiness is not None:
        query = query.where(Pet.happiness >= min_happiness)
        count_query = count_query.where(Pet.happiness >= min_happiness)

    sort_column = getattr(Pet, sort_by, Pet.name)
    if order == "desc":
        sort_column = sort_column.desc()
    query = query.order_by(sort_column)

    query = query.offset(offset).limit(limit)

    result = await session.execute(query)
    pets = result.scalars().all()

    total_result = await session.execute(count_query)
    total = total_result.scalar()

    return {"pets": pets, "total": total}


@router.get("/{pet_id}", response_model=PetResponse)
async def get_pet(pet_id: int, session: AsyncSession = Depends(get_session)):
    pet = await session.get(Pet, pet_id)
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    return pet


@router.post("", response_model=PetResponse, status_code=201)
async def create_pet(pet_data: PetCreate, session: AsyncSession = Depends(get_session)):
    pet = Pet(**pet_data.model_dump())
    session.add(pet)
    await session.commit()
    await session.refresh(pet)

    await invalidate_pets_cache()

    return pet


@router.put("/{pet_id}", response_model=PetResponse)
async def update_pet(
    pet_id: int, pet_data: PetCreate, session: AsyncSession = Depends(get_session)
):
    pet = await session.get(Pet, pet_id)
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")

    for key, value in pet_data.model_dump().items():
        setattr(pet, key, value)

    pet.updated_at = datetime.utcnow()
    await session.commit()
    await session.refresh(pet)

    await invalidate_pets_cache()

    return pet


@router.patch("/{pet_id}", response_model=PetResponse)
async def partial_update_pet(
    pet_id: int, pet_data: PetUpdate, session: AsyncSession = Depends(get_session)
):
    pet = await session.get(Pet, pet_id)
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")

    update_data = pet_data.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    for key, value in update_data.items():
        setattr(pet, key, value)

    pet.updated_at = datetime.utcnow()
    await session.commit()
    await session.refresh(pet)

    await invalidate_pets_cache()

    return pet


@router.delete("/{pet_id}", status_code=204)
async def delete_pet(pet_id: int, session: AsyncSession = Depends(get_session)):
    pet = await session.get(Pet, pet_id)
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")

    await session.delete(pet)
    await session.commit()

    await invalidate_pets_cache()

    return None
