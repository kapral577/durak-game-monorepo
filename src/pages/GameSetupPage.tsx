import React from 'react';
import { Container, Button, Form } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useGameSettings } from '../context/GameSettingsContext';
import BottomNavbar from '../components/BottomNavbar';
import { useWebSocketRoom } from '../hooks/useWebSocketRoom';

const GameSetupPage: React.FC = () => {
  const {
    playerCount,
    setPlayerCount,
    gameMode,
    setGameMode,
    throwingMode,
    setThrowingMode,
    cardCount,
    setCardCount,
  } = useGameSettings();

  const navigate = useNavigate();
  const { createRoom, joinRoom, isConnected } = useWebSocketRoom();

  const handleCreateGame = async () => {
    if (!isConnected) return;

    const rules = { gameMode, throwingMode, cardCount };
    const roomId = await createRoom({ rules, maxPlayers: playerCount });

    joinRoom(roomId); // добавлено: регистрация игрока в комнате
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
        <h1 className="mb-5 text-center" style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>
          Настройка игры
        </h1>

        <Form.Group className="mb-4 text-center">
          <Form.Label style={{ fontSize: '1.5rem' }}>Количество игроков</Form.Label>
          <Form.Select value={playerCount} onChange={(e) => setPlayerCount(Number(e.target.value))}>
            {[2, 3, 4, 5, 6].map((count) => (
              <option key={count} value={count}>
                {count}
              </option>
            ))}
          </Form.Select>
        </Form.Group>

        <Form.Group className="mb-4 text-center">
          <Form.Label style={{ fontSize: '1.5rem' }}>Режим игры</Form.Label>
          <div className="d-flex justify-content-center gap-3">
            <Button
              variant={gameMode === 'classic' ? 'primary' : 'outline-light'}
              onClick={() => setGameMode('classic')}
            >
              Классический
            </Button>
            <Button
              variant={gameMode === 'transferable' ? 'primary' : 'outline-light'}
              onClick={() => setGameMode('transferable')}
            >
              Переводной
            </Button>
          </div>
        </Form.Group>

        <Form.Group className="mb-4 text-center">
          <Form.Label style={{ fontSize: '1.5rem' }}>Подкидывание</Form.Label>
          <div className="d-flex justify-content-center gap-3">
            <Button
              variant={throwingMode === 'standard' ? 'primary' : 'outline-light'}
              onClick={() => setThrowingMode('standard')}
            >
              Стандартное
            </Button>
            <Button
              variant={throwingMode === 'smart' ? 'primary' : 'outline-light'}
              onClick={() => setThrowingMode('smart')}
            >
              Умное
            </Button>
          </div>
        </Form.Group>

        <Form.Group className="mb-4 text-center">
          <Form.Label style={{ fontSize: '1.5rem' }}>Размер колоды</Form.Label>
          <div className="d-flex justify-content-center gap-3">
            <Button
              variant={cardCount === 36 ? 'primary' : 'outline-light'}
              onClick={() => setCardCount(36)}
            >
              36 карт
            </Button>
            <Button
              variant={cardCount === 52 ? 'primary' : 'outline-light'}
              onClick={() => setCardCount(52)}
            >
              52 карты
            </Button>
          </div>
        </Form.Group>

        <Button variant="light" size="lg" onClick={handleCreateGame}>
          Создать игру
        </Button>
      </Container>

      <BottomNavbar />
    </>
  );
};

export default GameSetupPage;
