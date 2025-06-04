// src/components/game/GameControls.tsx
import React from 'react';
import { ButtonGroup, Button, Card } from 'react-bootstrap';
import { Card as CardType } from '../../shared/types';

interface GameControlsProps {
  phase: 'attack' | 'defend' | 'discard';
  isPlayerTurn: boolean;
  selectedCards: CardType[];
  onAttack: () => void;
  onTake: () => void;
  onPass: () => void;
}

const GameControls: React.FC<GameControlsProps> = ({
  phase,
  isPlayerTurn,
  selectedCards,
  onAttack,
  onTake,
  onPass
}) => {
  const getPhaseText = () => {
    switch (phase) {
      case 'attack': return 'Фаза атаки';
      case 'defend': return 'Фаза защиты';
      case 'discard': return 'Фаза сброса';
      default: return 'Неизвестная фаза';
    }
  };

  if (!isPlayerTurn) {
    return (
      <Card className="text-center">
        <Card.Body>
          <p className="text-muted mb-0">Ожидание хода противника...</p>
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card>
      <Card.Body>
        <div className="text-center mb-3">
          <small className="text-muted">{getPhaseText()}</small>
        </div>
        
        <ButtonGroup className="w-100" size="lg">
          {phase === 'attack' && (
            <Button
              variant="danger"
              onClick={onAttack}
              disabled={selectedCards.length === 0}
            >
              🗡️ Атаковать ({selectedCards.length})
            </Button>
          )}
          
          {phase === 'defend' && (
            <>
              <Button
                variant="warning"
                onClick={onTake}
              >
                📥 Взять карты
              </Button>
              <Button
                variant="success"
                onClick={onPass}
              >
                ✅ Пас
              </Button>
            </>
          )}
        </ButtonGroup>
      </Card.Body>
    </Card>
  );
};

export default GameControls;
