# CRUD Completo: Do HTTP ao Banco de Dados

Este guia implementa todas as operações CRUD conectando FastAPI ao PostgreSQL.

---

## 0. Por Que Isso Importa?

CRUD (Create, Read, Update, Delete) é a base de quase toda API REST. Você vai:
*   Conectar ao PostgreSQL
*   Usar SQLModel para ORM
*   Implementar query params e filtros
*   Tratar erros padronizados

---

## 1. Setup do Banco

### SQLModel

SQLModel combina SQLAlchemy + Pydantic em uma interface única.

```bash
uv add sqlmodel asyncpg
```

### Conexão Assíncrona

```python
# database.py
from sqlmodel import SQLModel
from sqlmodel.ext.asyncio.session import AsyncSession, AsyncEngine
from sqlalchemy.ext.asyncio import create_async_engine

DATABASE_URL = "postgresql+asyncpg://user:pass@localhost:5432/petshop"

engine = AsyncEngine(create_async_engine(DATABASE_URL, echo=True))

async def get_session() -> AsyncSession:
    async with AsyncSession(engine) as session:
        yield session

async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)
```

---

## 2. Models: Banco + API

```python
# models.py
from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field
from enum import Enum

class Species(str, Enum):
    DOG = "dog"
    CAT = "cat"
    BIRD = "bird"
    HAMSTER = "hamster"

class PetStatus(str, Enum):
    AWAKE = "awake"
    SLEEPING = "sleeping"

# Model do banco (tabela)
class Pet(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(max_length=100)
    species: str = Field(max_length=50)
    age: Optional[int] = Field(default=None)
    hunger_level: int = Field(default=50, ge=0, le=100)
    happiness: int = Field(default=50, ge=0, le=100)
    status: str = Field(default="awake")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

# Models de API
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
```

---

## 3. CREATE: POST /pets

```python
# routes/pets.py
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel.ext.asyncio.session import AsyncSession
from models import Pet, PetCreate, PetResponse
from database import get_session

router = APIRouter()

@router.post("/", response_model=PetResponse, status_code=201)
async def create_pet(
    pet_data: PetCreate,
    session: AsyncSession = Depends(get_session)
):
    pet = Pet(**pet_data.model_dump())
    session.add(pet)
    await session.commit()
    await session.refresh(pet)
    return pet
```

### O que Acontece

```
Request: POST /pets {"name": "Rex", "species": "dog", "age": 3}
    ↓
Pydantic valida PetCreate
    ↓
Cria objeto Pet (modelo do banco)
    ↓
INSERT INTO pets (name, species, age, ...)
    ↓
Retorna PetResponse (201 Created)
```

---

## 4. READ: GET /pets e GET /pets/{id}

### Listar Todos (com Query Params)

```python
from typing import Optional
from sqlmodel import select

@router.get("/")
async def list_pets(
    species: Optional[str] = None,
    min_age: Optional[int] = None,
    max_age: Optional[int] = None,
    min_happiness: Optional[int] = None,
    limit: int = 10,
    offset: int = 0,
    sort_by: str = "name",
    order: str = "asc",
    session: AsyncSession = Depends(get_session)
):
    query = select(Pet)
    
    # Filtros
    if species:
        query = query.where(Pet.species == species)
    if min_age is not None:
        query = query.where(Pet.age >= min_age)
    if max_age is not None:
        query = query.where(Pet.age <= max_age)
    if min_happiness is not None:
        query = query.where(Pet.happiness >= min_happiness)
    
    # Ordenação
    sort_column = getattr(Pet, sort_by, Pet.name)
    if order == "desc":
        sort_column = sort_column.desc()
    query = query.order_by(sort_column)
    
    # Paginação
    query = query.offset(offset).limit(limit)
    
    result = await session.execute(query)
    pets = result.scalars().all()
    
    # Contar total
    count_query = select(Pet)
    if species:
        count_query = count_query.where(Pet.species == species)
    # ... outros filtros
    total = len((await session.execute(count_query)).scalars().all())
    
    return {"pets": pets, "total": total, "cached": False}
```

### Query Params → SQL

| Query Param | SQL Gerado |
|-------------|------------|
| `?species=dog` | `WHERE species = 'dog'` |
| `?min_age=2` | `WHERE age >= 2` |
| `?sort_by=happiness&order=desc` | `ORDER BY happiness DESC` |
| `?limit=10&offset=20` | `LIMIT 10 OFFSET 20` |

### Buscar por ID

```python
@router.get("/{pet_id}", response_model=PetResponse)
async def get_pet(pet_id: int, session: AsyncSession = Depends(get_session)):
    pet = await session.get(Pet, pet_id)
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    return pet
```

---

## 5. UPDATE: PUT e PATCH

### PUT: Atualização Completa

