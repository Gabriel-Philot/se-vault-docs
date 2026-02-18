# FastAPI + Pydantic: Validando e Documentando APIs

Este guia apresenta FastAPI e Pydantic para construir APIs robustas.

---

## 0. Por Que Isso Importa?

Você poderia usar Flask ou Django. Mas FastAPI oferece:
*   **Validação automática** de tipos via Pydantic
*   **Documentação automática** (Swagger/OpenAPI)
*   **Async nativo** para alta performance
*   **Type hints** como contrato

Para engenheiros de dados: menos boilerplate, mais tempo para lógica real.

---

## 1. O Que é FastAPI?

Framework web assíncrono para Python, criado por Sebastián Ramírez (2018).

### Características Principais

| Feature | Benefício |
|---------|-----------|
| Type hints nativos | IDE autocomplete, menos bugs |
| Pydantic integration | Validação automática |
| OpenAPI automático | Swagger UI sem configuração |
| Async/await | Performance接近 Node/Go |
| Dependency injection | Código modular |

### Instalação

```bash
uv add fastapi uvicorn
```

---

## 2. Hello World

```python
# main.py
from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def root():
    return {"message": "Hello, Pet Shop!"}

@app.get("/health")
def health():
    return {"status": "ok"}
```

### Executar

```bash
uvicorn main:app --reload
```

### Documentação Automática

Acesse:
*   `http://localhost:8000/docs` - Swagger UI
*   `http://localhost:8000/redoc` - ReDoc

---

## 3. Pydantic: Validação de Dados

Pydantic usa type hints para validar dados automaticamente.

### BaseModel para Input

```python
from pydantic import BaseModel, Field
from typing import Optional

class PetCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    species: str = Field(..., pattern="^(dog|cat|bird|hamster)$")
    age: Optional[int] = Field(None, ge=0, le=50)
    
    class Config:
        json_schema_extra = {
            "example": {
                "name": "Rex",
                "species": "dog",
                "age": 3
            }
        }
```

### Validações Automáticas

```python
# Válido
pet = PetCreate(name="Rex", species="dog", age=3)

# Inválido - 422 Unprocessable Entity
PetCreate(name="", species="dragon", age=-5)
# Pydantic levanta erro antes de chegar no banco
```

### Fields Comuns

| Field | Validação |
|-------|-----------|
| `...` | Obrigatório |
| `min_length`, `max_length` | Tamanho de string |
| `ge`, `le` | Greater/less than or equal (números) |
| `gt`, `lt` | Greater/less than (exclusivo) |
| `pattern` | Regex |
| `default` | Valor padrão |

---

## 4. Path Parameters

Parâmetros na URL: `/pets/1`

```python
from fastapi import FastAPI, HTTPException

app = FastAPI()

@app.get("/pets/{pet_id}")
def get_pet(pet_id: int):
    if pet_id < 1:
        raise HTTPException(status_code=400, detail="ID must be positive")
    
    pet = db.get(pet_id)
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    
    return pet
```

### Validação Automática

```bash
GET /pets/abc  # 422 - "pet_id" must be integer
GET /pets/1    # 200 OK
```

---

## 5. Query Parameters

Parâmetros após `?`: `/pets?species=dog&limit=10`

```python
from typing import Optional

@app.get("/pets")
def list_pets(
    species: Optional[str] = None,
    min_age: Optional[int] = None,
    limit: int = 10,
    offset: int = 0
):
    pets = db.query(Pet)
    
    if species:
        pets = pets.filter(Pet.species == species)
    if min_age:
        pets = pets.filter(Pet.age >= min_age)
    
    return pets.offset(offset).limit(limit).all()
```

### Validação com Query

```python
from fastapi import Query

@app.get("/pets")
def list_pets(
    limit: int = Query(10, ge=1, le=100),
    offset: int = Query(0, ge=0),
    sort_by: str = Query("name", pattern="^(name|age|happiness)$")
):
    ...
```

---

## 6. Request Body

Dados enviados no corpo (POST, PUT, PATCH).

```python
@app.post("/pets", status_code=201)
def create_pet(pet: PetCreate):
    # pet já está validado pelo Pydantic
    new_pet = Pet(**pet.model_dump())
    db.add(new_pet)
    db.commit()
    return new_pet
```

### Múltiplos Bodies

