import { Code2, Database, Layers } from 'lucide-react';

export default function CodeModels() {
  const code = `class Category(str, Enum):
    ENTREE = "entree"
    PLAT = "plat"
    DESSERT = "dessert"
    FROMAGE = "fromage"

class Dish(SQLModel, table=True):
    __tablename__ = "dishes"
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(max_length=100)
    category: str = Field(max_length=50)
    price: float = Field(ge=0)
    preparation_time: int = Field(ge=0)
    freshness: int = Field(default=50, ge=0, le=100)
    popularity: int = Field(default=50, ge=0, le=100)
    status: str = Field(default="available")`;

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title"><Code2 size={26} /> Codigo: Modelos</h1>
        <p className="page-subtitle">Estruturas de dados da cozinha, validacao e mapeamento SQLModel.</p>
      </div>

      <div className="code-page-grid">
        <section className="code-panel">
          <div className="code-panel-head">
            <span className="code-panel-title">models.py</span>
            <span className="badge badge-success"><Layers size={12} /> Schema</span>
          </div>
          <pre className="code-block"><code>{code}</code></pre>
        </section>

        <aside className="code-note">
          <h3 className="card-title" style={{ marginBottom: '0.5rem' }}>Leitura guiada</h3>
          <p className="page-subtitle" style={{ marginBottom: '0.6rem' }}>Category define os valores de negocio permitidos.</p>
          <p className="page-subtitle" style={{ marginBottom: '0.6rem' }}>Dish centraliza regras, defaults e limites (0-100).</p>
          <p className="page-subtitle">ActivityLog garante a rastreabilidade das acoes.</p>
          <div className="lesson-box"><Database size={14} style={{ marginRight: 6 }} /> Conecta diretamente PostgreSQL e os schemas de resposta da API.</div>
        </aside>
      </div>
    </div>
  );
}
