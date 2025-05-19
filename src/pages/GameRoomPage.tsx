import React, { useEffect, useMemo } from 'react';
import { Container } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import { useWebSocketRoom } from '../hooks/useWebSocketRoom';
import { useGame } from '../context/GameEngineProvider';

const GameRoomPage: React.FC = () => {
  const { joinRoom, slots, you } = useWebSocketRoom();
  const { gameState } = useGame();
  const navigate = useNavigate();
  const { roomId } = useParams();

  useEffect(() => {
    if (roomId) {
      joinRoom(roomId);
    }
  }, [roomId]);

  const orderedSlots = useMemo(() => {
    if (!you || !Array.isArray(slots)) return [];
    const yourIndex = slots.findIndex((s) => s.player?.playerId === you.playerId);
    if (yourIndex === -1) return slots;
    return [...slots.slice(yourIndex), ...slots.slice(0, yourIndex)];
  }, [slots, you]);

  if (!you || gameState.phase !== 'waiting') return null;

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
        {orderedSlots.map((slot, index) => (
          <div
            key={index}
            className="d-flex flex-column align-items-center"
            style={{ minWidth: '80px' }}
          >
            {slot.player ? (
              <>
                <div
                  style={{
                    width: '60px',
                    height: '60px',
                    backgroundColor: slot.player.playerId === you.playerId ? '#0f0' : '#fff',
                    borderRadius: '50%',
                  }}
                ></div>
                <div style={{ fontSize: '0.9rem' }}>{slot.player.name}</div>
              </>
            ) : (
              <>
                <div
                  style={{
                    width: '60px',
                    height: '60px',
                    backgroundColor: '#555',
                    borderRadius: '50%',
                  }}
                ></div>
                <div style={{ fontSize: '0.9rem', color: '#888' }}>Свободно</div>
              </>
            )}
          </div>
        ))}
      </div>
    </Container>
  );
};

export default GameRoomPage;
