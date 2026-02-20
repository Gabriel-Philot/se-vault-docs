import { CalendarClock, ChefHat, Home, Star, Ticket } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

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

interface Stats {
  total_dishes: number;
  avg_price: number;
  avg_freshness: number;
  avg_popularity: number;
  by_category: Record<string, number>;
  cached: boolean;
}

interface ActivityItem {
  id: number;
  dish_id: number;
  dish_name: string;
  action: string;
  details: Record<string, unknown> | null;
  created_at: string;
}

export default function Salon() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetchData();
  }, []);

  async function fetchData() {
    try {
      const [statsRes, dishesRes, activityRes] = await Promise.all([
        fetch('/api/stats'),
        fetch('/api/dishes?limit=8'),
        fetch('/api/activity?limit=8'),
      ]);

      const statsData = await statsRes.json();
      const dishesData = await dishesRes.json();
      const activityData = await activityRes.json();

      setStats(statsData);
      setDishes(dishesData.dishes || []);
      setActivities(activityData.activities || []);
    } finally {
      setLoading(false);
    }
  }

  const availableCount = useMemo(() => dishes.filter((dish) => dish.status === 'available').length, [dishes]);

  if (loading) return <div className="card">Chargement...</div>;

  return (
    <div className="fade-in">
      <div className="page-header salon-header-row">
        <div>
          <h1 className="page-title"><Home size={26} /> Salon</h1>
          <p className="page-subtitle">Vue d ensemble du service en salle.</p>
        </div>
        <div className="salon-header-actions">
          <span className="service-time">Service du Soir - 19:40</span>
          <button className="btn btn-primary btn-sm">+ Nouvelle Reservation</button>
        </div>
      </div>

      <div className="grid grid-4">
        <div className="card stat-card">
          <div className="stat-value">{stats?.total_dishes || 0}</div>
          <div className="stat-label"><ChefHat size={13} style={{ marginRight: 4 }} /> Couverts ce soir</div>
        </div>
        <div className="card stat-card">
          <div className="stat-value">{availableCount}</div>
          <div className="stat-label"><CalendarClock size={13} style={{ marginRight: 4 }} /> Reservations</div>
        </div>
        <div className="card stat-card">
          <div className="stat-value">{Math.max(1, Math.round((activities.length || 1) / 2))}</div>
          <div className="stat-label"><Ticket size={13} style={{ marginRight: 4 }} /> Tickets cuisine</div>
        </div>
        <div className="card stat-card">
          <div className="stat-value">{(stats?.avg_popularity ? stats.avg_popularity / 20 : 0).toFixed(1)}</div>
          <div className="stat-label"><Star size={13} style={{ marginRight: 4 }} /> Note moyenne</div>
        </div>
      </div>

      <div className="grid grid-2" style={{ marginTop: '1rem' }}>
        <div className="card salon-table-card">
          <div className="card-header">
            <h2 className="card-title">Activite recente</h2>
            <Link className="btn btn-secondary btn-sm" to="/cuisine">Voir API</Link>
          </div>

          <table>
            <thead>
              <tr>
                <th>Heure</th>
                <th>Evenement</th>
                <th>Table</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {activities.length === 0 ? (
                <tr><td colSpan={4} style={{ color: 'var(--text-muted)' }}>Aucune activite.</td></tr>
              ) : (
                activities.map((item) => (
                  <tr key={item.id}>
                    <td>{new Date(item.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</td>
                    <td>{item.dish_name} {item.action}</td>
                    <td>{String(item.dish_id).padStart(2, '0')}</td>
                    <td><span className="badge badge-success">en cours</span></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="card salon-table-card">
          <div className="card-header">
            <h2 className="card-title">Reservations du soir</h2>
            <span className="page-subtitle">6 tables</span>
          </div>

          <table>
            <thead>
              <tr>
                <th>Heure</th>
                <th>Nom du client</th>
                <th>Couverts</th>
                <th>Table</th>
              </tr>
            </thead>
            <tbody>
              {dishes.slice(0, 6).map((dish, idx) => (
                <tr key={dish.id}>
                  <td>{`19:${(10 + idx * 5).toString().padStart(2, '0')}`}</td>
                  <td>{dish.name}</td>
                  <td>{(idx % 5) + 2}</td>
                  <td>{`0${idx + 2}`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {stats?.cached && (
        <div className="lesson-box">
          <h4>Cache Redis actif</h4>
          <p>Les statistiques affichent un cache-hit pour accelerer la lecture.</p>
        </div>
      )}
    </div>
  );
}
