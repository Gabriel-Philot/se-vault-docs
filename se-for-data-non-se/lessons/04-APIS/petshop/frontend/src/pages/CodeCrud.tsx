import { Code2 } from 'lucide-react';

export default function CodeCrud() {
  const crudCode = `@router.get("", response_model=PetListResponse)
@cache_response(ttl=5)
async def list_pets(
    species: Optional[str] = None,
    min_age: Optional[int] = None,
    max_age: Optional[int] = None,
    min_happiness: Optional[int] = None,
    limit: int = Query(10, ge=1, le=100),
    offset: int = Query(0, ge=0),
    sort_by: str = Query("name", pattern="^(name|age|happiness|hunger_level|created_at)$"),
    order: str = Query("asc", pattern="^(asc|desc)$"),
    session: AsyncSession = Depends(get_session),
):
    query = select(Pet)
    # ... filtros e paginação
    return {"pets": pets, "total": total}


@router.post("", response_model=PetResponse, status_code=201)
async def create_pet(pet_data: PetCreate, session: AsyncSession = Depends(get_session)):
    pet = Pet(**pet_data.model_dump())
    session.add(pet)
    await session.commit()
    await session.refresh(pet)
    await invalidate_pets_cache()
    return pet


@router.put("/{pet_id}", response_model=PetResponse)
async def update_pet(pet_id: int, pet_data: PetCreate, session: AsyncSession = Depends(get_session)):
    pet = await session.get(Pet, pet_id)
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    for key, value in pet_data.model_dump().items():
        setattr(pet, key, value)
    pet.updated_at = datetime.utcnow()
    await session.commit()
    await invalidate_pets_cache()
    return pet


@router.patch("/{pet_id}", response_model=PetResponse)
async def partial_update_pet(pet_id: int, pet_data: PetUpdate, session: AsyncSession = Depends(get_session)):
    pet = await session.get(Pet, pet_id)
    update_data = pet_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(pet, key, value)
    await session.commit()
    await invalidate_pets_cache()
    return pet


@router.delete("/{pet_id}", status_code=204)
async def delete_pet(pet_id: int, session: AsyncSession = Depends(get_session)):
    pet = await session.get(Pet, pet_id)
    await session.delete(pet)
    await session.commit()
    await invalidate_pets_cache()
    return None`;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">
          <Code2 size={28} />
          Code: CRUD
        </h1>
        <p className="page-subtitle">Operações Create, Read, Update, Delete da API</p>
      </div>

      <div className="card">
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          <span className="badge badge-green">PostgreSQL</span>
          <span className="badge badge-red">Redis</span>
        </div>
        
        <pre className="code-block">
          <code>{crudCode}</code>
        </pre>
        
        <div className="lesson-box" style={{ marginTop: '1rem' }}>
          <h4>O que faz</h4>
          <p>
            <strong>GET /pets:</strong> Lista pets com filtros opcionais (species, age, happiness), 
            paginação (limit/offset) e ordenação dinâmica.
          </p>
          <p>
            <strong>POST /pets:</strong> Cria novo pet usando PetCreate para validação. 
            Invalida cache após criação.
          </p>
          <p>
            <strong>PUT /pets/{'{id}'}:</strong> Atualização completa - substitui todos os campos.
          </p>
          <p>
            <strong>PATCH /pets/{'{id}'}:</strong> Atualização parcial - só modifica campos enviados 
            (<code>exclude_unset=True</code>).
          </p>
          <p>
            <strong>DELETE /pets/{'{id}'}:</strong> Remove pet e invalida cache.
          </p>
        </div>
      </div>
    </div>
  );
}
