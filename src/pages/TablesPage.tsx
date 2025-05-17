import React, { useEffect, useState } from 'react';
import { Container, Card, Button } from 'react-bootstrap';
import BottomNavbar from '../components/BottomNavbar';
import { useNavigate } from 'react-router-dom';
import { useWebSocketRoom } from '../hooks/useWebSocketRoom';

const TablesPage: React.FC = () => {
  const [rooms, setRooms] = useState<string[]>([]);
  const { joinRoom } = useWebSocketRoom();
  const navigate = useNavigate();

  useEffect(() => {
    const socket = new WebSocket('wss://durak-server-051x.onrender.com');

    socket.onopen = () => {
      socket.send(JSON.stringify({ type: 'get_rooms' }));
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'rooms_list') {
        setRooms(data.rooms);
      }
    };

    return () => socket.close();
  }, []);

  const handleJoin = (roomId: string) => {
    joinRoom(roomId);
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
          rooms.map((roomId) => (
            <Card
              key={roomId}
              style={{ width: '300px', marginTop: '1rem', backgroundColor: '#2c2c2c', color: 'white' }}
            >
              <Card.Body className="d-flex justify-content-between align-items-center">
                <div>Комната #{roomId}</div>
                <Button variant="outline-light" size="sm" onClick={() => handleJoin(roomId)}>
                  Войти
                </Button>
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