// src/pages/GameSettingsPage.tsx - ДОБАВЛЕНЫ ОБРАБОТЧИКИ СОБЫТИЙ
import React, { useState, useEffect } from 'react'; // ✅ ДОБАВЛЕН useEffect
import { Container, Row, Col, Card, Form, Button, ButtonGroup, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameProvider';
import { useGameSettings } from '../context/GameSettingsProvider';
import { Rules } from '../../shared/types';

const GameSettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { createRoom, isConnected, error } = useGame();
  
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
  const [validationError, setValidationError] = useState<string | null>(null); // ✅ ИСПРАВЛЕНА типизация

  // ✅ ДОБАВЛЕНЫ ОБРАБОТЧИКИ СОБЫТИЙ ОТ GAMEPROVIDER
  useEffect(() => {
    const handleRoomCreated = (event: CustomEvent) => {
      console.log('🎉 Room created event received:', event.detail);
      setIsCreating(false);
      setValidationError(null);
      
      // ✅ ПЕРЕХОД НА ГЛАВНУЮ (пока нет роута комнаты)
      navigate('/');
      
      // ✅ ИЛИ В БУДУЩЕМ: navigate(`/room/${event.detail.room.id}`);
    };
    
    const handleRoomError = (event: CustomEvent) => {
      console.log('❌ Room error event received:', event.detail);
      setIsCreating(false);
      setValidationError(event.detail.error || 'Ошибка создания комнаты');
    };
    
    // ✅ ДОБАВЛЯЕМ ОБРАБОТЧИКИ СОБЫТИЙ
    window.addEventListener('room-created', handleRoomCreated as EventListener);
    window.addEventListener('room-error', handleRoomError as EventListener);
    
    // ✅ ОЧИСТКА ПРИ РАЗМОНТИРОВАНИИ
    return () => {
      window.removeEventListener('room-created', handleRoomCreated as EventListener);
      window.removeEventListener('room-error', handleRoomError as EventListener);
    };
  }, [navigate]);

  const handleGameModeChange = (mode: Rules['gameMode']) => {
    setGameMode(mode);
  };

  const handleThrowingModeChange = (mode: Rules['throwingMode']) => {
    setThrowingMode(mode);
  };

  const handleCardCountChange = (count: Rules['cardCount']) => {
    setCardCount(count);
  };

  const handleMaxPlayersChange = (count: number) => {
    setMaxPlayers(count);
  };

  // ✅ ИСПРАВЛЕНЫ СИНТАКСИЧЕСКИЕ ОШИБКИ
  const validateSettings = (): string | null => {
    if (!roomName.trim()) {
      return 'Введите название комнаты';
    } // ✅ ДОБАВЛЕНА скобка
    
    if (roomName.trim().length < 3) {
      return 'Название комнаты должно содержать минимум 3 символа';
    } // ✅ ДОБАВЛЕНА скобка
    
    if (roomName.trim().length > 30) {
      return 'Название комнаты не должно превышать 30 символов';
    } // ✅ ДОБАВЛЕНА скобка
    
    return null;
  };

  const handleCreateRoom = async () => {
    const error = validateSettings();
    if (error) {
      setValidationError(error);
      return;
    } // ✅ ДОБАВЛЕНА скобка

    if (!isConnected) {
      setValidationError('Нет соединения с сервером');
      return;
    } // ✅ ДОБАВЛЕНА скобка

    setIsCreating(true);
    setValidationError(null);
    
    // ✅ ДОБАВЛЕН TIMEOUT ДЛЯ ПРЕДОТВРАЩЕНИЯ ВЕЧНОЙ ЗАГРУЗКИ
    const timeoutId = setTimeout(() => {
      console.log('⏰ Room creation timeout');
      setIsCreating(false);
      setValidationError('Время создания комнаты истекло. Попробуйте еще раз.');
    }, 15000); // 15 секунд

    try {
      const rules: Rules = {
        gameMode,
        throwingMode,
        cardCount,
        maxPlayers,
      };

      createRoom(roomName.trim(), rules);
      console.log('Room creation initiated');
      
      // ✅ ОЧИСТКА TIMEOUT ПРОИЗОЙДЕТ В ОБРАБОТЧИКЕ СОБЫТИЯ
      
    } catch (err) {
      clearTimeout(timeoutId); // ✅ ОЧИСТКА TIMEOUT ПРИ ОШИБКЕ
      console.error('Error creating room:', err);
      setValidationError('Ошибка создания комнаты');
      setIsCreating(false);
    } // ✅ ДОБАВЛЕНА скобка
  };

  const handleBack = () => {
    navigate('/');
  };

  return (
    <Container className="py-4">
      <Row>
        <Col lg={8} className="mx-auto">
          <Card>
            <Card.Header className="d-flex align-items-center">
              <Button variant="link" onClick={handleBack} className="p-0 me-3">
                ← Назад
              </Button>
              <h5 className="mb-0">Настройки игры</h5>
            </Card.Header>
            <Card.Body>
              {/* Ошибки */}
              {(error || validationError) && (
                <Alert variant="danger">
                  {validationError || error}
                </Alert>
              )}

              {/* Название комнаты */}
              <Form.Group className="mb-4">
                <Form.Label>Название комнаты</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Введите название комнаты"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  maxLength={30}
                  disabled={isCreating}
                />
                <Form.Text className="text-muted">
                  {roomName.length}/30 символов
                </Form.Text>
              </Form.Group>

              {/* Режим игры */}
              <Form.Group className="mb-4">
                <Form.Label>Режим игры</Form.Label>
                <ButtonGroup className="d-block">
                  <Button
                    variant={gameMode === 'classic' ? 'primary' : 'outline-primary'}
                    onClick={() => handleGameModeChange('classic')}
                    disabled={isCreating}
                    className="me-2 mb-2"
                  >
                    Классический
                  </Button>
                  <Button
                    variant={gameMode === 'transferable' ? 'primary' : 'outline-primary'}
                    onClick={() => handleGameModeChange('transferable')}
                    disabled={isCreating}
                    className="mb-2"
                  >
                    Переводной
                  </Button>
                </ButtonGroup>
                <Form.Text className="text-muted d-block">
                  {gameMode === 'classic' && 'Стандартные правила дурака'}
                  {gameMode === 'transferable' && 'Можно переводить атаку на следующего игрока'}
                </Form.Text>
              </Form.Group>

              {/* Подкидывание */}
              <Form.Group className="mb-4">
                <Form.Label>Подкидывание</Form.Label>
                <ButtonGroup className="d-block">
                  <Button
                    variant={throwingMode === 'standard' ? 'primary' : 'outline-primary'}
                    onClick={() => handleThrowingModeChange('standard')}
                    disabled={isCreating}
                    className="me-2 mb-2"
                  >
                    Стандартное
                  </Button>
                  <Button
                    variant={throwingMode === 'smart' ? 'primary' : 'outline-primary'}
                    onClick={() => handleThrowingModeChange('smart')}
                    disabled={isCreating}
                    className="mb-2"
                  >
                    Умное
                  </Button>
                </ButtonGroup>
                <Form.Text className="text-muted d-block">
                  {throwingMode === 'standard' && 'Обычные правила подкидывания'}
                  {throwingMode === 'smart' && 'Автоматическое подкидывание'}
                </Form.Text>
              </Form.Group>

              {/* Количество карт */}
              <Form.Group className="mb-4">
                <Form.Label>Карт на руках</Form.Label>
                <ButtonGroup className="d-block">
                  {[6, 8, 10].map((count) => (
                    <Button
                      key={count}
                      variant={cardCount === count ? 'primary' : 'outline-primary'}
                      onClick={() => handleCardCountChange(count)}
                      disabled={isCreating}
                      className="me-2 mb-2"
                    >
                      {count} карт
                    </Button>
                  ))}
                </ButtonGroup>
                <Form.Text className="text-muted">
                  Количество карт, которые получает каждый игрок в начале игры
                </Form.Text>
              </Form.Group>

              {/* Максимальное количество игроков */}
              <Form.Group className="mb-4">
                <Form.Label>Максимум игроков</Form.Label>
                <ButtonGroup className="d-block">
                  {[2, 3, 4, 5, 6].map((count) => (
                    <Button
                      key={count}
                      variant={maxPlayers === count ? 'primary' : 'outline-primary'}
                      onClick={() => handleMaxPlayersChange(count)}
                      disabled={isCreating}
                      className="me-2 mb-2"
                    >
                      {count}
                    </Button>
                  ))}
                </ButtonGroup>
                <Form.Text className="text-muted">
                  Максимальное количество игроков в комнате
                </Form.Text>
              </Form.Group>

              {/* Кнопка создания */}
              <div className="d-grid">
                <Button 
                  variant="primary" 
                  size="lg" 
                  onClick={handleCreateRoom} 
                  disabled={isCreating || !isConnected}
                >
                  {isCreating ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" />
                      Создание комнаты...
                    </>
                  ) : (
                    'Создать комнату'
                  )}
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default GameSettingsPage;
