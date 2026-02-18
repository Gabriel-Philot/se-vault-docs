import { Code2 } from 'lucide-react';

export default function CodeModels() {
  const modelsCode = `class Species(str, Enum):
    DOG = "dog"
    CAT = "cat"
    BIRD = "bird"
    HAMSTER = "hamster"


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


class PetCreate(SQLModel):
    name: str = Field(min_length=1, max_length=100)
    species: Species
    age: Optional[int] = Field(default=None, ge=0, le=50)


class PetResponse(SQLModel):
    id: int
    name: str
    species: str
    age: Optional[int]
    hunger_level: int
    happiness: int
    status: str`;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">
          <Code2 size={28} />
          Code: Models
        </h1>
        <p className="page-subtitle">Modelos Pydantic/SQLModel para validação e persistência</p>
      </div>

      <div className="card">
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          <span className="badge badge-green">Conecta: PostgreSQL</span>
        </div>
        
        <pre className="code-block">
          <code>{modelsCode}</code>
        </pre>
        
        <div className="lesson-box" style={{ marginTop: '1rem' }}>
          <h4>O que faz</h4>
          <p>
            <strong>Species:</strong> Enum que define os tipos de pets permitidos (dog, cat, bird, hamster).
          </p>
          <p>
            <strong>Pet:</strong> Modelo de tabela do banco de dados com campos obrigatórios, opcionais e valores padrão. 
            Inclui validações como <code>ge=0, le=100</code> para níveis.
          </p>
          <p>
            <strong>PetCreate:</strong> Schema de entrada para criar pets - valida nome (tamanho), espécie e idade.
          </p>
          <p>
            <strong>PetResponse:</strong> Schema de saída - define quais campos são retornados na API.
          </p>
        </div>
      </div>
    </div>
  );
}
