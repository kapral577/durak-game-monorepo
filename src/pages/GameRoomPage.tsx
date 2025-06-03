// src/pages/GameRoomPage.tsx - РЕФАКТОРИРОВАННАЯ ВЕРСИЯ

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Alert, Spinner, Badge, ProgressBar } from 'react-bootstrap';
import { useGame } from '../context/GameProvider';

// ===== КОНСТАНТЫ =====
const UI_TEXT = {
  PAGE_TITLE: '🏠 Комната',
  LOADING_ROOM: 'Подключение к комнате...',
  LOADING_DATA: 'Загружаем данные комнаты',
  ROOM_NOT_FOUND: 'Комната не найдена',
  ROOM_NOT_EXISTS: 'Комната с ID {roomId} не существует или вы не подключены к ней.',
  BACK_TO_ROOMS: 'Вернуться к списку комнат',
  GAME_RULES: '⚙️ Правила игры',
  PLAYERS_TITLE: '👥 Игроки',
  READY_PROGRESS: 'Прогресс готовности',
  READY_BUTTON: 'Готов!',
  NOT_READY_BUTTON: 'Нажмите когда будете готовы',
  CANCEL_READY: 'Готов! (нажмите чтобы отменить)',
  LEAVE_ROOM: 'Покинуть комнату',
  WAITING_PLAYER: 'Ожидание игрока...',
  SLOT_FREE: 'Слот свободен',
  FREE_STATUS: 'Свободно',
  YOU_LABEL: '(Вы)',
  HOST_LABEL: 'Хост',
  READY_STATUS: 'Готов ✓',
  WAITING_STATUS: 'Ждет...',
  DISCONNECTED_STATUS: 'Отключен',
  GAME_STARTING: '🎮 Игра начинается через {countdown} сек!',
  AUTO_START_HINT: 'Игра запускается автоматически когда все игроки нажмут "Готов"',
  NEED_MORE_PLAYERS: '💡 Нужно больше игроков: Для начала игры нужно минимум 2 игрока.',
  WAITING_READY: '⏳ Ожидание готовности: Не все игроки готовы.',
  ALL_READY: '🎮 Готово! Все игроки готовы. Игра запустится автоматически!',
  MIN_PLAYERS_HINT: '💡 Совет: Для начала игры нужно минимум 2 игрока.',
} as const;

const GAME_MODE_TEXTS = {
  classic: 'Классический',
  transferable: 'Переводной',
} as const;

const THROWING_MODE_TEXTS = {
  standard: 'Стандартное',
  smart: 'Умное',
} as const;

const STATUS_VARIANTS = {
  waiting: 'warning',
  playing: 'success',
  finished: 'secondary',
} as const;

const GameRoomPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  
  const {
    currentRoom,
    currentPlayer,
    isConnected,
    gameState,
    setReady,
    leaveRoom,
    error,
    autoStartInfo,
    notification,
    clearNotification,
  } = useGame();

  const [isLoading, setIsLoading] = useState(true);

  // Мемоизированные вычисления
  const roomStats = useMemo(() => {
    if (!currentRoom) return { connectedPlayers: [], readyPlayers: [], isPlayerReady: false };
    
    const connectedPlayers = currentRoom.players.filter(p => p.isConnected !== false);
    const readyPlayers = connectedPlayers.filter(p => p.isReady);
    const isPlayerReady = currentPlayer?.isReady || false;
    
    return { connectedPlayers, readyPlayers, isPlayerReady };
  }, [currentRoom, currentPlayer]);

  // Навигация при старте игры
  useEffect(() => {
    if (gameState && currentRoom?.id === roomId) {
      navigate(`/game`);
    }
  }, [gameState, currentRoom, roomId, navigate]);

  // Проверка соответствия комнаты
  useEffect(() => {
    if (!isConnected) return;
    
    if (!currentRoom || currentRoom.id !== roomId) {
      const timer = setTimeout(() => setIsLoading(false), 2000);
      return () => clearTimeout(timer);
    } else {
      setIsLoading(false);
    }
  }, [isConnected, currentRoom, roomId]);

  // Автоматическая очистка уведомлений
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => clearNotification(), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification, clearNotification]);

  // Обработчики событий
  const handleReadyToggle = useCallback(() => {
    setReady();
  }, [setReady]);

  const handleLeaveRoom = useCallback(() => {
    leaveRoom();
    navigate('/rooms');
  }, [leaveRoom, navigate]);

  const handleBackToRooms = useCallback(() => {
    navigate('/rooms');
  }, [navigate]);

  // Утилиты
  const getPlayerStatus = useCallback((player: any) => {
    if (!player.isConnected && player.isConnected !== undefined) {
      return <Badge bg="danger">{UI_TEXT.DISCONNECTED_STATUS}</Badge>;
    }
    if (player.isReady) {
      return <Badge bg="success">{UI_TEXT.READY_STATUS}</Badge>;
    }
    return <Badge bg="secondary">{UI_TEXT.WAITING_STATUS}</Badge>;
  }, []);

  const getGameModeText = useCallback((gameMode: string) => {
    return GAME_MODE_TEXTS[gameMode as keyof typeof GAME_MODE_TEXTS] || gameMode;
  }, []);

  const getThrowingModeText = useCallback((throwingMode: string) => {
    return THROWING_MODE_TEXTS[throwingMode as keyof typeof THROWING_MODE_TEXTS] || throwingMode;
  }, []);

  // Loading состояние
  if (!isConnected || isLoading) {
    return (
      <Container className="py-4 text-center">
        <Spinner animation="border" className="me-2" />
        <div>
          <h4>{UI_TEXT.LOADING_ROOM}</h4>
          <p className="text-muted">{UI_TEXT.LOADING_DATA}</p>
        </div>
      </Container>
    );
  }

  // Комната не найдена
  if (!currentRoom) {
    return (
      <Container className="py-4">
        <Alert variant="danger">
          <Alert.Heading>{UI_TEXT.ROOM_NOT_FOUND}</Alert.Heading>
          <p>{UI_TEXT.ROOM_NOT_EXISTS.replace('{roomId}', roomId || '')}</p>
          <Button variant="primary" onClick={handleBackToRooms}>
            {UI_TEXT.BACK_TO_ROOMS}
          </Button>
        </Alert>
      </Container>
    );
  }

  const { connectedPlayers, readyPlayers, isPlayerReady } = roomStats;

  return (
    <Container className="py-4">
      {/* Заголовок комнаты */}
      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Body className="text-center">
              <h2>{UI_TEXT.PAGE_TITLE} {currentRoom.name}</h2>
              <div className="d-flex justify-content-center align-items-center gap-3">
                <small className="text-muted">ID: {currentRoom.id}</small>
                <Badge bg={STATUS_VARIANTS[currentRoom.status as keyof typeof STATUS_VARIANTS] as any}>
                  {currentRoom.status === 'waiting' ? 'Ожидание' : 'В игре'}
                </Badge>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Автостарт статус */}
      {autoStartInfo?.isAutoStarting && (
        <Alert variant="info" className="mb-3">
          <div className="text-center fw-bold">
            {UI_TEXT.GAME_STARTING.replace('{countdown}', autoStartInfo.countdown.toString())}
          </div>
        </Alert>
      )}

      {/* Уведомления */}
      {notification && !autoStartInfo?.isAutoStarting && (
        <Alert variant="info" className="mb-3">
          {notification}
        </Alert>
      )}

      {/* Ошибки */}
      {error && (
        <Alert variant="danger" className="mb-3">
          <Alert.Heading>Ошибка</Alert.Heading>
          {error}
        </Alert>
      )}

      <Row className="g-4">
        {/* Правила игры */}
        <Col md={6}>
          <Card>
            <Card.Body>
              <Card.Title>{UI_TEXT.GAME_RULES}</Card.Title>
              <Row className="g-2">
                <Col xs={6}>
                  <div className="text-center">
                    <div className="fw-bold">{getGameModeText(currentRoom.rules.gameMode)}</div>
                    <small className="text-muted">Режим</small>
                  </div>
                </Col>
                <Col xs={6}>
                  <div className="text-center">
                    <div className="fw-bold">{currentRoom.rules.cardCount}</div>
                    <small className="text-muted">Карт</small>
                  </div>
                </Col>
                <Col xs={6}>
                  <div className="text-center">
                    <div className="fw-bold">{getThrowingModeText(currentRoom.rules.throwingMode)}</div>
                    <small className="text-muted">Подкидывание</small>
                  </div>
                </Col>
                <Col xs={6}>
                  <div className="text-center">
                    <div className="fw-bold">{currentRoom.maxPlayers}</div>
                    <small className="text-muted">Макс. игроков</small>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>

        {/* Прогресс готовности */}
        <Col md={6}>
          <Card>
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span>{UI_TEXT.PLAYERS_TITLE} ({connectedPlayers.length}/{currentRoom.maxPlayers})</span>
                {autoStartInfo ? (
                  <Badge bg="primary">
                    Готовы: {autoStartInfo.readyCount}/{autoStartInfo.totalCount}
                  </Badge>
                ) : (
                  <Badge bg={readyPlayers.length >= 2 ? 'success' : 'warning'}>
                    Готовы: {readyPlayers.length}/{connectedPlayers.length}
                  </Badge>
                )}
              </div>
              
              <div className="mb-2">
                <small className="text-muted">{UI_TEXT.READY_PROGRESS}</small>
                <ProgressBar 
                  now={autoStartInfo ? 
                    (autoStartInfo.readyCount / autoStartInfo.totalCount) * 100 :
                    (readyPlayers.length / Math.max(connectedPlayers.length, 1)) * 100
                  }
                  variant={readyPlayers.length >= 2 ? 'success' : 'warning'}
                  label={autoStartInfo ?
                    `${autoStartInfo.readyCount}/${autoStartInfo.totalCount}` :
                    `${readyPlayers.length}/${connectedPlayers.length}`
                  }
                />
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Список игроков */}
      <Row className="mt-4">
        <Col>
          <Card>
            <Card.Body>
              <Row className="g-3">
                {currentRoom.players.map((player, index) => (
                  <Col md={6} lg={4} key={player.id}>
                    <Card className="h-100">
                      <Card.Body className="d-flex align-items-center">
                        {/* Аватар */}
                        <div className="me-3">
                          <div 
                            className="rounded-circle bg-primary d-flex align-items-center justify-content-center"
                            style={{ width: '50px', height: '50px' }}
                          >
                            <span className="text-white fw-bold">
                              {player.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        
                        {/* Информация */}
                        <div className="flex-grow-1">
                          <div className="fw-bold">
                            {player.name}
                            {player.id === currentPlayer?.id && (
                              <small className="text-primary ms-1">{UI_TEXT.YOU_LABEL}</small>
                            )}
                            {index === 0 && (
                              <small className="text-warning ms-1">{UI_TEXT.HOST_LABEL}</small>
                            )}
                          </div>
                          {player.username && (
                            <small className="text-muted">@{player.username}</small>
                          )}
                          <div className="mt-1">
                            {getPlayerStatus(player)}
                          </div>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}

                {/* Пустые слоты */}
                {connectedPlayers.length < currentRoom.maxPlayers && (
                  <>
                    {Array.from({ length: currentRoom.maxPlayers - connectedPlayers.length }).map((_, index) => (
                      <Col md={6} lg={4} key={`empty-${index}`}>
                        <Card className="h-100">
                          <Card.Body className="d-flex align-items-center text-muted">
                            <div className="me-3">
                              <div 
                                className="rounded-circle bg-light d-flex align-items-center justify-content-center"
                                style={{ width: '50px', height: '50px' }}
                              >
                                <span>?</span>
                              </div>
                            </div>
                            <div>
                              <div>{UI_TEXT.WAITING_PLAYER}</div>
                              <small>{UI_TEXT.SLOT_FREE}</small>
                              <div className="mt-1">
                                <Badge bg="light" text="dark">{UI_TEXT.FREE_STATUS}</Badge>
                              </div>
                            </div>
                          </Card.Body>
                        </Card>
                      </Col>
                    ))}
                  </>
                )}
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Действия */}
      <Row className="mt-4">
        <Col>
          <div className="d-grid gap-2">
            {/* Кнопка готовности */}
            <Button
              variant={isPlayerReady ? 'warning' : 'success'}
              size="lg"
              onClick={handleReadyToggle}
            >
              {isPlayerReady ? UI_TEXT.CANCEL_READY : UI_TEXT.NOT_READY_BUTTON}
            </Button>
            
            {/* Кнопка выхода */}
            <Button variant="outline-danger" onClick={handleLeaveRoom}>
              {UI_TEXT.LEAVE_ROOM}
            </Button>
          </div>
        </Col>
      </Row>

      {/* Подсказки */}
      <Row className="mt-3">
        <Col>
          {autoStartInfo?.needMorePlayers && (
            <Alert variant="info">
              <div className="fw-bold">{UI_TEXT.NEED_MORE_PLAYERS}</div>
              <small>Пригласите друзей или дождитесь других игроков.</small>
            </Alert>
          )}

          {autoStartInfo && !autoStartInfo.needMorePlayers && !autoStartInfo.allReady && (
            <Alert variant="warning">
              <div className="fw-bold">{UI_TEXT.WAITING_READY}</div>
              <small>Готовых: {autoStartInfo.readyCount} из {autoStartInfo.totalCount}</small>
            </Alert>
          )}

          {autoStartInfo?.allReady && !autoStartInfo.isAutoStarting && (
            <Alert variant="success">
              <div className="fw-bold">{UI_TEXT.ALL_READY}</div>
            </Alert>
          )}

          {!autoStartInfo && connectedPlayers.length < 2 && (
            <Alert variant="info">
              <small>{UI_TEXT.MIN_PLAYERS_HINT}</small>
            </Alert>
          )}

          {/* Информация об автостарте */}
          <div className="text-center">
            <small className="text-muted">{UI_TEXT.AUTO_START_HINT}</small>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default GameRoomPage;
