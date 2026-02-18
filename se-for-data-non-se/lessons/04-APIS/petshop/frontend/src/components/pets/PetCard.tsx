import { useState } from 'react';

interface Pet {
  id: number;
  name: string;
  species: string;
  age: number | null;
  hunger_level: number;
  happiness: number;
  status: string;
}

interface PetCardProps {
  pet: Pet;
  onFeed: (pet: Pet) => void;
  onPlay: (pet: Pet) => void;
  onEdit: (pet: Pet) => void;
  onDelete: (pet: Pet) => void;
}

const PET_EMOJIS: Record<string, Record<string, string>> = {
  dog: { happy: '🐕', neutral: '🐶', hungry: '🦮', sad: '🐕‍🦺' },
  cat: { happy: '😺', neutral: '🐱', hungry: '🙀', sad: '😿' },
  bird: { happy: '🐦', neutral: '🐤', hungry: '🦜', sad: '🐧' },
  hamster: { happy: '🐹', neutral: '🐹', hungry: '🐹', sad: '🐹' },
  fish: { happy: '🐠', neutral: '🐟', hungry: '🐡', sad: '🌊' },
};

function getPetMood(pet: Pet): string {
  if (pet.happiness >= 70 && pet.hunger_level <= 30) return 'happy';
  if (pet.hunger_level >= 70) return 'hungry';
  if (pet.happiness < 30) return 'sad';
  return 'neutral';
}

function getPetEmoji(pet: Pet): string {
  const species = pet.species.toLowerCase();
  const mood = getPetMood(pet);
  return PET_EMOJIS[species]?.[mood] || '🐾';
}

function getAnimationClass(pet: Pet): string {
  const mood = getPetMood(pet);
  if (mood === 'happy') return 'bounce';
  if (mood === 'hungry') return 'shake';
  if (mood === 'sad') return '';
  return 'wiggle';
}

export default function PetCard({ pet, onFeed, onPlay, onEdit, onDelete }: PetCardProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleAction = (action: () => void) => {
    setIsAnimating(true);
    action();
    setTimeout(() => setIsAnimating(false), 300);
  };

  return (
    <div className={`pet-card ${isAnimating ? 'animate' : ''}`}>
      <div className="pet-card-header">
        <span className={`pet-emoji ${getAnimationClass(pet)}`}>
          {getPetEmoji(pet)}
        </span>
        <div>
          <div className="pet-card-name">{pet.name}</div>
          <div className="pet-card-species">
            {pet.species} {pet.age ? `• ${pet.age} anos` : ''}
          </div>
        </div>
      </div>

      <div className="pet-card-stats">
        <div className="pet-stat">
          <span className="pet-stat-icon">😊</span>
          <div className="pet-stat-bar">
            <div 
              className="pet-stat-fill happiness"
              style={{ width: `${pet.happiness}%` }}
            />
          </div>
          <span className="pet-stat-value">{pet.happiness}%</span>
        </div>
        
        <div className="pet-stat">
          <span className="pet-stat-icon">🍖</span>
          <div className="pet-stat-bar">
            <div 
              className="pet-stat-fill hunger"
              style={{ width: `${pet.hunger_level}%` }}
            />
          </div>
          <span className="pet-stat-value">{pet.hunger_level}%</span>
        </div>
      </div>

      <div className="pet-card-actions">
        <button 
          className="pet-btn pet-btn-feed"
          onClick={() => handleAction(() => onFeed(pet))}
        >
          🍖 Alimentar
        </button>
        <button 
          className="pet-btn pet-btn-play"
          onClick={() => handleAction(() => onPlay(pet))}
        >
          🎓 Brincar
        </button>
        <button 
          className="pet-btn pet-btn-edit"
          onClick={() => onEdit(pet)}
        >
          ✏️
        </button>
        <button 
          className="pet-btn pet-btn-delete"
          onClick={() => onDelete(pet)}
        >
          🗑️
        </button>
      </div>
    </div>
  );
}
