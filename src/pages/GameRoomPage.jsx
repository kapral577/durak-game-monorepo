// src/pages/GameRoomPage.jsx
import React, { useState } from 'react';
import { Container, Button } from 'react-bootstrap';
import { useGameSettings } from '../context/GameSettingsContext';

function GameRoomPage() {
  const { playerCount } = useGameSettings();
  const [isReady, setIsReady] = useState(false);

  const handleReadyToggle = () => {
    setIsReady(!isReady);
  };

  // Генерация позиций других игроков
  const renderPlayerSlots = () => {
    const slots = [];
    const positions = [
      { top: '5%', left: '50%', transform: 'translateX(-50%)' },
      { top: '20%', left: '20%' },
      { top: '20%', right: '20%' },
      { top: '40%', left: '10%' },
      { top: '40%', right: '10%' },
    ];

    for (let i = 0; i < playerCount - 1; i++) {
      const style = positions[i] || {};
      slots.push(
        <div
          key={i}
          style={{
            position: 'absolute',
            width: '60px',
            height: '60px',
            backgroundColor: '#ccc',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.8rem',
            ...style,
          }}
        >
          Игрок {i + 2}
        </div>
      );
    }

    return slots;
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
      {/* Слоты игроков */}
      {renderPlayerSlots()}

      {/* Кнопка "Пригласить друзей" */}
      <div style={{ position: 'absolute', bottom: '140px', left: '50%', transform: 'translateX(-50%)' }}>
        <Button variant="outline-light">Пригласить друга</Button>
      </div>

      {/* Статус-бар с аватаром и кнопкой "Готов" */}
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
            backgroundColor: '#ddd',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
            fontSize: '1rem',
          }}
        >
          Я
        </div>
      </div>
    </Container>
  );
}

export default GameRoomPage;
