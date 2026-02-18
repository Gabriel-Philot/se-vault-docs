from datetime import datetime
from typing import Optional, Any
from sqlmodel import SQLModel, Field, Column
from sqlalchemy import JSON
from enum import Enum


class Species(str, Enum):
    DOG = "dog"
    CAT = "cat"
    BIRD = "bird"
    HAMSTER = "hamster"


class PetStatus(str, Enum):
    AWAKE = "awake"
    SLEEPING = "sleeping"


class Pet(SQLModel, table=True):
    __tablename__ = "pets"

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(max_length=100)
    species: str = Field(max_length=50)
    age: Optional[int] = Field(default=None)
    hunger_level: int = Field(default=50, ge=0, le=100)
    happiness: int = Field(default=50, ge=0, le=100)
    status: str = Field(default="awake")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class ActivityLog(SQLModel, table=True):
    __tablename__ = "activity_log"

    id: Optional[int] = Field(default=None, primary_key=True)
    pet_id: int = Field(foreign_key="pets.id")
    action: str = Field(max_length=50)
    details: Optional[dict] = Field(default=None, sa_column=Column(JSON))
    created_at: datetime = Field(default_factory=datetime.utcnow)


class PetCreate(SQLModel):
    name: str = Field(min_length=1, max_length=100)
    species: Species
    age: Optional[int] = Field(default=None, ge=0, le=50)


class PetUpdate(SQLModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    species: Optional[Species] = None
    age: Optional[int] = Field(default=None, ge=0, le=50)


class PetResponse(SQLModel):
    id: int
    name: str
    species: str
    age: Optional[int]
    hunger_level: int
    happiness: int
    status: str


class PetListResponse(SQLModel):
    pets: list[PetResponse]
    total: int
    cached: bool = False


class StatsResponse(SQLModel):
    total_pets: int
    avg_happiness: float
    avg_hunger: float
    by_species: dict[str, int]
    cached: bool = False


class ActivityResponse(SQLModel):
    id: int
    pet_id: int
    pet_name: str
    action: str
    details: Optional[dict]
    created_at: datetime


class ActivityListResponse(SQLModel):
    activities: list[ActivityResponse]
    total: int