```python
@router.put("/{pet_id}", response_model=PetResponse)
async def update_pet(
    pet_id: int,
    pet_data: PetCreate,  # Todos os campos obrigatórios
    session: AsyncSession = Depends(get_session)
):
    pet = await session.get(Pet, pet_id)
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    
    # Substitui todos os campos
    for key, value in pet_data.model_dump().items():
        setattr(pet, key, value)
    
    pet.updated_at = datetime.utcnow()
    await session.commit()
    await session.refresh(pet)
    return pet
```

### PATCH: Atualização Parcial

```python
@router.patch("/{pet_id}", response_model=PetResponse)
async def partial_update_pet(
    pet_id: int,
    pet_data: PetUpdate,  # Campos opcionais
    session: AsyncSession = Depends(get_session)
):
    pet = await session.get(Pet, pet_id)
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    
    # Só atualiza campos enviados
    update_data = pet_data.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    for key, value in update_data.items():
        setattr(pet, key, value)
    
    pet.updated_at = datetime.utcnow()
    await session.commit()
    await session.refresh(pet)
    return pet
```

---

## 6. DELETE: DELETE /pets/{id}

```python
@router.delete("/{pet_id}", status_code=204)
async def delete_pet(pet_id: int, session: AsyncSession = Depends(get_session)):
    pet = await session.get(Pet, pet_id)
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    
    await session.delete(pet)
    await session.commit()
    return None  # 204 No Content
```

---

## 7. Tratamento de Erros Padronizados

### Formato Consistente

```python
# Sempre retorne {"detail": "..."}
{
    "detail": "Pet not found"
}
```

### Códigos por Cenário

| Cenário | Código | Detail |
|---------|--------|--------|
| Recurso não existe | 404 | "Pet not found" |
| JSON inválido | 400 | "Invalid JSON" (automático) |
| Validação falha | 422 | Detalhes do Pydantic (automático) |
| Campo vazio em PATCH | 400 | "No fields to update" |
| Conflito (unique) | 409 | "Pet with this name already exists" |
| Erro interno | 500 | "Internal server error" |

### Handler Global de Erros

```python
from fastapi import Request
from fastapi.responses import JSONResponse

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )
```

---

## 8. Diferença: 400 vs 404 vs 422

| Código | Quando Usar | Exemplo |
|--------|-------------|---------|
| **400** | Request mal formatado, semântica inválida | `{"name": ""}` em PATCH com exclude_unset vazio |
| **404** | Recurso referenciado não existe | `GET /pets/9999` |
| **422** | Validação Pydantic falhou | `{"age": -5}` (regra de negócio) |

### Fluxo de Decisão

```
Request chega
    ↓
JSON válido? → Não → 400 Bad Request
    ↓ Sim
Campos obrigatórios presentes? → Não → 422 Unprocessable
    ↓ Sim
Valores passam validação? → Não → 422 Unprocessable
    ↓ Sim
Recurso existe (para PUT/PATCH/DELETE)? → Não → 404 Not Found
    ↓ Sim
Processa normalmente → 200/201/204
```

---

## 9. Paginação

### Offset-Based (Simples)

```python
@router.get("/")
async def list_pets(limit: int = 10, offset: int = 0, ...):
    query = select(Pet).offset(offset).limit(limit)
    # ...
```

**Uso:** `GET /pets?limit=10&offset=20`

**Problema:** Se dados mudam entre páginas, pode pular/duplicar.

### Cursor-Based (Produção)

```python
@router.get("/")
async def list_pets(
    limit: int = 10,
    cursor: Optional[int] = None,  # ID do último item da página anterior
    ...
):
    query = select(Pet)
    if cursor:
        query = query.where(Pet.id > cursor)
    query = query.order_by(Pet.id).limit(limit)
    # ...
```

**Uso:** `GET /pets?limit=10&cursor=50`

---

## 10. Fluxo Completo

```
┌─────────────┐     POST /pets       ┌─────────────┐
│   Cliente   │ ─────────────────────▶│   FastAPI   │
│  (Python)   │                       │             │
└─────────────┘     PetResponse       └──────┬──────┘
     ◀────────────────────────────────────────┘
                                            │
                                            ▼
                                     ┌─────────────┐
                                     │ PostgreSQL  │
                                     │   INSERT    │
                                     └─────────────┘
```

---

## 11. Cheat Sheet

| Operação | Método | Endpoint | Status Code |
|----------|--------|----------|-------------|
| Criar | POST | /pets | 201 |
| Listar | GET | /pets | 200 |
| Buscar | GET | /pets/{id} | 200 |
| Atualizar tudo | PUT | /pets/{id} | 200 |
| Atualizar parcial | PATCH | /pets/{id} | 200 |
| Deletar | DELETE | /pets/{id} | 204 |

---

## Próximos Passos

Agora vamos adicionar **Nginx como reverse proxy** para produção.

→ [05_nginx_reverse_proxy.md](05_nginx_reverse_proxy.md)
