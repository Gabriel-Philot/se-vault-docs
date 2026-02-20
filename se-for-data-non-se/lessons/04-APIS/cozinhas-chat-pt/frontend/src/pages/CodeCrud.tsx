import { Code2, RefreshCw, Server } from 'lucide-react';

export default function CodeCrud() {
  const code = `@router.get("", response_model=DishListResponse)
@cache_response(ttl=5)
async def list_dishes(...):
    query = select(Dish)
    # filtres + pagination + tri
    return {"dishes": dishes, "total": total}

@router.post("", response_model=DishResponse, status_code=201)
async def create_dish(dish_data: DishCreate, session: AsyncSession = Depends(get_session)):
    dish = Dish(**dish_data.model_dump())
    session.add(dish)
    await session.commit()
    await invalidate_dishes_cache()
    return dish

@router.patch("/{dish_id}", response_model=DishResponse)
async def partial_update_dish(...):
    ...`;

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title"><Code2 size={26} /> Codigo: CRUD</h1>
        <p className="page-subtitle">Endpoints de criar, ler, atualizar e excluir com orquestracao de persistencia.</p>
      </div>

      <div className="code-page-grid">
        <section className="code-panel">
          <div className="code-panel-head">
            <span className="code-panel-title">routes/dishes.py</span>
            <span className="badge badge-success"><Server size={12} /> API</span>
          </div>
          <pre className="code-block"><code>{code}</code></pre>
        </section>

        <aside className="code-note">
          <h3 className="card-title" style={{ marginBottom: '0.5rem' }}>Pontos-chave</h3>
          <p className="page-subtitle" style={{ marginBottom: '0.6rem' }}>Filtros: category, min_price, max_price e min_popularity.</p>
          <p className="page-subtitle" style={{ marginBottom: '0.6rem' }}>Paginacao e ordenacao mantem a lista estavel no front.</p>
          <div className="lesson-box"><RefreshCw size={14} style={{ marginRight: 6 }} /> Cada escrita dispara invalidate_dishes_cache().</div>
        </aside>
      </div>
    </div>
  );
}
