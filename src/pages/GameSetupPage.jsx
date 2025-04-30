// src/pages/GameSetupPage.jsx
import React from 'react';
import { Container, Button, Form, Navbar, Nav } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useGameSettings } from '../context/GameSettingsContext';

function GameSetupPage() {
  const { playerCount, setPlayerCount, gameMode, setGameMode, throwingMode, setThrowingMode, cardCount, setCardCount } = useGameSettings();
  const navigate = useNavigate();

  const handleCreateGame = () => {
    navigate('/room');
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
        <h1 className="mb-5 text-center" style={{ fontSize: '2.5rem', fontWeight: 'bold', textShadow: '2px 2px 8px rgba(0,0,0,0.7)' }}>
          Настройка игры
        </h1>

        {/* Блок "Режим игры" */}
        <Form.Group className="mb-4 text-center" style={{ width: '100%', maxWidth: '400px' }}>
          <Form.Label style={{ fontSize: '1.8rem', fontWeight: 'bold', marginBottom: '1rem' }}>Режим игры</Form.Label>
          <div className="d-flex justify-content-around">
            <Button variant={gameMode === 'classic' ? 'light' : 'outline-light'} size="lg" onClick={() => setGameMode('classic')}>Классический</Button>
            <Button variant={gameMode === 'transfer' ? 'light' : 'outline-light'} size="lg" onClick={() => setGameMode('transfer')}>Переводной</Button>
          </div>
        </Form.Group>

        {/* Блок "Кто подкидывает" */}
        <Form.Group className="mb-4 text-center" style={{ width: '100%', maxWidth: '400px' }}>
          <Form.Label style={{ fontSize: '1.8rem', fontWeight: 'bold', marginBottom: '1rem' }}>Кто подкидывает</Form.Label>
          <div className="d-flex justify-content-around">
            <Button variant={throwingMode === 'all' ? 'light' : 'outline-light'} size="lg" onClick={() => setThrowingMode('all')}>Все</Button>
            <Button variant={throwingMode === 'neighbors' ? 'light' : 'outline-light'} size="lg" onClick={() => setThrowingMode('neighbors')}>Соседи</Button>
          </div>
        </Form.Group>

        {/* Блок "Количество карт" */}
        <Form.Group className="mb-4 text-center" style={{ width: '100%', maxWidth: '400px' }}>
          <Form.Label style={{ fontSize: '1.8rem', fontWeight: 'bold', marginBottom: '1rem' }}>Количество карт</Form.Label>
          <div className="d-flex justify-content-around">
            <Button variant={cardCount === '36' ? 'light' : 'outline-light'} size="lg" onClick={() => setCardCount('36')}>36 карт</Button>
            <Button variant={cardCount === '52' ? 'light' : 'outline-light'} size="lg" onClick={() => setCardCount('52')}>52 карты</Button>
          </div>
        </Form.Group>

        {/* Блок "Количество игроков" */}
        <Form.Group className="mb-5 text-center" style={{ width: '100%', maxWidth: '400px' }}>
          <Form.Label style={{ fontSize: '1.8rem', fontWeight: 'bold', marginBottom: '1rem' }}>Количество игроков: {playerCount}</Form.Label>
          <Form.Range
            min={2}
            max={6}
            value={playerCount}
            onChange={(e) => setPlayerCount(Number(e.target.value))}
            style={{ accentColor: 'white' }}
          />
        </Form.Group>

        {/* Кнопка создать игру */}
        <Button variant="light" size="lg" onClick={handleCreateGame}>
          Создать игру
        </Button>
      </Container>
    </>
  );
}

export default GameSetupPage;
