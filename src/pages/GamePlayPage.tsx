import React from 'react';
import { useGame } from '../context/GameEngineProvider';
import { useWebSocketContext } from '../context/WebSocketProvider';
import { Container, Row, Col, Button } from 'react-bootstrap';

const GamePlayPage: React.FC = () => {
  const { gameState } = useGame();
  const { sendWhenReady } = useWebSocketContext();

  if (!gameState || gameState.phase !== 'playing') return null;

  const {
    players,
    you,
    table,
    trumpSuit,
    currentAttackerIndex,
    currentDefenderIndex,
    roomId,
  } = gameState;

  const isYourTurn = players[currentAttackerIndex]?.id === you.id;
  const isDefender = players[currentDefenderIndex]?.id === you.id;

  let actionLabel = '';
  if (isYourTurn) actionLabel = 'Ходить';
  else if (isDefender) actionLabel = 'Беру';

  const handleAction = () => {
    if (!roomId) return;
    if (actionLabel === 'Беру') {
      sendWhenReady({ type: 'take_cards', roomId });
    } else if (actionLabel === 'Ходить') {
      sendWhenReady({ type: 'end_turn', roomId });
    }
  };

  return (
    <Container
      fluid
      className="d-flex flex-column justify-content-center align-items-center"
      style={{
        minHeight: '100vh',
        padding: '2rem',
        background: 'linear-gradient(135deg, #1c1c1c 0%, #343a40 100%)',
        color: 'white',
      }}
    >
      <h1 className="mb-4">Игра началась</h1>

      <Row className="w-100 justify-content-center mb-4">
        {players
          .filter((p) => p.id !== you.id)
          .map((player) => (
            <Col
              key={player.id}
              xs={6}
              md={3}
              className="d-flex flex-column align-items-center"
            >
              <div
                style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  backgroundColor: '#555',
                  margin: '0 auto 0.5rem',
                  border: '2px solid #888',
                }}
              ></div>
              <div>{player.name}</div>
              <div style={{ fontSize: '0.9rem', color: '#bbb' }}>Карт: {player.hand.length}</div>
            </Col>
          ))}
      </Row>

      <div className="mb-4">
        <h5>Козырь: {trumpSuit}</h5>
        <h5>Карт на столе: {table.length}</h5>
      </div>

      <div className="position-fixed bottom-0 start-0 end-0 p-4 bg-dark text-white border-top">
        <div className="text-center">
          <div className="mb-2">Вы: {you.name}</div>
          <div style={{ fontSize: '0.9rem', color: '#bbb' }}>Карт: {you.hand.length}</div>
          {actionLabel && (
            <Button variant="light" className="mt-3" onClick={handleAction}>
              {actionLabel}
            </Button>
          )}
        </div>
      </div>
    </Container>
  );
};

export default GamePlayPage;