import { Archive, ChefHat, Pencil, RotateCcw, Star, Trash2, Utensils } from 'lucide-react';

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

interface DishCardProps {
  dish: Dish;
  onPrepare: (dish: Dish) => void;
  onServe: (dish: Dish) => void;
  onArchiveToggle: (dish: Dish) => void;
  onEdit: (dish: Dish) => void;
  onDelete: (dish: Dish) => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  entree: 'Entree',
  plat: 'Plat',
  dessert: 'Dessert',
  fromage: 'Fromage',
};

function photoPath(name: string) {
  const map: Record<string, string> = {
    'Filet de Boeuf Rossini': '/images/dishes/filet-boeuf-rossini.jpg',
    "Saumon a l'Oseille": '/images/dishes/saumon-oseille.jpg',
    "Soupe a l'Oignon": '/images/dishes/soupe-oignon.jpg',
    'Fondant au Chocolat': '/images/dishes/fondant-chocolat.jpg',
    'Plateau de Fromages': '/images/dishes/plateau-fromages.jpg',
  };
  return map[name] || '/images/ui/empty-plate.png';
}

export default function DishCard({
  dish,
  onPrepare,
  onServe,
  onArchiveToggle,
  onEdit,
  onDelete,
}: DishCardProps) {
  return (
    <article className="dish-card">
      <img
        src={photoPath(dish.name)}
        onError={(event) => {
          (event.currentTarget as HTMLImageElement).src = '/images/ui/empty-plate.png';
        }}
        alt={dish.name}
        className="dish-image"
      />
      <div className="dish-body">
        <div className="dish-head">
          <h3 className="dish-name">{dish.name}</h3>
          <span className={`badge badge-category badge-${dish.category}`}>{CATEGORY_LABELS[dish.category] || dish.category}</span>
        </div>

        <div className="dish-meta">
          <span>{dish.preparation_time} min</span>
          <span>{dish.price.toFixed(2)} EUR</span>
          <span className={`badge ${dish.status === 'available' ? 'badge-success' : 'badge-gray'}`}>
            {dish.status}
          </span>
        </div>

        <div className="dish-meter">
          <div className="dish-meter-row">
            <span><ChefHat size={14} /> Fraicheur</span>
            <strong>{dish.freshness}%</strong>
          </div>
          <div className="progress-bar">
            <div className="progress-fill progress-success" style={{ width: `${dish.freshness}%` }} />
          </div>
        </div>

        <div className="dish-meter">
          <div className="dish-meter-row">
            <span><Star size={14} /> Popularite</span>
            <strong>{dish.popularity}%</strong>
          </div>
          <div className="progress-bar">
            <div className="progress-fill progress-warning" style={{ width: `${dish.popularity}%` }} />
          </div>
        </div>

        <div className="dish-actions">
          <button className="btn btn-secondary btn-sm" onClick={() => onPrepare(dish)}><ChefHat size={14} /> Preparer</button>
          <button className="btn btn-primary btn-sm" onClick={() => onServe(dish)}><Utensils size={14} /> Servir</button>
          <button className="btn btn-secondary btn-sm" onClick={() => onArchiveToggle(dish)}>
            {dish.status === 'available' ? <Archive size={14} /> : <RotateCcw size={14} />}
            {dish.status === 'available' ? 'Archiver' : 'Reactiver'}
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => onEdit(dish)}><Pencil size={14} /></button>
          <button className="btn btn-danger btn-sm" onClick={() => onDelete(dish)}><Trash2 size={14} /></button>
        </div>
      </div>
    </article>
  );
}
