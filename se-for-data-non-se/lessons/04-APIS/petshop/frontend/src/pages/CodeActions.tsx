import { Code2 } from 'lucide-react';

export default function CodeActions() {
  const actionsCode = `@router.post("/{pet_id}/feed", response_model=PetResponse)
async def feed_pet(pet_id: int, session: AsyncSession = Depends(get_session)):
    pet = await session.get(Pet, pet_id)
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    
    if pet.status == "sleeping":
        raise HTTPException(status_code=400, detail="Pet is sleeping. Wake it up first!")
    
    old_hunger = pet.hunger_level
    pet.hunger_level = max(0, pet.hunger_level - 30)
    pet.happiness = min(100, pet.happiness + 5)
    
    await log_activity(session, pet_id, "feed", 
        {"hunger_before": old_hunger, "hunger_after": pet.hunger_level})
    await session.commit()
    await invalidate_pets_cache()
    return pet


@router.post("/{pet_id}/play", response_model=PetResponse)
async def play_with_pet(pet_id: int, session: AsyncSession = Depends(get_session)):
    pet = await session.get(Pet, pet_id)
    if pet.status == "sleeping":
        raise HTTPException(status_code=400, detail="Pet is sleeping. Wake it up first!")
    
    pet.happiness = min(100, pet.happiness + 25)
    pet.hunger_level = min(100, pet.hunger_level + 10)
    
    await log_activity(session, pet_id, "play", {...})
    await session.commit()
    return pet


@router.post("/{pet_id}/sleep", response_model=PetResponse)
async def put_pet_to_sleep(pet_id: int, session: AsyncSession = Depends(get_session)):
    pet = await session.get(Pet, pet_id)
    if pet.status == "sleeping":
        raise HTTPException(status_code=400, detail="Pet is already sleeping!")
    
    pet.status = "sleeping"
    pet.happiness = min(100, pet.happiness + 10)
    await session.commit()
    return pet


@router.post("/{pet_id}/wake", response_model=PetResponse)
async def wake_pet(pet_id: int, session: AsyncSession = Depends(get_session)):
    pet = await session.get(Pet, pet_id)
    if pet.status != "sleeping":
        raise HTTPException(status_code=400, detail="Pet is already awake!")
    
    pet.status = "awake"
    await session.commit()
    return pet`;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">
          <Code2 size={28} />
          Code: Actions
        </h1>
        <p className="page-subtitle">Lógica de negócio para interações com pets</p>
      </div>

      <div className="card">
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          <span className="badge badge-green">Conecta: PostgreSQL</span>
        </div>
        
        <pre className="code-block">
          <code>{actionsCode}</code>
        </pre>
        
        <div className="lesson-box" style={{ marginTop: '1rem' }}>
          <h4>O que faz</h4>
          <p>
            <strong>feed:</strong> Reduz fome em 30 pontos (mínimo 0), aumenta felicidade em 5. 
            Pet não pode comer enquanto dorme.
          </p>
          <p>
            <strong>play:</strong> Aumenta felicidade em 25, mas também aumenta fome em 10 
            (brincar cansa!). Pet não pode brincar dormindo.
          </p>
          <p>
            <strong>sleep:</strong> Coloca pet para dormir. Aumenta felicidade em 10 (descanso é bom!).
            Não pode dormir se já está dormindo.
          </p>
          <p>
            <strong>wake:</strong> Acorda o pet. Só funciona se estiver dormindo.
          </p>
          <p>
            Todas as ações são registradas no log de atividades para histórico.
          </p>
        </div>
      </div>
    </div>
  );
}
