// src/components/game/PlayerHand.tsx
import React from 'react';
import { Card, Row, Col } from 'react-bootstrap';
import { Card as CardType } from '../../shared/types';
import GameCard from './GameCard';

interface PlayerHandProps {
  cards: CardType[];
  selectedCards: CardType[];
  onCardSelect: (card: CardType) => void;
  trump: CardType | null;
}

const PlayerHand: React.FC<PlayerHandProps> = ({
  cards,
  selectedCards,
  onCardSelect,
  trump
}) => {
  const isCardSelected = (card: CardType) => {
    return selectedCards.some(c => c.id === card.id);
  };

  const isCardTrump = (card: CardType) => {
    return trump && card.suit === trump.suit;
  };

  return (
    <Card className="player-hand">
      <Card.Body>
        <h6 className="text-center mb-3">Ваши карты ({cards.length})</h6>
        
        {cards.length === 0 ? (
          <div className="text-center text-muted py-3">
            Карты закончились
          </div>
        ) : (
          <Row className="justify-content-center g-1">
            {cards.map((card) => (
              <Col xs="auto" key={card.id}>
                <GameCard
                  card={card}
                  size="medium"
                  isSelected={isCardSelected(card)}
                  isTrump={isCardTrump(card)}
                  onClick={() => onCardSelect(card)}
                  isPlayable={true}
                />
              </Col>
            ))}
          </Row>
        )}
      </Card.Body>
    </Card>
  );
};

export default PlayerHand;
