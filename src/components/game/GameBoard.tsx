// src/components/game/GameBoard.tsx
import React from 'react';
import { Card, Row, Col } from 'react-bootstrap';
import { Card as CardType } from '../../shared/types';
import GameCard from './GameCard';

interface GameBoardProps {
  attackingCards: CardType[];
  defendingCards: CardType[];
  onDefend: (attackingCard: CardType) => void;
  canDefend: boolean;
  selectedCards: CardType[];
}

const GameBoard: React.FC<GameBoardProps> = ({
  attackingCards,
  defendingCards,
  onDefend,
  canDefend,
  selectedCards
}) => {
  return (
    <Card className="game-board p-3">
      <Card.Body>
        <h6 className="text-center mb-3">Игровое поле</h6>
        
        {attackingCards.length === 0 ? (
          <div className="text-center text-muted py-4">
            Ожидание первого хода...
          </div>
        ) : (
          <Row className="justify-content-center g-2">
            {attackingCards.map((attackCard, index) => {
              const defendCard = defendingCards[index];
              
              return (
                <Col xs="auto" key={attackCard.id}>
                  <div className="card-pair">
                    {/* Атакующая карта */}
                    <GameCard
                      card={attackCard}
                      size="medium"
                      onClick={canDefend ? () => onDefend(attackCard) : undefined}
                      isPlayable={canDefend && selectedCards.length === 1}
                    />
                    
                    {/* Защищающая карта */}
                    {defendCard && (
                      <div className="defending-card">
                        <GameCard
                          card={defendCard}
                          size="medium"
                        />
                      </div>
                    )}
                  </div>
                </Col>
              );
            })}
          </Row>
        )}
      </Card.Body>
    </Card>
  );
};

export default GameBoard;
