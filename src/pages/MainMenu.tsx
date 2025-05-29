// src/pages/MainMenu.tsx - ФРОНТЕНД - ИСПРАВЛЕНО
import React from 'react';
import { Container, Row, Col, Card, Button, Alert, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameProvider';

const MainMenu: React.FC = () => {
  const navigate = useNavigate();
  const { 
    isConnected, 
    error, 
    clearError, 
    telegramUser, 
    isAuthenticated,
    rooms,
    currentRoom,
    gameState
  } = useGame();

  const handleCreateGame = () => {
    if (!isConnected || !isAuthenticated) {
      return;
    }
    navigate('/settings');
  };

  const handleJoinGame = () => {
    if (!isConnected || !isAuthenticated) {
      return;
    }
    navigate('/rooms');
  };

  const handleFriends = () => {
    if (!isConnected || !isAuthenticated) {
      return;
    }
    navigate('/friends');
  };

  const handleContinueGame = () => {
    if (currentRoom) {
      if (gameState) {
        navigate(`/game/${currentRoom.id}`);
      } else {
        navigate(`/room/${currentRoom.id}`);
      }
    }
  };

  // Подсчет доступных комнат
  const availableRoomsCount = rooms.filter(room => 
    room.status === 'waiting' && room.players.length < room.maxPlayers
  ).length;

  return (
    <Container className="py-4">
      <Row className="justify-content-center">
        <Col xs={12} md={8} lg={6}>
          {/* Заголовок */}
          <Card className="text-center mb-4 border-0 bg-primary text-white">
            <Card.Body>
              <h1 className="mb-0">🃏 Дурак</h1>
              <p className="mb-0 mt-2 opacity-75">
                Классическая карточная игра онлайн
              </p>
              {telegramUser && (
                <small className="d-block mt-2 opacity-50">
                  Добро пожаловать, {telegramUser.first_name}!
                </small>
              )}
            </Card.Body>
          </Card>

          {/* Ошибки */}
          {error && (
            <Alert variant="danger" dismissible onClose={clearError}>
              <Alert.Heading>Ошибка</Alert.Heading>
              <p className="mb-0">{error}</p>
            </Alert>
          )}

          {/* Ошибка аутентификации */}
          {!isAuthenticated && (
            <Alert variant="warning" className="mb-4">
              <Alert.Heading>Требуется аутентификация</Alert.Heading>
              <p className="mb-0">
                Это приложение должно запускаться из Telegram. 
                {process.env.NODE_ENV === 'development' && (
                  <span className="d-block mt-2 small">
                    <strong>Режим разработки:</strong> Используется тестовый пользователь
                  </span>
                )}
              </p>
            </Alert>
          )}

          {/* Продолжить текущую игру */}
          {(currentRoom || gameState) && isAuthenticated && (
            <Card className="mb-4 border-warning">
              <Card.Body>
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <h6 className="mb-1 text-warning">
                      {gameState ? '🎮 Активная игра' : '⏳ Ожидание в комнате'}
                    </h6>
                    <small className="text-muted">
                      {currentRoom?.name || 'Неизвестная комната'}
                    </small>
                  </div>
                  <Button
                    variant="warning"
                    size="sm"
                    onClick={handleContinueGame}
                  >
                    Продолжить
                  </Button>
                </div>
              </Card.Body>
            </Card>
          )}

          {/* Основные действия */}
          <Card className="mb-4">
            <Card.Body>
              <div className="d-grid gap-3">
                
                {/* Создать игру */}
                <Button
                  variant="success"
                  size="lg"
                  onClick={handleCreateGame}
                  disabled={!isConnected || !isAuthenticated}
                  className="py-3"
                >
                  <div className="d-flex align-items-center justify-content-center">
                    <span className="me-2">➕</span>
                    <div>
                      <div className="fw-bold">Создать игру</div>
                      <small className="opacity-75">
                        Настройте правила и пригласите друзей
                      </small>
                    </div>
                  </div>
                </Button>

                {/* Найти игру */}
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleJoinGame}
                  disabled={!isConnected || !isAuthenticated}
                  className="py-3 position-relative"
                >
                  <div className="d-flex align-items-center justify-content-center">
                    <span className="me-2">🔍</span>
                    <div>
                      <div className="fw-bold">Найти игру</div>
                      <small className="opacity-75">
                        Присоединиться к существующей комнате
                        {availableRoomsCount > 0 && (
                          <span className="ms-1">({availableRoomsCount} доступно)</span>
                        )}
                      </small>
                    </div>
                  </div>
                  
                  {/* Бейдж с количеством комнат */}
                  {availableRoomsCount > 0 && (
                    <Badge 
                      bg="light" 
                      text="dark" 
                      pill 
                      className="position-absolute top-0 end-0 me-2 mt-2"
                    >
                      {availableRoomsCount}
                    </Badge>
                  )}
                </Button>

                {/* Играть с друзьями */}
                <Button
                  variant="info"
                  size="lg"
                  onClick={handleFriends}
                  disabled={!isConnected || !isAuthenticated}
                  className="py-3"
                >
                  <div className="d-flex align-items-center justify-content-center">
                    <span className="me-2">👥</span>
                    <div>
                      <div className="fw-bold">Играть с друзьями</div>
                      <small className="opacity-75">
                        Пригласите друзей в приватную игру
                      </small>
                    </div>
                  </div>
                </Button>

              </div>
            </Card.Body>
          </Card>

          {/* Статус соединения */}
          {!isConnected && (
            <Card className="mb-3 bg-light">
              <Card.Body className="text-center">
                <div className="text-muted">
                  <div className="spinner-border spinner-border-sm me-2" role="status">
                    <span className="visually-hidden">Загрузка...</span>
                  </div>
                  Подключение к серверу...
                </div>
              </Card.Body>
            </Card>
          )}

          {/* Статистика онлайн */}
          {isConnected && isAuthenticated && (
            <Card className="bg-light">
              <Card.Body className="text-center">
                <h6 className="text-muted mb-2">📊 Статистика онлайн</h6>
                <div className="row text-center">
                  <div className="col-4">
                    <div className="fw-bold text-primary">{rooms.length}</div>
                    <small className="text-muted">Комнат</small>
                  </div>
                  <div className="col-4">
                    <div className="fw-bold text-success">{availableRoomsCount}</div>
                    <small className="text-muted">Доступно</small>
                  </div>
                  <div className="col-4">
                    <div className="fw-bold text-warning">
                      {rooms.filter(r => r.status === 'playing').length}
                    </div>
                    <small className="text-muted">В игре</small>
                  </div>
                </div>
              </Card.Body>
            </Card>
          )}

          {/* Правила игры */}
          <Card className="mt-4 bg-light">
            <Card.Body>
              <h6 className="text-muted mb-3">📖 Правила игры</h6>
              <ul className="list-unstyled small text-muted mb-0">
                <li className="mb-1">🎯 <strong>Цель:</strong> избавиться от всех карт первым</li>
                <li className="mb-1">🃏 <strong>Колода:</strong> 36 карт (от 6 до туза)</li>
                <li className="mb-1">👥 <strong>Игроки:</strong> от 2 до 6 человек</li>
                <li className="mb-1">♠ <strong>Козырь:</strong> определяется автоматически</li>
                <li className="mb-1">⚔️ <strong>Правила:</strong> классический, переводной или умный дурак</li>
              </ul>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default MainMenu;
