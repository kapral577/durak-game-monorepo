import React from 'react';
import { useGame } from '../context/GameEngineProvider';
import { Container, Row, Col } from 'react-bootstrap';

const GamePlayPage: React.FC = () => {
  const { gameState } = useGame();

  if (!gameState || gameState.phase !== 'playing') return null;

  const { players, you, table } = gameState;

  const isYourTurn =
    typeof gameState.currentAttackerIndex === 'number' &&
    players[gameState.currentAttackerIndex]?.id === you.id;

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

      <Row className="w-100 justify-content-center mb-5">
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

      <div className="mb-5">
        <h4>Карт на столе: {table.length}</h4>
      </div>

      <div className="position-fixed bottom-0 start-0 end-0 p-4 bg-dark text-white">
        <div className="text-center">
          <div className="mb-2">Вы: {you.name}</div>
          <div style={{ fontSize: '0.9rem', color: '#bbb' }}>Карт: {you.hand.length}</div>
          {isYourTurn && <div className="mt-2 text-success">Ваш ход</div>}
        </div>
      </div>
    </Container>
  );
};

export default GamePlayPage;
