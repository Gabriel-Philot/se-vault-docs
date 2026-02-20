import { Plus, SlidersHorizontal } from 'lucide-react';
import { useEffect, useState } from 'react';
import DishCard from '../components/dishes/DishCard';

interface Dish {
  id: number;
  name: string;
  category: string;
  price: number;
  preparation_time: number;
  freshness: number;
  popularity: number;
  status: string;
}

interface FormData {
  name: string;
  category: string;
  price: string;
  preparation_time: string;
}

const CATEGORIES = ['entree', 'plat', 'dessert', 'fromage'];

export default function LaCarte() {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDish, setEditingDish] = useState<Dish | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    category: 'plat',
    price: '',
    preparation_time: '',
  });

  useEffect(() => {
    void fetchDishes();
  }, [activeCategory]);

  async function fetchDishes() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ sort_by: 'name', order: 'asc', limit: '100' });
      if (activeCategory) params.append('category', activeCategory);

      const res = await fetch(`/api/dishes?${params.toString()}`);
      const data = await res.json();
      setDishes(data.dishes || []);
    } finally {
      setLoading(false);
    }
  }

  function openCreateModal() {
    setEditingDish(null);
    setFormData({ name: '', category: 'plat', price: '', preparation_time: '' });
    setModalOpen(true);
  }

  function openEditModal(dish: Dish) {
    setEditingDish(dish);
    setFormData({
      name: dish.name,
      category: dish.category,
      price: String(dish.price),
      preparation_time: String(dish.preparation_time),
    });
    setModalOpen(true);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const payload = {
      name: formData.name,
      category: formData.category,
      price: Number(formData.price),
      preparation_time: Number(formData.preparation_time),
    };

    if (editingDish) {
      await fetch(`/api/dishes/${editingDish.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } else {
      await fetch('/api/dishes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    }

    setModalOpen(false);
    await fetchDishes();
  }

  async function deleteDish(dish: Dish) {
    if (!window.confirm(`Supprimer ${dish.name} ?`)) return;
    await fetch(`/api/dishes/${dish.id}`, { method: 'DELETE' });
    await fetchDishes();
  }

  async function prepareDish(dish: Dish) {
    await fetch(`/api/dishes/${dish.id}/prepare`, { method: 'POST' });
    await fetchDishes();
  }

  async function serveDish(dish: Dish) {
    await fetch(`/api/dishes/${dish.id}/serve`, { method: 'POST' });
    await fetchDishes();
  }

  async function archiveToggle(dish: Dish) {
    const action = dish.status === 'available' ? 'archive' : 'reactivate';
    await fetch(`/api/dishes/${dish.id}/${action}`, { method: 'POST' });
    await fetchDishes();
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">La Carte</h1>
        <p className="page-subtitle">Gestion CRUD des plats, categories et service.</p>
      </div>

      <div className="carte-filters-wrap">
        <div className="card-header carte-filters-inner">
          <div className="filters-row">
            <div className="category-tabs">
              <button className={`tab-btn ${activeCategory === '' ? 'active' : ''}`} onClick={() => setActiveCategory('')}>
                Tous
              </button>
              {CATEGORIES.map((category) => (
                <button
                  key={category}
                  className={`tab-btn ${activeCategory === category ? 'active' : ''}`}
                  onClick={() => setActiveCategory(category)}
                >
                  {category}
                </button>
              ))}
            </div>
            <button className="btn btn-secondary"><SlidersHorizontal size={15} /> Filtres actifs</button>
          </div>
          <button className="btn btn-primary" onClick={openCreateModal}><Plus size={16} /> Ajouter un plat</button>
        </div>
      </div>

      {loading ? (
        <div className="card">Chargement...</div>
      ) : dishes.length === 0 ? (
        <div className="card">
          <p className="page-subtitle">Aucun plat dans cette categorie.</p>
          <img src="/images/ui/empty-plate.png" alt="Assiette vide" style={{ width: 180, marginTop: 12 }} />
        </div>
      ) : (
        <div className="dishes-grid">
          {dishes.map((dish) => (
            <DishCard
              key={dish.id}
              dish={dish}
              onPrepare={prepareDish}
              onServe={serveDish}
              onArchiveToggle={archiveToggle}
              onEdit={openEditModal}
              onDelete={deleteDish}
            />
          ))}
        </div>
      )}

      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{editingDish ? 'Modifier le plat' : 'Creer un plat'}</h3>
              <button className="modal-close" onClick={() => setModalOpen(false)}>&times;</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Nom</label>
                <input
                  className="form-input"
                  value={formData.name}
                  onChange={(event) => setFormData({ ...formData, name: event.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Categorie</label>
                <select
                  className="form-input"
                  value={formData.category}
                  onChange={(event) => setFormData({ ...formData, category: event.target.value })}
                >
                  {CATEGORIES.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-2">
                <div className="form-group">
                  <label className="form-label">Prix</label>
                  <input
                    className="form-input"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(event) => setFormData({ ...formData, price: event.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Preparation (min)</label>
                  <input
                    className="form-input"
                    type="number"
                    min="0"
                    value={formData.preparation_time}
                    onChange={(event) => setFormData({ ...formData, preparation_time: event.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Annuler</button>
                <button type="submit" className="btn btn-primary">{editingDish ? 'Mettre a jour' : 'Creer'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
