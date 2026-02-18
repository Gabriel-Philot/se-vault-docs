import { useEffect, useState } from 'react';
import { PawPrint, Plus, ArrowUpDown } from 'lucide-react';
import PetCard from '../components/pets/PetCard';

interface Pet {
  id: number;
  name: string;
  species: string;
  age: number | null;
  hunger_level: number;
  happiness: number;
  status: string;
}

interface FormData {
  name: string;
  species: string;
  age: string;
}

const SPECIES = ['dog', 'cat', 'bird', 'hamster', 'fish'];

const SPECIES_LABELS: Record<string, string> = {
  dog: '🐕 Cachorro',
  cat: '🐱 Gato',
  bird: '🐦 Pássaro',
  hamster: '🐹 Hamster',
  fish: '🐠 Peixe',
};

export default function PetManager() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editPet, setEditPet] = useState<Pet | null>(null);
  const [formData, setFormData] = useState<FormData>({ name: '', species: 'dog', age: '' });
  const [filters, setFilters] = useState({ species: '', sort_by: 'name', order: 'asc' });

  useEffect(() => {
    fetchPets();
  }, [filters]);

  async function fetchPets() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.species) params.append('species', filters.species);
      params.append('sort_by', filters.sort_by);
      params.append('order', filters.order);

      const res = await fetch(`/api/pets?${params}`);
      const data = await res.json();
      setPets(data.pets || []);
    } catch (error) {
      console.error('Failed to fetch pets:', error);
    } finally {
      setLoading(false);
    }
  }

  function openCreateModal() {
    setEditPet(null);
    setFormData({ name: '', species: 'dog', age: '' });
    setShowModal(true);
  }

  function openEditModal(pet: Pet) {
    setEditPet(pet);
    setFormData({
      name: pet.name,
      species: pet.species,
      age: pet.age?.toString() || '',
    });
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const payload = {
      name: formData.name,
      species: formData.species,
      age: formData.age ? parseInt(formData.age) : null,
    };

    try {
      if (editPet) {
        await fetch(`/api/pets/${editPet.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch('/api/pets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }
      setShowModal(false);
      fetchPets();
    } catch (error) {
      console.error('Failed to save pet:', error);
    }
  }

  async function deletePet(pet: Pet) {
    if (!confirm(`Tem certeza que deseja excluir ${pet.name}?`)) return;

    try {
      await fetch(`/api/pets/${pet.id}`, { method: 'DELETE' });
      fetchPets();
    } catch (error) {
      console.error('Failed to delete pet:', error);
    }
  }

  async function feedPet(pet: Pet) {
    try {
      await fetch(`/api/pets/${pet.id}/feed`, { method: 'POST' });
      fetchPets();
    } catch (error) {
      console.error('Failed to feed pet:', error);
    }
  }

  async function playWithPet(pet: Pet) {
    try {
      await fetch(`/api/pets/${pet.id}/play`, { method: 'POST' });
      fetchPets();
    } catch (error) {
      console.error('Failed to play with pet:', error);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">
          <PawPrint size={28} />
          Meus Pets
        </h1>
        <p className="page-subtitle">
          Gerencie seus pets - alimente, brinque e cuide deles!
        </p>
      </div>

      <div className="card">
        <div className="card-header">
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <select
              className="form-input"
              value={filters.species}
              onChange={(e) => setFilters({ ...filters, species: e.target.value })}
              style={{ width: 'auto' }}
            >
              <option value="">Todas Especies</option>
              {SPECIES.map((s) => (
                <option key={s} value={s}>{SPECIES_LABELS[s]}</option>
              ))}
            </select>
            <select
              className="form-input"
              value={filters.sort_by}
              onChange={(e) => setFilters({ ...filters, sort_by: e.target.value })}
              style={{ width: 'auto' }}
            >
              <option value="name">Ordenar por Nome</option>
              <option value="age">Ordenar por Idade</option>
              <option value="happiness">Ordenar por Felicidade</option>
              <option value="hunger_level">Ordenar por Fome</option>
            </select>
            <button
              className="btn btn-secondary"
              onClick={() => setFilters({ ...filters, order: filters.order === 'asc' ? 'desc' : 'asc' })}
            >
              <ArrowUpDown size={16} />
            </button>
          </div>
          <button className="btn btn-primary" onClick={openCreateModal}>
            <Plus size={16} style={{ marginRight: '0.5rem' }} />
            Adicionar Pet
          </button>
        </div>

        {loading ? (
          <p>Carregando...</p>
        ) : pets.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>
            Nenhum pet encontrado. Adicione seu primeiro pet!
          </p>
        ) : (
          <div className="pets-grid">
            {pets.map((pet) => (
              <PetCard
                key={pet.id}
                pet={pet}
                onFeed={feedPet}
                onPlay={playWithPet}
                onEdit={openEditModal}
                onDelete={deletePet}
              />
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{editPet ? 'Editar Pet' : 'Adicionar Pet'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Nome</label>
                <input
                  className="form-input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="Nome do pet"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Especie</label>
                <select
                  className="form-input"
                  value={formData.species}
                  onChange={(e) => setFormData({ ...formData, species: e.target.value })}
                >
                  {SPECIES.map((s) => (
                    <option key={s} value={s}>{SPECIES_LABELS[s]}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Idade (opcional)</label>
                <input
                  type="number"
                  className="form-input"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  min="0"
                  max="50"
                  placeholder="Em anos"
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {editPet ? 'Atualizar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
