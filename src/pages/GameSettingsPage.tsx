// src/pages/GameSettingsPage.tsx - РЕФАКТОРИРОВАННАЯ ВЕРСИЯ

import React, { useState, useCallback } from 'react';
import { Container, Row, Col, Card, Form, Button, ButtonGroup, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameProvider';
import { useGameSettings } from '../context/GameSettingsProvider';
import { GameMode, ThrowingMode } from '../types/context';

// ===== КОНСТАНТЫ =====
const UI_TEXT = {
  PAGE_TITLE: 'Настройки игры',
  BACK_BUTTON: '← Назад',
  ROOM_NAME_LABEL: 'Название комнаты',
  ROOM_NAME_PLACEHOLDER: 'Введите название комнаты',
  GAME_MODE_LABEL: 'Режим игры',
  THROWING_MODE_LABEL: 'Подкидывание',
  CARD_COUNT_LABEL: 'Карт на руках',
  MAX_PLAYERS_LABEL: 'Максимум игроков',
  CREATE_BUTTON: '🏠 Создать комнату и войти',
  CREATING_BUTTON: 'Создание комнаты...',
  CREATING_INFO: 'Создаем комнату...',
  REDIRECT_INFO: 'После создания вы автоматически попадете в комнату ожидания',
  HINT_TEXT: 'После создания комнаты вы автоматически попадете в меню ожидания игроков',
} as const;

const VALIDATION_RULES = {
  MIN_NAME_LENGTH: 3,
  MAX_NAME_LENGTH: 30,
} as const;

const GAME_MODE_DESCRIPTIONS = {
  [GameMode.Classic]: 'Стандартные правила дурака',
  [GameMode.Transferable]: 'Можно переводить атаку на следующего игрока',
} as const;

const THROWING_MODE_DESCRIPTIONS = {
  [ThrowingMode.Standard]: 'Обычные правила подкидывания',
  [ThrowingMode.Smart]: 'Автоматическое подкидывание',
} as const;

const GameSettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { createRoom, isConnected, error, currentRoom } = useGame();
  const {
    gameMode,
    throwingMode,
    cardCount,
    maxPlayers,
    setGameMode,
    setThrowingMode,
    setCardCount,
    setMaxPlayers
  } = useGameSettings();

  const [roomName, setRoomName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Автоматическое перенаправление при создании комнаты
  React.useEffect(() => {
    if (currentRoom && isCreating) {
      setIsCreating(false);
      setValidationError(null);
      navigate(`/room/${currentRoom.id}`);
    }
  }, [currentRoom, isCreating, navigate]);

  // Валидация настроек
  const validateSettings = useCallback((): string | null => {
    const trimmedName = roomName.trim();
    
    if (!trimmedName) {
      return 'Введите название комнаты';
    }
    
    if (trimmedName.length < VALIDATION_RULES.MIN_NAME_LENGTH) {
      return `Название комнаты должно содержать минимум ${VALIDATION_RULES.MIN_NAME_LENGTH} символа`;
    }
    
    if (trimmedName.length > VALIDATION_RULES.MAX_NAME_LENGTH) {
      return `Название комнаты не должно превышать ${VALIDATION_RULES.MAX_NAME_LENGTH} символов`;
    }
    
    return null;
  }, [roomName]);

  // Обработчики изменения настроек
  const handleGameModeChange = useCallback((mode: GameMode) => {
    setGameMode(mode);
  }, [setGameMode]);

  const handleThrowingModeChange = useCallback((mode: ThrowingMode) => {
    setThrowingMode(mode);
  }, [setThrowingMode]);

  const handleCardCountChange = useCallback((count: number) => {
    setCardCount(count);
  }, [setCardCount]);

  const handleMaxPlayersChange = useCallback((count: number) => {
    setMaxPlayers(count);
  }, [setMaxPlayers]);

  // Создание комнаты
  const handleCreateRoom = useCallback(async () => {
    const validationResult = validateSettings();
    if (validationResult) {
      setValidationError(validationResult);
      return;
    }

    if (!isConnected) {
      setValidationError('Нет соединения с сервером');
      return;
    }

    setIsCreating(true);
    setValidationError(null);

    try {
      const rules = {
        gameMode,
        throwingMode,
        cardCount,
        maxPlayers,
      };

      createRoom(roomName.trim(), rules);
    } catch (err) {
      console.error('Error creating room:', err);
      setValidationError('Ошибка создания комнаты');
      setIsCreating(false);
    }
  }, [validateSettings, isConnected, roomName, gameMode, throwingMode, cardCount, maxPlayers, createRoom]);

  const handleBack = useCallback(() => {
    navigate('/');
  }, [navigate]);

  return (
    <Container className="py-4">
      <Row className="justify-content-center">
        <Col md={8} lg={6}>
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <Button variant="link" onClick={handleBack} className="p-0">
                {UI_TEXT.BACK_BUTTON}
              </Button>
              <h4 className="mb-0">{UI_TEXT.PAGE_TITLE}</h4>
              <div style={{ width: '60px' }}></div>
            </Card.Header>
            
            <Card.Body>
              {/* Ошибки */}
              {(error || validationError) && (
                <Alert variant="danger" className="mb-3">
                  {validationError || error}
                </Alert>
              )}

              {/* Информация о создании */}
              {isCreating && (
                <Alert variant="info" className="mb-3">
                  <div className="fw-bold">{UI_TEXT.CREATING_INFO}</div>
                  <small>{UI_TEXT.REDIRECT_INFO}</small>
                </Alert>
              )}

              {/* Название комнаты */}
              <Form.Group className="mb-4">
                <Form.Label>{UI_TEXT.ROOM_NAME_LABEL}</Form.Label>
                <Form.Control
                  type="text"
                  placeholder={UI_TEXT.ROOM_NAME_PLACEHOLDER}
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  maxLength={VALIDATION_RULES.MAX_NAME_LENGTH}
                  disabled={isCreating}
                />
                <Form.Text className="text-muted">
                  {roomName.length}/{VALIDATION_RULES.MAX_NAME_LENGTH} символов
                </Form.Text>
              </Form.Group>

              {/* Режим игры */}
              <Form.Group className="mb-4">
                <Form.Label>{UI_TEXT.GAME_MODE_LABEL}</Form.Label>
                <div>
                  <ButtonGroup className="w-100 mb-2">
                    <Button
                      variant={gameMode === GameMode.Classic ? 'primary' : 'outline-primary'}
                      onClick={() => handleGameModeChange(GameMode.Classic)}
                      disabled={isCreating}
                    >
                      Классический
                    </Button>
                    <Button
                      variant={gameMode === GameMode.Transferable ? 'primary' : 'outline-primary'}
                      onClick={() => handleGameModeChange(GameMode.Transferable)}
                      disabled={isCreating}
                    >
                      Переводной
                    </Button>
                  </ButtonGroup>
                  <Form.Text className="text-muted">
                    {GAME_MODE_DESCRIPTIONS[gameMode]}
                  </Form.Text>
                </div>
              </Form.Group>

              {/* Подкидывание */}
              <Form.Group className="mb-4">
                <Form.Label>{UI_TEXT.THROWING_MODE_LABEL}</Form.Label>
                <div>
                  <ButtonGroup className="w-100 mb-2">
                    <Button
                      variant={throwingMode === ThrowingMode.Standard ? 'primary' : 'outline-primary'}
                      onClick={() => handleThrowingModeChange(ThrowingMode.Standard)}
                      disabled={isCreating}
                    >
                      Стандартное
                    </Button>
                    <Button
                      variant={throwingMode === ThrowingMode.Smart ? 'primary' : 'outline-primary'}
                      onClick={() => handleThrowingModeChange(ThrowingMode.Smart)}
                      disabled={isCreating}
                    >
                      Умное
                    </Button>
                  </ButtonGroup>
                  <Form.Text className="text-muted">
                    {THROWING_MODE_DESCRIPTIONS[throwingMode]}
                  </Form.Text>
                </div>
              </Form.Group>

              {/* Количество карт */}
              <Form.Group className="mb-4">
                <Form.Label>{UI_TEXT.CARD_COUNT_LABEL}</Form.Label>
                <div>
                  <ButtonGroup className="mb-2">
                    {[6, 8, 10].map((count) => (
                      <Button
                        key={count}
                        variant={cardCount === count ? 'primary' : 'outline-primary'}
                        onClick={() => handleCardCountChange(count)}
                        disabled={isCreating}
                      >
                        {count} карт
                      </Button>
                    ))}
                  </ButtonGroup>
                  <Form.Text className="text-muted d-block">
                    Количество карт, которые получает каждый игрок в начале игры
                  </Form.Text>
                </div>
              </Form.Group>

              {/* Максимальное количество игроков */}
              <Form.Group className="mb-4">
                <Form.Label>{UI_TEXT.MAX_PLAYERS_LABEL}</Form.Label>
                <div>
                  <ButtonGroup className="mb-2">
                    {[2, 3, 4, 5, 6].map((count) => (
                      <Button
                        key={count}
                        variant={maxPlayers === count ? 'primary' : 'outline-primary'}
                        onClick={() => handleMaxPlayersChange(count)}
                        disabled={isCreating}
                      >
                        {count}
                      </Button>
                    ))}
                  </ButtonGroup>
                  <Form.Text className="text-muted d-block">
                    Максимальное количество игроков в комнате
                  </Form.Text>
                </div>
              </Form.Group>

              {/* Кнопка создания */}
              <Button
                variant="success"
                size="lg"
                className="w-100 mb-3"
                onClick={handleCreateRoom}
                disabled={isCreating || !isConnected}
              >
                {isCreating ? UI_TEXT.CREATING_BUTTON : UI_TEXT.CREATE_BUTTON}
              </Button>

              {/* Подсказка */}
              {!isCreating && (
                <Form.Text className="text-muted text-center d-block">
                  {UI_TEXT.HINT_TEXT}
                </Form.Text>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default GameSettingsPage;
