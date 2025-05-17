import React, { useEffect } from 'react';
import { Container, Button } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import { useGame } from '../context/GameEngineProvider';
import { useWebSocketRoom } from '../hooks/useWebSocketRoom';

const GameRoomPage: React.FC = () => {
  const { players, you, markReady, gameState, startGame } = useGame();
  const { joinRoom } = useWebSocketRoom();
  const navigate = useNavigate();
  const { roomId } = useParams();

  useEffect(() => {
    if (roomId) {
      joinRoom(roomId);
    }
  }, [roomId]);

  const handleStartGame = () => {
    startGame();
    navigate('/play');
  };

  if (!you) return null;

  const isHost = players[players.length - 1].id === you.id;
  const allReady = players.every((p) => p.ready);

  return (
    <Container
      fluid
      className="d-flex flex-column justify-content-center align-items-center"
      style={{
        minHeight: '100vh',
        padding: '2rem',
        paddingBottom: '6rem',
        background: 'linear-gradient(135deg, #1c1c1c 0%, #343a40 100%)',
        color: 'white',
      }}
    >
      <h1 className="mb-2">Комната</h1>
      {roomId && (
        <p className="mb-4" style={{ fontSize: '1rem', color: '#bbb' }}>
          Код комнаты: <code>{roomId}</code>
        </p>
      )}

      <p className="mb-4">Ожидание игроков...</p>

      <div className="d-flex flex-wrap justify-content-center gap-4 mb-4">
        {players.map((player, index) => (
          <div
            key={index}
            className="d-flex flex-column align-items-center"
            style={{ minWidth: '80px' }}
          >
            <img
              src={`https://api.dicebear.com/7.x/adventurer/svg?seed=${player.name + player.id}`}
              alt={player.name}
              style={{ width: '60px', height: '60px' }}
            />
            <div style={{ fontSize: '0.9rem' }}>{player.name}</div>
            <div
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: player.ready ? 'limegreen' : 'gray',
                marginTop: '4px',
              }}
            ></div>
          </div>
        ))}
      </div>

      {!you.ready ? (
        <Button variant="light" onClick={markReady}>
          Готов
        </Button>
      ) : isHost && allReady ? (
        <Button variant="success" onClick={handleStartGame}>
          Начать игру
        </Button>
      ) : (
        <p>Ожидание других игроков...</p>
      )}
    </Container>
  );
};

export default GameRoomPage;
