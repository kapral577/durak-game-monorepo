import React, { useEffect } from 'react';
import { Container, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameEngineProvider';

const GameRoomPage: React.FC = () => {
  const { players, you, markReady, gameState, startGame } = useGame();
  const navigate = useNavigate();

  const isReady = you?.status === 'ready';

  useEffect(() => {
    // Если все игроки готовы — запускаем игру
    if (players.length > 0 && players.every((p) => p.status === 'ready')) {
      startGame();
    }
  }, [players, startGame]);

  useEffect(() => {
    // Когда статус становится in_progress — переход на страницу игры
    if (gameState?.status === 'in_progress') {
      navigate('/play');
    }
  }, [gameState, navigate]);

  if (!you) return null;

  const handleReadyToggle = () => {
    markReady(you.id);
  };

  const renderPlayerSlots = () => {
    const positions = [
      { top: '5%', left: '50%', transform: 'translateX(-50%)' },
      { top: '20%', left: '20%' },
      { top: '20%', right: '20%' },
      { top: '40%', left: '10%' },
      { top: '40%', right: '10%' },
    ];

    return players
      .filter((p) => p.id !== you.id)
      .map((player, index) => {
        const style = positions[index] || {};
        const seed = player.name + player.id;

        return (
          <div
            key={player.id}
            style={{
              position: 'absolute',
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              overflow: 'hidden',
              ...style,
            }}
          >
            <img
              src={`https://api.dicebear.com/7.x/adventurer/svg?seed=${seed}`}
              alt={player.name}
              style={{ width: '100%', height: '100%' }}
            />
            <div
              style={{
                textAlign: 'center',
                fontSize: '0.7rem',
                marginTop: '4px',
                color: 'white',
              }}
            >
              {player.name}
            </div>
          </div>
        );
      });
  };

  return (
    <Container
      fluid
      style={{
        position: 'relative',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1c1c1c 0%, #343a40 100%)',
        color: 'white',
        paddingBottom: '100px',
      }}
    >
      {renderPlayerSlots()}

      <div
        style={{
          position: 'absolute',
          bottom: '100px',
          left: '50%',
          transform: 'translateX(-50%)',
        }}
      >
        <Button variant="outline-light">Пригласить друга</Button>
      </div>

      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          width: '100%',
          height: '60px',
          backgroundColor: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 1rem',
          boxShadow: '0 -2px 6px rgba(0,0,0,0.2)',
          zIndex: 10,
        }}
      >
        <Button
          variant={isReady ? 'success' : 'outline-dark'}
          size="sm"
          onClick={handleReadyToggle}
        >
          {isReady ? 'Готов!' : 'Готов'}
        </Button>

        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            overflow: 'hidden',
            backgroundColor: '#ddd',
          }}
        >
          <img
            src={`https://api.dicebear.com/7.x/adventurer/svg?seed=${you.name + you.id}`}
            alt="Я"
            style={{ width: '100%', height: '100%' }}
          />
        </div>
      </div>
    </Container>
  );
};

export default GameRoomPage;
