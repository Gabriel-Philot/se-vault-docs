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
    image_url: Optional[str] = Field(default=None, max_length=255)
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
    image_url: Optional[str] = Field(default=None, max_length=255)


class DishUpdate(SQLModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    category: Optional[Category] = None
    price: Optional[float] = Field(default=None, ge=0)
    preparation_time: Optional[int] = Field(default=None, ge=0)
    image_url: Optional[str] = Field(default=None, max_length=255)


class DishResponse(SQLModel):
    id: int
    name: str
    category: str
    price: float
    preparation_time: int
    image_url: Optional[str] = None
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


class HallTableStatus(str, Enum):
    LIVRE = "livre"
    OCUPADA = "ocupada"
    AGUARDANDO_PRATO = "aguardando_prato"


class HallOrderStatus(str, Enum):
    ABERTO = "aberto"
    LIBERADO = "liberado"


class KitchenTicketStatus(str, Enum):
    ABERTO = "aberto"
    PREPARANDO = "preparando"
    PRONTO = "pronto"
    SERVIDO = "servido"


class HallTable(SQLModel, table=True):
    __tablename__ = "hall_tables"

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(max_length=50, unique=True)
    seats: int = Field(default=4, ge=1, le=20)
    status: str = Field(default=HallTableStatus.LIVRE.value)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class HallOrder(SQLModel, table=True):
    __tablename__ = "hall_orders"

    id: Optional[int] = Field(default=None, primary_key=True)
    table_id: int = Field(foreign_key="hall_tables.id")
    dish_name: str = Field(max_length=120)
    quantity: int = Field(default=1, ge=1, le=50)
    notes: Optional[str] = Field(default=None, max_length=300)
    status: str = Field(default=HallOrderStatus.ABERTO.value)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class HallEvent(SQLModel, table=True):
    __tablename__ = "hall_events"

    id: Optional[int] = Field(default=None, primary_key=True)
    table_id: int = Field(foreign_key="hall_tables.id")
    event_type: str = Field(max_length=50)
    details: Optional[dict] = Field(default=None, sa_column=Column(JSON))
    created_at: datetime = Field(default_factory=datetime.utcnow)


class KitchenTicket(SQLModel, table=True):
    __tablename__ = "kitchen_tickets"

    id: Optional[int] = Field(default=None, primary_key=True)
    hall_order_id: int = Field(foreign_key="hall_orders.id")
    table_id: int = Field(foreign_key="hall_tables.id")
    table_name_snapshot: str = Field(max_length=50)
    dish_name: str = Field(max_length=120)
    quantity: int = Field(default=1, ge=1, le=50)
    notes: Optional[str] = Field(default=None, max_length=300)
    status: str = Field(default=KitchenTicketStatus.ABERTO.value)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class KitchenEvent(SQLModel, table=True):
    __tablename__ = "kitchen_events"

    id: Optional[int] = Field(default=None, primary_key=True)
    ticket_id: int = Field(foreign_key="kitchen_tickets.id")
    event_type: str = Field(max_length=50)
    details: Optional[dict] = Field(default=None, sa_column=Column(JSON))
    created_at: datetime = Field(default_factory=datetime.utcnow)


class HallOrderResponse(SQLModel):
    id: int
    dish_name: str
    quantity: int
    notes: Optional[str]
    status: str
    created_at: datetime


class HallTableResponse(SQLModel):
    id: int
    name: str
    seats: int
    status: str
    orders: list[HallOrderResponse] = []


class HallTablesListResponse(SQLModel):
    tables: list[HallTableResponse]
    total: int
    cached: bool = False


class HallOrderCreate(SQLModel):
    dish_name: str = Field(min_length=1, max_length=120)
    quantity: int = Field(default=1, ge=1, le=50)
    notes: Optional[str] = Field(default=None, max_length=300)


class MenuOrderCreate(SQLModel):
    dish_id: int = Field(ge=1)
    quantity: int = Field(default=1, ge=1, le=50)
    notes: Optional[str] = Field(default=None, max_length=300)


class HallEventResponse(SQLModel):
    id: int
    table_id: int
    table_name: str
    event_type: str
    details: Optional[dict]
    created_at: datetime


class HallEventsListResponse(SQLModel):
    events: list[HallEventResponse]
    total: int


class KitchenTicketResponse(SQLModel):
    id: int
    hall_order_id: int
    table_id: int
    table_name_snapshot: str
    dish_name: str
    quantity: int
    notes: Optional[str]
    status: str
    created_at: datetime


class KitchenTicketsListResponse(SQLModel):
    tickets: list[KitchenTicketResponse]
    total: int
    cached: bool = False


class KitchenEventResponse(SQLModel):
    id: int
    ticket_id: int
    event_type: str
    details: Optional[dict]
    created_at: datetime


class KitchenEventsListResponse(SQLModel):
    events: list[KitchenEventResponse]
    total: int


class MenuOrderResponse(SQLModel):
    hall_order_id: int
    kitchen_ticket_id: int
    table_id: int
    table_name: str
    dish_name: str
    quantity: int
