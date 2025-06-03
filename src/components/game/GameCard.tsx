// src/components/game/GameCard.tsx
import React from 'react';
import { Card as CardType } from '../../shared/types';

interface GameCardProps {
  card: CardType;
  isSelected?: boolean;
  isPlayable?: boolean;
  isTrump?: boolean;
  onClick?: () => void;
  size?: 'small' | 'medium' | 'large';
}

const GameCard: React.FC<GameCardProps> = ({
  card,
  isSelected = false,
  isPlayable = false,
  isTrump = false,
  onClick,
  size = 'medium'
}) => {
  const getSuitColor = (suit: string) => {
    return suit === '♥' || suit === '♦' ? 'text-danger' : 'text-dark';
  };

  const cardSizes = {
    small: { width: '35px', height: '50px', fontSize: '0.7rem' },
    medium: { width: '60px', height: '85px', fontSize: '0.9rem' },
    large: { width: '80px', height: '110px', fontSize: '1.1rem' }
  };

  const cardStyle = {
    ...cardSizes[size],
    cursor: onClick ? 'pointer' : 'default',
    border: isSelected ? '2px solid #007bff' : '1px solid #dee2e6',
    backgroundColor: isTrump ? '#fff3cd' : '#ffffff',
    transform: isSelected ? 'translateY(-5px)' : 'none',
    transition: 'all 0.2s ease',
    opacity: isPlayable ? 1 : 0.7,
  };

  return (
    <div
      className={`card game-card ${isSelected ? 'selected' : ''} ${isTrump ? 'trump' : ''}`}
      style={cardStyle}
      onClick={onClick}
    >
      <div className="card-body p-1 d-flex flex-column justify-content-between text-center">
        <div className={`card-rank ${getSuitColor(card.suit)}`} style={{ fontSize: cardSizes[size].fontSize }}>
          {card.rank}
        </div>
        <div className={`card-suit ${getSuitColor(card.suit)}`} style={{ fontSize: cardSizes[size].fontSize }}>
          {card.suit}
        </div>
      </div>
    </div>
  );
};

export default GameCard;