```python
class PetUpdate(BaseModel):
    name: Optional[str] = None
    age: Optional[int] = None

@app.patch("/pets/{pet_id}")
def update_pet(pet_id: int, updates: PetUpdate):
    pet = db.get(pet_id)
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    
    # Só atualiza campos enviados
    for key, value in updates.model_dump(exclude_unset=True).items():
        setattr(pet, key, value)
    
    db.commit()
    return pet
```

---

## 7. Response Models

Define o contrato de saída da API.

### Por Que Separar?

*   Banco pode ter campos internos (created_at, updated_at)
*   API pode querer omitir campos sensíveis
*   Pode querer formatar dados diferente

```python
from datetime import datetime

# Model do banco
class PetDB(BaseModel):
    id: int
    name: str
    species: str
    age: Optional[int]
    hunger_level: int = 50
    happiness: int = 50
    created_at: datetime
    updated_at: datetime
    internal_notes: Optional[str]  # Não expor!

# Model de resposta
class PetResponse(BaseModel):
    id: int
    name: str
    species: str
    age: Optional[int]
    hunger_level: int
    happiness: int
    status: str  # Calculado: "happy", "hungry", etc.

@app.get("/pets/{pet_id}", response_model=PetResponse)
def get_pet(pet_id: int):
    pet = db.get(pet_id)
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    return pet  # FastAPI filtra campos automaticamente
```

### Lista com Response Model

```python
class PetListResponse(BaseModel):
    pets: list[PetResponse]
    total: int
    cached: bool = False

@app.get("/pets", response_model=PetListResponse)
def list_pets(limit: int = 10, offset: int = 0):
    pets = db.query(Pet).offset(offset).limit(limit).all()
    total = db.query(Pet).count()
    return PetListResponse(pets=pets, total=total)
```

---

## 8. 422 Unprocessable Entity Automático

FastAPI + Pydantic retorna 422 automaticamente quando validação falha.

### Exemplo de Response

```bash
POST /pets
Content-Type: application/json

{"name": "", "species": "dragon", "age": -5}
```

```json
{
  "detail": [
    {
      "type": "string_too_short",
      "loc": ["body", "name"],
      "msg": "String should have at least 1 character",
      "input": "",
      "ctx": {"min_length": 1}
    },
    {
      "type": "pattern_mismatch",
      "loc": ["body", "species"],
      "msg": "String should match pattern '^(dog|cat|bird|hamster)$'",
      "input": "dragon"
    },
    {
      "type": "greater_than_equal",
      "loc": ["body", "age"],
      "msg": "Input should be greater than or equal to 0",
      "input": -5
    }
  ]
}
```

---

## 9. Estrutura de Projeto Recomendada

```
api/
├── src/
│   ├── main.py          # App e rotas principais
│   ├── config.py        # Configurações
│   ├── database.py      # Conexão com DB
│   ├── models.py        # Pydantic models
│   └── routes/
│       ├── pets.py      # Rotas de pets
│       ├── actions.py   # Rotas de ações
│       └── stats.py     # Rotas de estatísticas
├── Dockerfile
└── pyproject.toml
```

### main.py Modular

```python
from fastapi import FastAPI
from routes import pets, actions, stats

app = FastAPI(title="Pet Shop API")

app.include_router(pets.router, prefix="/pets", tags=["pets"])
app.include_router(actions.router, prefix="/pets", tags=["actions"])
app.include_router(stats.router, tags=["stats"])
```

---

## 10. Dependency Injection

FastAPI suporta injeção de dependências.

```python
from fastapi import Depends

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/pets/{pet_id}")
def get_pet(pet_id: int, db = Depends(get_db)):
    return db.query(Pet).filter(Pet.id == pet_id).first()
```

---

## 11. Cheat Sheet

| Conceito | Uso |
|----------|-----|
| `@app.get()` | Define rota GET |
| `BaseModel` | Classe Pydantic para validação |
| `Field(...)` | Campo obrigatório |
| `Optional[T]` | Campo opcional |
| `Query()` | Query param com validação |
| `response_model` | Define formato de saída |
| `HTTPException` | Retorna erro HTTP |
| `status_code=201` | Define código de sucesso |

---

## Próximos Passos

Agora vamos implementar **CRUD completo** conectando ao PostgreSQL.

→ [04_crud_completo.md](04_crud_completo.md)
