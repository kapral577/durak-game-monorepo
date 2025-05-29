// src/pages/GameRoomPage.tsx - ФРОНТЕНД - ИСПРАВЛЕНО
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Alert, Spinner, Badge, ProgressBar } from 'react-bootstrap';
import { useGame } from '../context/GameProvider';
import { Player } from '../../shared/types';

const GameRoomPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const {
    currentRoom,
    currentPlayer,
    isConnected,
    gameState,
    setReady,
    startGame,
    leaveRoom,
    error,
    clearError,
    telegramUser
  } = useGame();

  const [isLoading, setIsLoading] = useState(true);

  // Проверяем соответствие комнаты
  useEffect(() => {
    if (!isConnected) return;

    // Если игра уже началась, переходим на игровую страницу
    if (gameState && currentRoom?.id === roomId) {
      navigate(`/game/${roomId}`);
      return;
    }

    // Если нет текущей комнаты или не та комната
    if (!currentRoom || currentRoom.id !== roomId) {
      // В реальном проекте здесь можно попытаться присоединиться к комнате
      console.warn('Room mismatch or not found');
      setTimeout(() => {
        setIsLoading(false);
      }, 2000);
    } else {
      setIsLoading(false);
    }
  }, [isConnected, currentRoom, roomId, gameState, navigate]);

  // Перенаправление при старте игры
  useEffect(() => {
    if (gameState && currentRoom?.id === roomId) {
      navigate(`/game/${roomId}`);
    }
  }, [gameState, currentRoom, roomId, navigate]);

  // Показываем загрузку
  if (!isConnected || isLoading) {
    return (
      <Container className="py-4">
        <Row className="justify-content-center">
          <Col xs={12} md={8} lg={6}>
            <Card className="text-center py-5">
              <Card.Body>
                <Spinner animation="border" className="mb-3" />
                <h5>Подключение к комнате...</h5>
                <p className="text-muted">Загружаем данные комнаты</p>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    );
  }

  // Если комната не найдена
  if (!currentRoom) {
    return (
      <Container className="py-4">
        <Row className="justify-content-center">
          <Col xs={12} md={8} lg={6}>
            <Alert variant="warning">
              <Alert.Heading>Комната не найдена</Alert.Heading>
              <p>Комната с ID {roomId} не существует или вы не подключены к ней.</p>
              <hr />
              <div className="d-flex justify-content-end">
                <Button variant="outline-warning" onClick={() => navigate('/rooms')}>
                  Вернуться к списку комнат
                </Button>
              </div>
            </Alert>
          </Col>
        </Row>
      </Container>
    );
  }

  // Логика комнаты
  const isPlayerReady = currentPlayer?.isReady || false;
  const readyPlayersCount = currentRoom.players.filter(p => p.isReady).length;
  const canStartGame = currentRoom.players.length >= 2 && 
                      currentRoom.players.length <= currentRoom.maxPlayers && 
                      readyPlayersCount === currentRoom.players.length;
  const isRoomCreator = currentRoom.players[0]?.id === currentPlayer?.id;

  const handleReadyToggle = () => {
    setReady();
  };

  const handleStartGame = () => {
    if (canStartGame && isRoomCreator) {
      startGame();
    }
  };

  const handleLeaveRoom = () => {
    leaveRoom();
    navigate('/rooms');
  };

  const getPlayerStatus = (player: Player) => {
    if (player.isReady) {
      return <Badge bg="success">Готов ✓</Badge>;
    }
    return <Badge bg="secondary">Ждет...</Badge>;
  };

  const getGameModeText = (gameMode: string) => {
    switch (gameMode) {
      case 'classic': return 'Классический';
      case 'transferable': return 'Переводной';
      case 'smart': return 'Умный';
      default: return gameMode;
    }
  };

  const getThrowingModeText = (throwingMode: string) => {
    switch (throwingMode) {
      case 'none': return 'Без подкидывания';
      case 'neighbors': return 'Соседи могут подкидывать';
      case 'all': return 'Все могут подкидывать';
      default: return throwingMode;
    }
  };

  return (
    <Container className="py-4">
      <Row className="justify-content-center">
        <Col xs={12} md={8} lg={6}>
          
          {/* Заголовок комнаты */}
          <Card className="mb-4">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <div>
                <h4 className="mb-0">🏠 {currentRoom.name}</h4>
                <small className="text-muted">ID: {currentRoom.id}</small>
              </div>
              <Badge bg={currentRoom.status === 'waiting' ? 'primary' : 'warning'}>
                {currentRoom.status === 'waiting' ? 'Ожидание' : 'В игре'}
              </Badge>
            </Card.Header>
          </Card>

          {/* Ошибки */}
          {error && (
            <Alert variant="danger" dismissible onClose={clearError} className="mb-4">
              <Alert.Heading>Ошибка</Alert.Heading>
              <p className="mb-0">{error}</p>
            </Alert>
          )}

          {/* Правила игры */}
          <Card className="mb-4">
            <Card.Header>
              <h6 className="mb-0">⚙️ Правила игры</h6>
            </Card.Header>
            <Card.Body>
              <div className="row text-center">
                <div className="col-6 col-md-3">
                  <div className="text-primary fw-bold">{getGameModeText(currentRoom.rules.gameMode)}</div>
                  <small className="text-muted">Режим</small>
                </div>
                <div className="col-6 col-md-3">
                  <div className="text-success fw-bold">{currentRoom.rules.cardCount}</div>
                  <small className="text-muted">Карт</small>
                </div>
                <div className="col-12 col-md-6">
                  <div className="text-info fw-bold small">{getThrowingModeText(currentRoom.rules.throwingMode)}</div>
                  <small className="text-muted">Подкидывание</small>
                </div>
              </div>
            </Card.Body>
          </Card>

          {/* Прогресс готовности */}
          <Card className="mb-4">
            <Card.Header>
              <div className="d-flex justify-content-between align-items-center">
                <h6 className="mb-0">👥 Игроки ({currentRoom.players.length}/{currentRoom.maxPlayers})</h6>
                <small className="text-muted">Готовы: {readyPlayersCount}/{currentRoom.players.length}</small>
              </div>
            </Card.Header>
            <Card.Body>
              {/* Прогресс-бар готовности */}
              <ProgressBar 
                now={(readyPlayersCount / currentRoom.players.length) * 100} 
                variant={readyPlayersCount === currentRoom.players.length ? 'success' : 'primary'}
                className="mb-3"
                style={{ height: '8px' }}
              />

              {/* Список игроков */}
              <div className="d-flex flex-column gap-2">
                {currentRoom.players.map((player, index) => (
                  <div 
                    key={player.id} 
                    className={`d-flex align-items-center justify-content-between p-2 rounded ${
                      player.id === currentPlayer?.id ? 'bg-light border' : ''
                    }`}
                  >
                    <div className="d-flex align-items-center">
                      {/* Аватар игрока */}
                      <div 
                        className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center me-3"
                        style={{ width: '40px', height: '40px', fontSize: '1.2rem' }}
                      >
                        {player.telegramId && player.avatar ? (
                          <img 
                            src={player.avatar} 
                            alt={player.name}
                            className="rounded-circle"
                            width={40}
                            height={40}
                          />
                        ) : (
                          player.name.charAt(0).toUpperCase()
                        )}
                      </div>
                      
                      <div>
                        <div className="fw-bold">
                          {player.name}
                          {player.id === currentPlayer?.id && <small className="text-muted ms-2">(Вы)</small>}
                          {index === 0 && <Badge bg="warning" className="ms-2">Хост</Badge>}
                        </div>
                        {player.username && (
                          <small className="text-muted">@{player.username}</small>
                        )}
                      </div>
                    </div>
                    
                    <div className="d-flex align-items-center">
                      {getPlayerStatus(player)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Заглушки для недостающих игроков */}
              {currentRoom.players.length < currentRoom.maxPlayers && (
                <div className="mt-2">
                  {Array.from({ length: currentRoom.maxPlayers - currentRoom.players.length }).map((_, index) => (
                    <div key={`empty-${index}`} className="d-flex align-items-center p-2 rounded border border-dashed">
                      <div 
                        className="rounded-circle bg-light border d-flex align-items-center justify-content-center me-3"
                        style={{ width: '40px', height: '40px' }}
                      >
                        <span className="text-muted">👤</span>
                      </div>
                      <div className="text-muted">
                        <div>Ожидание игрока...</div>
                        <small>Слот свободен</small>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card.Body>
          </Card>

          {/* Действия */}
          <Card>
            <Card.Body>
              <div className="d-grid gap-2">
                
                {/* Кнопка готовности */}
                <Button 
                  variant={isPlayerReady ? 'outline-success' : 'success'}
                  size="lg"
                  onClick={handleReadyToggle}
                  disabled={!isConnected}
                >
                  {isPlayerReady ? (
                    <>
                      <span className="me-2">✓</span>
                      Готов! (нажмите чтобы отменить)
                    </>
                  ) : (
                    <>
                      <span className="me-2">⏳</span>
                      Нажмите когда будете готовы
                    </>
                  )}
                </Button>

                {/* Кнопка старта игры (только для хоста) */}
                {isRoomCreator && (
                  <Button 
                    variant="primary"
                    size="lg"
                    onClick={handleStartGame}
                    disabled={!canStartGame || !isConnected}
                  >
                    {canStartGame ? (
                      <>
                        <span className="me-2">🎮</span>
                        Начать игру
                      </>
                    ) : (
                      <>
                        <span className="me-2">⏳</span>
                        Ждем готовности всех игроков
                      </>
                    )}
                  </Button>
                )}

                {/* Кнопка выхода */}
                <Button 
                  variant="outline-danger"
                  onClick={handleLeaveRoom}
                >
                  <span className="me-2">🚪</span>
                  Покинуть комнату
                </Button>
              </div>

              {/* Подсказки */}
              <div className="mt-3">
                {!canStartGame && currentRoom.players.length < 2 && (
                  <Alert variant="info" className="mb-0 small">
                    <strong>💡 Совет:</strong> Для начала игры нужно минимум 2 игрока. 
                    Пригласите друзей или дождитесь других игроков.
                  </Alert>
                )}
                {!canStartGame && currentRoom.players.length >= 2 && readyPlayersCount < currentRoom.players.length && (
                  <Alert variant="warning" className="mb-0 small">
                    <strong>⏳ Ожидание:</strong> Не все игроки готовы. 
                    Готовых: {readyPlayersCount} из {currentRoom.players.length}
                  </Alert>
                )}
                {canStartGame && isRoomCreator && (
                  <Alert variant="success" className="mb-0 small">
                    <strong>🎮 Готово!</strong> Все игроки готовы. Можете начинать игру!
                  </Alert>
                )}
                {canStartGame && !isRoomCreator && (
                  <Alert variant="info" className="mb-0 small">
                    <strong>⏳ Ожидание:</strong> Все готовы! Ждем когда хост начнет игру.
                  </Alert>
                )}
              </div>
            </Card.Body>
          </Card>

        </Col>
      </Row>
    </Container>
  );
};

export default GameRoomPage;
