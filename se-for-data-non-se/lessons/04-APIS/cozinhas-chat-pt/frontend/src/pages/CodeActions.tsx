import { Code2, Flame, Utensils } from 'lucide-react';

export default function CodeActions() {
  const code = `@router.post("/{dish_id}/prepare", response_model=DishResponse)
async def prepare_dish(...):
    dish.freshness = min(100, dish.freshness + 30)
    dish.popularity = min(100, dish.popularity + 5)
    await log_activity(session, dish_id, "prepare", {...})

@router.post("/{dish_id}/serve", response_model=DishResponse)
async def serve_dish(...):
    dish.popularity = min(100, dish.popularity + 25)
    dish.freshness = max(0, dish.freshness - 10)

@router.post("/{dish_id}/archive", response_model=DishResponse)
@router.post("/{dish_id}/reactivate", response_model=DishResponse)`;

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title"><Code2 size={26} /> Codigo: Acoes</h1>
        <p className="page-subtitle">Regras de negocio de servico e transicoes de estado dos pratos.</p>
      </div>

      <div className="code-page-grid">
        <section className="code-panel">
          <div className="code-panel-head">
            <span className="code-panel-title">routes/actions.py</span>
            <span className="badge badge-success"><Utensils size={12} /> Service</span>
          </div>
          <pre className="code-block"><code>{code}</code></pre>
        </section>

        <aside className="code-note">
          <h3 className="card-title" style={{ marginBottom: '0.5rem' }}>Efeitos de negocio</h3>
          <p className="page-subtitle" style={{ marginBottom: '0.6rem' }}>prepare aumenta frescor, serve aumenta popularidade.</p>
          <p className="page-subtitle" style={{ marginBottom: '0.6rem' }}>archive/reactivate controla a disponibilidade do menu.</p>
          <div className="lesson-box"><Flame size={14} style={{ marginRight: 6 }} /> Cada acao registra um evento em activity_log.</div>
        </aside>
      </div>
    </div>
  );
}
