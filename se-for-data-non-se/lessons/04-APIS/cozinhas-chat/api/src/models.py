from datetime import datetime
from enum import Enum
from typing import Optional

from sqlalchemy import JSON
from sqlmodel import SQLModel, Column, Field


class Category(str, Enum):
    ENTREE = "entree"
    PLAT = "plat"
    DESSERT = "dessert"
    FROMAGE = "fromage"


class DishStatus(str, Enum):
    AVAILABLE = "available"
    ARCHIVED = "archived"


class Dish(SQLModel, table=True):
    __tablename__ = "dishes"

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(max_length=100)
    category: str = Field(max_length=50)
    price: float = Field(ge=0)
    preparation_time: int = Field(ge=0)
    freshness: int = Field(default=50, ge=0, le=100)
    popularity: int = Field(default=50, ge=0, le=100)
    status: str = Field(default="available")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class ActivityLog(SQLModel, table=True):
    __tablename__ = "activity_log"

    id: Optional[int] = Field(default=None, primary_key=True)
    dish_id: int = Field(foreign_key="dishes.id")
    action: str = Field(max_length=50)
    details: Optional[dict] = Field(default=None, sa_column=Column(JSON))
    created_at: datetime = Field(default_factory=datetime.utcnow)


class DishCreate(SQLModel):
    name: str = Field(min_length=1, max_length=100)
    category: Category
    price: float = Field(ge=0)
    preparation_time: int = Field(ge=0)


class DishUpdate(SQLModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    category: Optional[Category] = None
    price: Optional[float] = Field(default=None, ge=0)
    preparation_time: Optional[int] = Field(default=None, ge=0)


class DishResponse(SQLModel):
    id: int
    name: str
    category: str
    price: float
    preparation_time: int
    freshness: int
    popularity: int
    status: str


class DishListResponse(SQLModel):
    dishes: list[DishResponse]
    total: int
    cached: bool = False


class StatsResponse(SQLModel):
    total_dishes: int
    avg_price: float
    avg_freshness: float
    avg_popularity: float
    by_category: dict[str, int]
    cached: bool = False


class ActivityResponse(SQLModel):
    id: int
    dish_id: int
    dish_name: str
    action: str
    details: Optional[dict]
    created_at: datetime


class ActivityListResponse(SQLModel):
    activities: list[ActivityResponse]
    total: int
