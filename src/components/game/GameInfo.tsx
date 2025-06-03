// src/components/game/GameInfo.tsx
import React from 'react';
import { Card, Badge, Row, Col } from 'react-bootstrap';
import { GameState, Player } from '../../shared/types';

interface GameInfoProps {
  gameState: GameState;
  currentPlayer: Player | null;
  isPlayerTurn: boolean;
}

const GameInfo: React.FC<GameInfoProps> = ({
  gameState,
  currentPlayer,
  isPlayerTurn
}) => {
  const getPhaseText = (phase: string) => {
    switch (phase) {
      case 'attack': return 'Атака';
      case 'defend': return 'Защита';
      case 'discard': return 'Сброс';
      default: return 'Неизвестно';
    }
  };

  const getPhaseVariant = (phase: string) => {
    switch (phase) {
      case 'attack': return 'danger';
      case 'defend': return 'warning';
      case 'discard': return 'info';
      default: return 'secondary';
    }
  };

  const getCurrentPlayerName = () => {
    const currentGamePlayer = gameState.players.find(p => p.id === gameState.currentPlayerId);
    return currentGamePlayer?.name || 'Неизвестно';
  };

  const getDeckCount = () => {
    return gameState.deck?.length || 0;
  };

  return (
    <Card className="game-info">
      <Card.Body className="py-2">
        <Row className="align-items-center text-center">
          {/* Фаза игры */}
          <Col xs={3}>
            <div>
              <Badge bg={getPhaseVariant(gameState.phase)} className="mb-1">
                {getPhaseText(gameState.phase)}
              </Badge>
              <div>
                <small className="text-muted">Фаза</small>
              </div>
            </div>
          </Col>

          {/* Текущий игрок */}
          <Col xs={4}>
            <div>
              <div className="fw-bold">
                {isPlayerTurn ? (
                  <span className="text-success">Ваш ход</span>
                ) : (
                  <span className="text-muted">{getCurrentPlayerName()}</span>
                )}
              </div>
              <small className="text-muted">Ходит</small>
            </div>
          </Col>

          {/* Колода */}
          <Col xs={2}>
            <div>
              <div className="fw-bold">{getDeckCount()}</div>
              <small className="text-muted">Колода</small>
            </div>
          </Col>

          {/* Игроки */}
          <Col xs={3}>
            <div>
              <div className="fw-bold">{gameState.players.length}</div>
              <small className="text-muted">Игроки</small>
            </div>
          </Col>
        </Row>

        {/* Дополнительная информация */}
        {gameState.winner && (
          <Row className="mt-2">
            <Col>
              <Alert variant="success" className="mb-0 py-1 text-center">
                <small>🏆 Победитель: {gameState.winner.name}</small>
              </Alert>
            </Col>
          </Row>
        )}

        {/* Статус игроков */}
        <Row className="mt-2">
          <Col>
            <div className="d-flex justify-content-center gap-2 flex-wrap">
              {gameState.players.map((player) => (
                <Badge
                  key={player.id}
                  bg={player.id === currentPlayer?.id ? 'primary' : 'light'}
                  text={player.id === currentPlayer?.id ? 'white' : 'dark'}
                  className="d-flex align-items-center gap-1"
                >
                  <span>{player.name}</span>
                  <span className="badge bg-secondary rounded-pill">
                    {player.hand?.length || 0}
                  </span>
                  {!player.isConnected && <span>⚠️</span>}
                </Badge>
              ))}
            </div>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
};

export default GameInfo;
