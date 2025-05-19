import React, { useEffect } from 'react';
import { Container } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { useWebSocketRoom } from '../hooks/useWebSocketRoom';
import { useGame } from '../context/GameEngineProvider';

const GameRoomPage: React.FC = () => {
  const { joinRoom, slots, you, isConnected } = useWebSocketRoom();
  const { gameState } = useGame();
  const navigate = useNavigate();
  const { roomId } = useParams();

  useEffect(() => {
    if (!roomId || !isConnected) return;
    joinRoom(roomId);
  }, [roomId, isConnected, joinRoom]);

  useEffect(() => {
    if (gameState.phase === 'playing') {
      navigate('/play');
    }
  }, [gameState.phase, navigate]);

  if (!roomId) {
    return (
      <Container className="text-center pt-5 text-light">
        <h2>Комната не найдена или не указана</h2>
      </Container>
    );
  }

  return (
    <Container fluid className="position-relative text-light" style={{ minHeight: '100vh', backgroundColor: '#1c1c1c' }}>
      <h1 className="text-center pt-4">Ожидание игроков</h1>
      <div className="d-flex justify-content-center align-items-center flex-wrap mt-5">
        {slots.map((slot) => (
          <div
            key={slot.id}
            className="border border-light rounded text-center m-2 p-3"
            style={{ minWidth: '100px', minHeight: '80px', backgroundColor: '#2c2c2c' }}
          >
            <div style={{ fontWeight: 'bold' }}>
              {slot.player ? slot.player.name : 'Пусто'}
            </div>
            {you && slot.player?.playerId === you.playerId && <div className="text-success">(Вы)</div>}
          </div>
        ))}
      </div>
    </Container>
  );
};

export default GameRoomPage;
