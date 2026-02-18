from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from datetime import datetime

from ..models import Pet, ActivityLog, PetResponse
from ..database import get_session
from ..services.cache import invalidate_pets_cache

router = APIRouter()


async def log_activity(
    session: AsyncSession, pet_id: int, action: str, details: dict = None
):
    log = ActivityLog(pet_id=pet_id, action=action, details=details)
    session.add(log)
    await session.commit()


@router.post("/{pet_id}/feed", response_model=PetResponse)
async def feed_pet(pet_id: int, session: AsyncSession = Depends(get_session)):
    pet = await session.get(Pet, pet_id)
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")

    if pet.status == "sleeping":
        raise HTTPException(
            status_code=400, detail="Pet is sleeping. Wake it up first!"
        )

    old_hunger = pet.hunger_level
    pet.hunger_level = max(0, pet.hunger_level - 30)
    pet.happiness = min(100, pet.happiness + 5)
    pet.updated_at = datetime.utcnow()

    await log_activity(
        session,
        pet_id,
        "feed",
        {"hunger_before": old_hunger, "hunger_after": pet.hunger_level},
    )

    await session.commit()
    await session.refresh(pet)

    await invalidate_pets_cache()

    return pet


@router.post("/{pet_id}/play", response_model=PetResponse)
async def play_with_pet(pet_id: int, session: AsyncSession = Depends(get_session)):
    pet = await session.get(Pet, pet_id)
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")

    if pet.status == "sleeping":
        raise HTTPException(
            status_code=400, detail="Pet is sleeping. Wake it up first!"
        )

    old_happiness = pet.happiness
    old_hunger = pet.hunger_level
    pet.happiness = min(100, pet.happiness + 25)
    pet.hunger_level = min(100, pet.hunger_level + 10)
    pet.updated_at = datetime.utcnow()

    await log_activity(
        session,
        pet_id,
        "play",
        {
            "happiness_before": old_happiness,
            "happiness_after": pet.happiness,
            "hunger_before": old_hunger,
            "hunger_after": pet.hunger_level,
        },
    )

    await session.commit()
    await session.refresh(pet)

    await invalidate_pets_cache()

    return pet


@router.post("/{pet_id}/sleep", response_model=PetResponse)
async def put_pet_to_sleep(pet_id: int, session: AsyncSession = Depends(get_session)):
    pet = await session.get(Pet, pet_id)
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")

    if pet.status == "sleeping":
        raise HTTPException(status_code=400, detail="Pet is already sleeping!")

    pet.status = "sleeping"
    pet.happiness = min(100, pet.happiness + 10)
    pet.updated_at = datetime.utcnow()

    await log_activity(session, pet_id, "sleep", {"status": "sleeping"})

    await session.commit()
    await session.refresh(pet)

    await invalidate_pets_cache()

    return pet


@router.post("/{pet_id}/wake", response_model=PetResponse)
async def wake_pet(pet_id: int, session: AsyncSession = Depends(get_session)):
    pet = await session.get(Pet, pet_id)
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")

    if pet.status != "sleeping":
        raise HTTPException(status_code=400, detail="Pet is already awake!")

    pet.status = "awake"
    pet.updated_at = datetime.utcnow()

    await log_activity(session, pet_id, "wake", {"status": "awake"})

    await session.commit()
    await session.refresh(pet)

    await invalidate_pets_cache()

    return pet
