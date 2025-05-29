// src/pages/GameSettingsPage.tsx - ФРОНТЕНД - ИСПРАВЛЕНО
import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, ButtonGroup, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameProvider';
import { useGameSettings } from '../context/GameSettingsProvider';
import { Rules } from '../../shared/types';

const GameSettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { createRoom, isConnected, error } = useGame();
  const { gameSettings, updateGameSettings } = useGameSettings();
  
  const [roomName, setRoomName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleGameModeChange = (mode: Rules['gameMode']) => {
    updateGameSettings({ gameMode: mode });
  };

  const handleThrowingModeChange = (mode: Rules['throwingMode']) => {
    updateGameSettings({ throwingMode: mode });
  };

  const handleCardCountChange = (count: Rules['cardCount']) => {
    updateGameSettings({ cardCount: count });
  };

  const handleMaxPlayersChange = (count: number) => {
    updateGameSettings({ maxPlayers: count });
  };

  const validateSettings = (): string | null => {
    if (!roomName.trim()) {
      return 'Введите название комнаты';
    }
    
    if (roomName.trim().length < 3) {
      return 'Название комнаты должно содержать минимум 3 символа';
    }

    if (roomName.trim().length > 30) {
      return 'Название комнаты не должно превышать 30 символов';
    }

    return null;
  };

  const handleCreateRoom = async () => {
    const error = validateSettings();
    if (error) {
      setValidationError(error);
      return;
    }

    if (!isConnected) {
      setValidationError('Нет соединения с сервером');
      return;
    }

    setIsCreating(true);
    setValidationError(null);

    try {
      const rules: Rules = {
        gameMode: gameSettings.gameMode,
        throwingMode: gameSettings.throwingMode,
        cardCount: gameSettings.cardCount,
        maxPlayers: gameSettings.maxPlayers,
      };

      createRoom(roomName.trim(), rules);
      
      // Переходим к комнате (GameProvider обновит currentRoom)
      // В реальном проекте лучше дождаться ответа от сервера
      setTimeout(() => {
        navigate('/room/new'); // Заменится на реальный ID комнаты
      }, 500);
      
    } catch (err) {
      console.error('Error creating room:', err);
      setValidationError('Ошибка создания комнаты');
      setIsCreating(false);
    }
  };

  const handleBack = () => {
    navigate('/');
  };

  return (
    <Container className="py-4">
      <Row className="justify-content-center">
        <Col xs={12} md={8} lg={6}>
          {/* Заголовок */}
          <div className="d-flex align-items-center mb-4">
            <Button variant="outline-secondary" onClick={handleBack} className="me-3">
              ← Назад
            </Button>
            <h2 className="mb-0">Настройки игры</h2>
          </div>

          {/* Ошибки */}
          {(error || validationError) && (
            <Alert variant="danger" className="mb-4">
              {validationError || error}
            </Alert>
          )}

          {/* Название комнаты */}
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">Название комнаты</h5>
            </Card.Header>
            <Card.Body>
              <Form.Group>
                <Form.Control
                  type="text"
                  placeholder="Введите название комнаты..."
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  maxLength={30}
                  disabled={isCreating}
                />
                <Form.Text className="text-muted">
                  {roomName.length}/30 символов
                </Form.Text>
              </Form.Group>
            </Card.Body>
          </Card>

          {/* Режим игры */}
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">Режим игры</h5>
            </Card.Header>
            <Card.Body>
              <ButtonGroup className="w-100 mb-3">
                <Button
                  variant={gameSettings.gameMode === 'classic' ? 'primary' : 'outline-primary'}
                  onClick={() => handleGameModeChange('classic')}
                  disabled={isCreating}
                >
                  Классический
                </Button>
                <Button
                  variant={gameSettings.gameMode === 'transferable' ? 'primary' : 'outline-primary'}
                  onClick={() => handleGameModeChange('transferable')}
                  disabled={isCreating}
                >
                  Переводной
                </Button>
                <Button
                  variant={gameSettings.gameMode === 'smart' ? 'primary' : 'outline-primary'}
                  onClick={() => handleGameModeChange('smart')}
                  disabled={isCreating}
                >
                  Умный
                </Button>
              </ButtonGroup>

              <small className="text-muted">
                {gameSettings.gameMode === 'classic' && 'Стандартные правила дурака'}
                {gameSettings.gameMode === 'transferable' && 'Можно переводить атаку на следующего игрока'}
                {gameSettings.gameMode === 'smart' && 'Автоматическое подкидывание карт'}
              </small>
            </Card.Body>
          </Card>

          {/* Подкидывание */}
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">Подкидывание</h5>
            </Card.Header>
            <Card.Body>
              <ButtonGroup className="w-100 mb-3">
                <Button
                  variant={gameSettings.throwingMode === 'none' ? 'primary' : 'outline-primary'}
                  onClick={() => handleThrowingModeChange('none')}
                  disabled={isCreating}
                >
                  Нет
                </Button>
                <Button
                  variant={gameSettings.throwingMode === 'neighbors' ? 'primary' : 'outline-primary'}
                  onClick={() => handleThrowingModeChange('neighbors')}
                  disabled={isCreating}
                >
                  Соседи
                </Button>
                <Button
                  variant={gameSettings.throwingMode === 'all' ? 'primary' : 'outline-primary'}
                  onClick={() => handleThrowingModeChange('all')}
                  disabled={isCreating}
                >
                  Все
                </Button>
              </ButtonGroup>

              <small className="text-muted">
                {gameSettings.throwingMode === 'none' && 'Подкидывание запрещено'}
                {gameSettings.throwingMode === 'neighbors' && 'Подкидывать могут только соседние игроки'}
                {gameSettings.throwingMode === 'all' && 'Подкидывать могут все игроки'}
              </small>
            </Card.Body>
          </Card>

          {/* Количество карт */}
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">Карт на руках</h5>
            </Card.Header>
            <Card.Body>
              <ButtonGroup className="w-100 mb-3">
                <Button
                  variant={gameSettings.cardCount === 6 ? 'primary' : 'outline-primary'}
                  onClick={() => handleCardCountChange(6)}
                  disabled={isCreating}
                >
                  6 карт
                </Button>
                <Button
                  variant={gameSettings.cardCount === 8 ? 'primary' : 'outline-primary'}
                  onClick={() => handleCardCountChange(8)}
                  disabled={isCreating}
                >
                  8 карт
                </Button>
                <Button
                  variant={gameSettings.cardCount === 10 ? 'primary' : 'outline-primary'}
                  onClick={() => handleCardCountChange(10)}
                  disabled={isCreating}
                >
                  10 карт
                </Button>
              </ButtonGroup>

              <small className="text-muted">
                Количество карт, которые получает каждый игрок в начале игры
              </small>
            </Card.Body>
          </Card>

          {/* Максимальное количество игроков */}
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">Максимум игроков</h5>
            </Card.Header>
            <Card.Body>
              <ButtonGroup className="w-100 mb-3">
                {[2, 3, 4, 5, 6].map((count) => (
                  <Button
                    key={count}
                    variant={gameSettings.maxPlayers === count ? 'primary' : 'outline-primary'}
                    onClick={() => handleMaxPlayersChange(count)}
                    disabled={isCreating}
                  >
                    {count}
                  </Button>
                ))}
              </ButtonGroup>

              <small className="text-muted">
                Максимальное количество игроков в комнате
              </small>
            </Card.Body>
          </Card>

          {/* Кнопка создания */}
          <div className="d-grid">
            <Button
              variant="success"
              size="lg"
              onClick={handleCreateRoom}
              disabled={!isConnected || isCreating}
              className="py-3"
            >
              {isCreating ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status">
                    <span className="visually-hidden">Создание...</span>
                  </span>
                  Создание комнаты...
                </>
              ) : (
                <>
                  <span className="me-2">🎮</span>
                  Создать комнату
                </>
              )}
            </Button>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default GameSettingsPage;
