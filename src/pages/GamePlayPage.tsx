import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { useGame } from '../context/GameEngineProvider';

const GamePlayPage: React.FC = () => {
  const { gameState, you } = useGame();

  if (!gameState || !you) return <div>Загрузка игры...</div>;

  const {
    players,
    trumpSuit,
    currentAttackerIndex,
    currentDefenderIndex,
    rules,
  } = gameState;

  const isYourTurn = players[currentAttackerIndex].id === you.id;

  return (
    <Container
      fluid
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1c1c1c 0%, #343a40 100%)',
        color: 'white',
        padding: '2rem',
      }}
    >
      <h2 className="text-center mb-4">
        Козырь: <span style={{ color: '#ffcc00' }}>{trumpSuit}</span>
      </h2>

      <Row className="justify-content-center mb-5">
        {players
          .filter((p) => p.id !== you.id)
          .map((player) => (
            <Col key={player.id} xs="auto" className="text-center">
              <div
                style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  margin: '0 auto 0.5rem',
                  border: '2px solid #888',
                }}
              >
                <img
                  src={`https://api.dicebear.com/7.x/adventurer/svg?seed=${player.name + player.id}`}
                  alt={player.name}
                  style={{ width: '100%', height: '100%' }}
                />
              </div>
              <div style={{ fontSize: '0.85rem', color: '#ccc' }}>{player.name}</div>
              <div style={{ fontSize: '0.75rem', color: '#999' }}>
                Карт: {player.hand.length}
              </div>
            </Col>
          ))}
      </Row>

      <h4 className="text-center mb-4" style={{ color: isYourTurn ? '#0f0' : '#aaa' }}>
        {isYourTurn ? 'Ваш ход (атака)' : 'Ожидание хода...'}
      </h4>

      <div className="d-flex justify-content-center flex-wrap" style={{ gap: '1rem' }}>
        {you.hand.map((card, index) => (
          <div
            key={index}
            style={{
              width: '60px',
              height: '90px',
              backgroundColor: '#222',
              color: '#fff',
              borderRadius: '8px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 6px rgba(0,0,0,0.4)',
              fontSize: '1.1rem',
              fontWeight: 'bold',
              border: '1px solid #555',
            }}
          >
            <div>{card.rank}</div>
            <div>{card.suit}</div>
          </div>
        ))}
      </div>
    </Container>
  );
};

export default GamePlayPage;
