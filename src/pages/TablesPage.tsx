import React, { useEffect } from 'react';
import { Container, Card, Button } from 'react-bootstrap';
import BottomNavbar from '../components/BottomNavbar';
import { useNavigate } from 'react-router-dom';
import { useWebSocketContext } from '../context/WebSocketProvider';

interface PlayerInfo {
  playerId: string;
  name: string;
}

interface SlotInfo {
  id: number;
  player: PlayerInfo | null;
}

interface Rules {
  gameMode: string;
  throwingMode: string;
  cardCount: number;
}

interface RoomInfo {
  roomId: string;
  rules?: Rules;
  slots: SlotInfo[];
}

const TablesPage: React.FC = () => {
  const { rooms, sendWhenReady } = useWebSocketContext();
  const navigate = useNavigate();

  useEffect(() => {
    sendWhenReady({ type: 'get_rooms' });
  }, [sendWhenReady]);

  const handleJoin = (roomId: string) => {
    sendWhenReady({ type: 'join_room', roomId });
    navigate(`/room/${roomId}`);
  };

  return (
    <>
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
        <h1
          style={{
            fontSize: '2.5rem',
            fontWeight: 'bold',
            textShadow: '2px 2px 8px rgba(0,0,0,0.7)',
          }}
        >
          Столы
        </h1>

        {rooms.length === 0 ? (
          <p style={{ marginTop: '1rem', fontSize: '1.2rem' }}>
            Нет доступных комнат
          </p>
        ) : (
          rooms.map(({ roomId, rules, slots }) => (
            <Card
              key={roomId}
              style={{ width: '300px', marginTop: '1rem', backgroundColor: '#2c2c2c', color: 'white' }}
            >
              <Card.Body>
                <div className="mb-2">
                  <strong>Комната #{roomId}</strong>
                </div>
                {rules ? (
                  <div style={{ fontSize: '0.9rem' }}>
                    Режим: {rules.gameMode === 'classic' ? 'Классический' : 'Переводной'}<br />
                    Подкидывание: {rules.throwingMode === 'standard' ? 'Стандартное' : 'Умное'}<br />
                    Колода: {rules.cardCount} карт<br />
                    Игроков: {slots.filter((s) => s.player).length} / {slots.length}
                  </div>
                ) : (
                  <div style={{ fontSize: '0.9rem', color: '#aaa' }}>Нет информации об игре</div>
                )}
                <div className="mt-3 text-end">
                  <Button variant="outline-light" size="sm" onClick={() => handleJoin(roomId)}>
                    Войти
                  </Button>
                </div>
              </Card.Body>
            </Card>
          ))
        )}
      </Container>

      <BottomNavbar />
    </>
  );
};

export default TablesPage;
