// src/components/game/TrumpCard.tsx
import React from 'react';
import { Card } from 'react-bootstrap';
import { Card as CardType } from '../../shared/types';
import GameCard from './GameCard';

interface TrumpCardProps {
  trump: CardType | null;
}

const TrumpCard: React.FC<TrumpCardProps> = ({ trump }) => {
  if (!trump) {
    return (
      <Card className="trump-card-container text-center">
        <Card.Body className="py-2">
          <div className="text-muted">
            <div>🃏</div>
            <small>Козырь неизвестен</small>
          </div>
        </Card.Body>
      </Card>
    );
  }

  const getSuitName = (suit: string) => {
    switch (suit) {
      case '♠': return 'Пики';
      case '♥': return 'Червы';
      case '♦': return 'Бубны';
      case '♣': return 'Трефы';
      default: return 'Неизвестно';
    }
  };

  const getSuitColor = (suit: string) => {
    return suit === '♥' || suit === '♦' ? 'text-danger' : 'text-dark';
  };

  return (
    <Card className="trump-card-container">
      <Card.Body className="py-2">
        {/* Заголовок */}
        <div className="text-center mb-2">
          <small className="text-muted fw-bold">КОЗЫРЬ</small>
        </div>

        {/* Козырная карта */}
        <div className="d-flex justify-content-center mb-2">
          <GameCard
            card={trump}
            size="small"
            isTrump={true}
          />
        </div>

        {/* Информация о козыре */}
        <div className="text-center">
          <div className={`fw-bold ${getSuitColor(trump.suit)}`}>
            {trump.suit} {getSuitName(trump.suit)}
          </div>
          <small className="text-muted">
            {trump.rank} {trump.suit}
          </small>
        </div>
      </Card.Body>
    </Card>
  );
};

export default TrumpCard;
