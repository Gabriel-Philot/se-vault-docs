import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Home, PawPrint, Activity } from 'lucide-react';

interface Pet {
  id: number;
  name: string;
  species: string;
  age: number | null;
  hunger_level: number;
  happiness: number;
  status: string;
}

interface Stats {
  total_pets: number;
  avg_happiness: number;
  avg_hunger: number;
  by_species: Record<string, number>;
  cached: boolean;
}

interface ActivityItem {
  id: number;
  pet_id: number;
  pet_name: string;
  action: string;
  details: Record<string, unknown> | null;
  created_at: string;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [pets, setPets] = useState<Pet[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [statsRes, petsRes, activityRes] = await Promise.all([
        fetch('/api/stats'),
        fetch('/api/pets?limit=5'),
        fetch('/api/activity?limit=5'),
      ]);

      const statsData = await statsRes.json();
      const petsData = await petsRes.json();
      const activityData = await activityRes.json();

      setStats(statsData);
      setPets(petsData.pets || []);
      setActivities(activityData.activities || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  }

  function formatTime(dateStr: string) {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  function getActionIcon(action: string) {
    switch (action) {
      case 'feed': return '🍖';
      case 'play': return '🎾';
      case 'sleep': return '💤';
      case 'wake': return '☀️';
      default: return '📝';
    }
  }

  function getPetEmoji(species: string): string {
    const emojis: Record<string, string> = {
      dog: '🐕',
      cat: '🐱',
      bird: '🐦',
      hamster: '🐹',
      fish: '🐠',
    };
    return emojis[species.toLowerCase()] || '🐾';
  }

  if (loading) {
    return <div className="card">Carregando...</div>;
  }

  const happyPets = pets.filter(p => p.happiness >= 70).length;
  const hungryPets = pets.filter(p => p.hunger_level >= 60).length;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">
          <Home size={28} />
          Dashboard
        </h1>
        <p className="page-subtitle">
          Bem-vindo ao Pet Shop API! Gerencie seus pets e explore a API.
        </p>
      </div>

      <div className="grid grid-4">
        <div className="card stat-card">
          <div className="stat-value">{stats?.total_pets || 0}</div>
          <div className="stat-label">
            <PawPrint size={14} style={{ display: 'inline', marginRight: '0.25rem' }} />
            Total de Pets
          </div>
        </div>
        <div className="card stat-card">
          <div className="stat-value" style={{ color: 'var(--pet-green-600)' }}>
            {happyPets}
          </div>
          <div className="stat-label">😊 Pets Felizes</div>
        </div>
        <div className="card stat-card">
          <div className="stat-value" style={{ color: 'var(--pet-orange-500)' }}>
            {hungryPets}
          </div>
          <div className="stat-label">🍖 Com Fome</div>
        </div>
        <div className="card stat-card">
          <div className="stat-value">
            {stats?.avg_happiness.toFixed(0) || 0}%
          </div>
          <div className="stat-label">Media Felicidade</div>
        </div>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">
              <Activity size={18} style={{ marginRight: '0.5rem' }} />
              Atividade Recente
            </h2>
            <Link to="/explorer" className="btn btn-secondary btn-sm">
              Ver API
            </Link>
          </div>
          {activities.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>Nenhuma atividade ainda</p>
          ) : (
            <table>
              <tbody>
                {activities.map((activity) => (
                  <tr key={activity.id}>
                    <td>
                      <span style={{ marginRight: '0.5rem' }}>{getActionIcon(activity.action)}</span>
                      <strong>{activity.pet_name}</strong> foi {activity.action === 'feed' ? 'alimentado' : activity.action === 'play' ? 'brincou' : activity.action}
                    </td>
                    <td style={{ textAlign: 'right', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                      {formatTime(activity.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="card-title">🐾 Seus Pets</h2>
            <Link to="/pets" className="btn btn-primary btn-sm">
              + Adicionar
            </Link>
          </div>
          {pets.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>Nenhum pet ainda. Adicione seu primeiro!</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Status</th>
                  <th>Felicidade</th>
                </tr>
              </thead>
              <tbody>
                {pets.map((pet) => (
                  <tr key={pet.id}>
                    <td>
                      <span style={{ marginRight: '0.5rem' }}>{getPetEmoji(pet.species)}</span>
                      <strong>{pet.name}</strong>
                      <span style={{ color: 'var(--text-muted)', marginLeft: '0.5rem', fontSize: '0.875rem' }}>
                        ({pet.species})
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${pet.status === 'sleeping' ? 'badge-gray' : 'badge-success'}`}>
                        {pet.status === 'sleeping' ? '💤 Dormindo' : '🟢 Acordado'}
                      </span>
                    </td>
                    <td style={{ width: '150px' }}>
                      <div className="progress-bar">
                        <div
                          className="progress-fill progress-success"
                          style={{ width: `${pet.happiness}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {stats?.cached && (
        <div className="lesson-box">
          <h4>Cache Ativo</h4>
          <p>
            Estes dados vieram do cache Redis (cached: true). Note o tempo de resposta mais rapido
            comparado a uma query direta no banco de dados!
          </p>
        </div>
      )}
    </div>
  );
}
