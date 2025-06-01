// src/pages/GameRoomPage.tsx - АВТОМАТИЧЕСКИЙ СТАРТ ИГРЫ
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Alert, Spinner, Badge, ProgressBar } from 'react-bootstrap';
import { useGame } from '../context/GameProvider';

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
    clearError,
    autoStartInfo, // ✅ НОВОЕ
    notification, // ✅ НОВОЕ
    clearNotification, // ✅ НОВОЕ
    telegramUser
  } = useGame();

  const [isLoading, setIsLoading] = useState(true);
  const [forceRender, setForceRender] = useState(0); // ✅ ДОБАВЛЕНО: принудительный ререндер

  // ✅ ДОБАВЛЕНО: принудительное обновление при изменении currentRoom
  useEffect(() => {
    console.log('🔄 currentRoom changed, forcing rerender...', {
      roomId: currentRoom?.id,
      players: currentRoom?.players?.map(p => ({ id: p.id, name: p.name })),
      playersCount: currentRoom?.players?.length
    });
    setForceRender(prev => prev + 1);
  }, [currentRoom, currentRoom?.players, currentRoom?.players?.length]);

  // Проверяем соответствие комнаты
  useEffect(() => {
    if (!isConnected) return;

    // Если игра уже началась, переходим на игровую страницу
    if (gameState && currentRoom?.id === roomId) {
      navigate(`/game/${roomId}`);
      return;
    } // ✅ ИСПРАВЛЕНО: добавлена закрывающая скобка

    // Если нет текущей комнаты или не та комната
    if (!currentRoom || currentRoom.id !== roomId) {
      console.warn('Room mismatch or not found');
      setTimeout(() => {
        setIsLoading(false);
      }, 2000);
    } else {
      setIsLoading(false);
    } // ✅ ИСПРАВЛЕНО: добавлена закрывающая скобка
  }, [isConnected, currentRoom, roomId, gameState, navigate]);

  // Перенаправление при старте игры
  useEffect(() => {
    if (gameState && currentRoom?.id === roomId) {
      navigate(`/game/${roomId}`);
    } // ✅ ИСПРАВЛЕНО: добавлена закрывающая скобка
  }, [gameState, currentRoom, roomId, navigate]);

  // ✅ АВТОМАТИЧЕСКАЯ ОЧИСТКА УВЕДОМЛЕНИЙ
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        clearNotification();
      }, 5000); // 5 секунд
      
      return () => clearTimeout(timer);
    } // ✅ ИСПРАВЛЕНО: добавлена закрывающая скобка
  }, [notification, clearNotification]);

  // Показываем загрузку
  if (!isConnected || isLoading) {
    return (
      <Container className="py-4">
        <Row>
          <Col md={8} className="mx-auto text-center">
            <Card>
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
  } // ✅ ИСПРАВЛЕНО: добавлена закрывающая скобка

  // Если комната не найдена
  if (!currentRoom) {
    return (
      <Container className="py-4">
        <Row>
          <Col md={8} className="mx-auto">
            <Alert variant="danger">
              <Alert.Heading>Комната не найдена</Alert.Heading>
              <p>Комната с ID {roomId} не существует или вы не подключены к ней.</p>
              <Button variant="outline-primary" onClick={() => navigate('/rooms')}>
                Вернуться к списку комнат
              </Button>
            </Alert>
          </Col>
        </Row>
      </Container>
    );
  } // ✅ ИСПРАВЛЕНО: добавлена закрывающая скобка

  // Логика комнаты
  const isPlayerReady = currentPlayer?.isReady || false;
  const connectedPlayers = currentRoom.players.filter(p => p.isConnected !== false);
  const readyPlayers = connectedPlayers.filter(p => p.isReady);

  const handleReadyToggle = () => {
    setReady();
  };

  const handleLeaveRoom = () => {
    leaveRoom();
    navigate('/rooms');
  };

  const getPlayerStatus = (player: any) => {
    if (!player.isConnected && player.isConnected !== undefined) {
      return <Badge bg="secondary">Отключен</Badge>;
    } // ✅ ИСПРАВЛЕНО: добавлена закрывающая скобка
    
    if (player.isReady) {
      return <Badge bg="success">Готов ✓</Badge>;
    } // ✅ ИСПРАВЛЕНО: добавлена закрывающая скобка
    
    return <Badge bg="warning">Ждет...</Badge>;
  };

  const getGameModeText = (gameMode: string) => {
    switch (gameMode) {
      case 'classic': return 'Классический';
      case 'transferable': return 'Переводной';
      default: return gameMode;
    } // ✅ ИСПРАВЛЕНО: добавлена закрывающая скобка
  };

  const getThrowingModeText = (throwingMode: string) => {
    switch (throwingMode) {
      case 'standard': return 'Стандартное';
      case 'smart': return 'Умное';
      default: return throwingMode;
    } // ✅ ИСПРАВЛЕНО: добавлена закрывающая скобка
  };

  return (
    <Container className="py-4" key={forceRender}> {/* ✅ ДОБАВЛЕНО: key для принудительного ререндера */}
      <Row>
        <Col lg={8} className="mx-auto">
          {/* Заголовок комнаты */}
          <Card className="mb-4">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <div>
                <h5 className="mb-0">🏠 {currentRoom.name}</h5>
                <small className="text-muted">ID: {currentRoom.id}</small>
              </div>
              <Badge bg={currentRoom.status === 'waiting' ? 'primary' : 'success'}>
                {currentRoom.status === 'waiting' ? 'Ожидание' : 'В игре'}
              </Badge>
            </Card.Header>
            
            {/* ✅ АВТОСТАРТ СТАТУС */}
            {autoStartInfo?.isAutoStarting && (
              <Alert variant="success" className="mb-0">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <strong>🎮 Игра начинается через {autoStartInfo.countdown} сек!</strong>
                  </div>
                  <Spinner animation="border" size="sm" />
                </div>
              </Alert>
            )}

            {/* ✅ УВЕДОМЛЕНИЯ */}
            {notification && !autoStartInfo?.isAutoStarting && (
              <Alert 
                variant={notification.includes('✅') || notification.includes('🎮') ? 'success' : 'info'} 
                className="mb-0"
                dismissible
                onClose={clearNotification}
              >
                {notification}
              </Alert>
            )}
          </Card>

          {/* Ошибки */}
          {error && (
            <Alert variant="danger" className="mb-4" dismissible onClose={clearError}>
              <Alert.Heading>Ошибка</Alert.Heading>
              {error}
            </Alert>
          )}

          {/* Правила игры */}
          <Card className="mb-4">
            <Card.Header>
              <h6 className="mb-0">⚙️ Правила игры</h6>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={3}>
                  <div className="text-center">
                    <div className="fw-bold">{getGameModeText(currentRoom.rules.gameMode)}</div>
                    <small className="text-muted">Режим</small>
                  </div>
                </Col>
                <Col md={3}>
                  <div className="text-center">
                    <div className="fw-bold">{currentRoom.rules.cardCount}</div>
                    <small className="text-muted">Карт</small>
                  </div>
                </Col>
                <Col md={3}>
                  <div className="text-center">
                    <div className="fw-bold">{getThrowingModeText(currentRoom.rules.throwingMode)}</div>
                    <small className="text-muted">Подкидывание</small>
                  </div>
                </Col>
                <Col md={3}>
                  <div className="text-center">
                    <div className="fw-bold">{currentRoom.maxPlayers}</div>
                    <small className="text-muted">Макс. игроков</small>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* ✅ АВТОСТАРТ ПРОГРЕСС */}
          <Card className="mb-4">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h6 className="mb-0">👥 Игроки ({connectedPlayers.length}/{currentRoom.maxPlayers})</h6>
              <div>
                {autoStartInfo ? (
                  <Badge bg={autoStartInfo.allReady ? 'success' : 'warning'}>
                    Готовы: {autoStartInfo.readyCount}/{autoStartInfo.totalCount}
                  </Badge>
                ) : (
                  <Badge bg={readyPlayers.length === connectedPlayers.length && connectedPlayers.length >= 2 ? 'success' : 'warning'}>
                    Готовы: {readyPlayers.length}/{connectedPlayers.length}
                  </Badge>
                )}
              </div>
            </Card.Header>

            {/* ✅ ПРОГРЕСС-БАР АВТОСТАРТА */}
            <Card.Body>
              <div className="mb-3">
                <div className="d-flex justify-content-between mb-1">
                  <small>Прогресс готовности</small>
                  <small>
                    {autoStartInfo ? 
                      `${autoStartInfo.readyCount}/${autoStartInfo.totalCount}` : 
                      `${readyPlayers.length}/${connectedPlayers.length}`
                    }
                  </small>
                </div>
                <ProgressBar 
                  now={autoStartInfo ? 
                    (autoStartInfo.readyCount / Math.max(autoStartInfo.totalCount, 1)) * 100 : 
                    (readyPlayers.length / Math.max(connectedPlayers.length, 1)) * 100
                  }
                  variant={autoStartInfo?.allReady ? 'success' : 'primary'}
                />
              </div>

              {/* Список игроков */}
              <div className="mb-3">
                {currentRoom.players.map((player, index) => (
                  <div key={`${player.id}-${forceRender}`} className="d-flex align-items-center mb-2 p-2 border rounded"> {/* ✅ ДОБАВЛЕНО: key с forceRender */}
                    {/* Аватар игрока */}
                    <div className="me-3">
                      {player.telegramId && player.avatar ? (
                        <img 
                          src={player.avatar} 
                          alt={player.name}
                          className="rounded-circle"
                          width="40"
                          height="40"
                        />
                      ) : (
                        <div 
                          className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center"
                          style={{ width: '40px', height: '40px' }}
                        >
                          {player.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>

                    {/* Информация игрока */}
                    <div className="flex-grow-1">
                      <div className="fw-bold">
                        {player.name}
                        {player.id === currentPlayer?.id && <small className="text-muted ms-1">(Вы)</small>}
                        {index === 0 && <Badge bg="info" className="ms-2">Хост</Badge>}
                      </div>
                      {player.username && (
                        <small className="text-muted">@{player.username}</small>
                      )}
                    </div>

                    {/* Статус готовности */}
                    <div>
                      {getPlayerStatus(player)}
                    </div>
                  </div>
                ))}

                {/* Заглушки для недостающих игроков */}
                {connectedPlayers.length < currentRoom.maxPlayers && (
                  <>
                    {Array.from({ length: currentRoom.maxPlayers - connectedPlayers.length }).map((_, index) => (
                      <div key={`empty-${index}-${forceRender}`} className="d-flex align-items-center mb-2 p-2 border rounded border-dashed"> {/* ✅ ДОБАВЛЕНО: key с forceRender */}
                        <div className="me-3">
                          <div 
                            className="rounded-circle bg-light border d-flex align-items-center justify-content-center"
                            style={{ width: '40px', height: '40px' }}
                          >
                            ?
                          </div>
                        </div>
                        <div className="flex-grow-1">
                          <div className="text-muted">Ожидание игрока...</div>
                          <small className="text-muted">Слот свободен</small>
                        </div>
                        <Badge bg="secondary">Свободно</Badge>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </Card.Body>
          </Card>

          {/* ✅ ДЕЙСТВИЯ БЕЗ КНОПКИ "НАЧАТЬ ИГРУ" */}
          <Card>
            <Card.Body>
              <div className="d-grid gap-2">
                {/* Кнопка готовности */}
                <Button 
                  variant={isPlayerReady ? 'success' : 'outline-primary'}
                  size="lg"
                  onClick={handleReadyToggle}
                  disabled={autoStartInfo?.isAutoStarting}
                >
                  {isPlayerReady ? (
                    <>
                      <i className="bi bi-check-circle-fill me-2"></i>
                      Готов! (нажмите чтобы отменить)
                    </>
                  ) : (
                    <>
                      <i className="bi bi-circle me-2"></i>
                      Нажмите когда будете готовы
                    </>
                  )}
                </Button>

                {/* Кнопка выхода */}
                <Button 
                  variant="outline-danger" 
                  onClick={handleLeaveRoom}
                  disabled={autoStartInfo?.isAutoStarting}
                >
                  <i className="bi bi-box-arrow-left me-2"></i>
                  Покинуть комнату
                </Button>
              </div>

              {/* ✅ АВТОСТАРТ ПОДСКАЗКИ */}
              <div className="mt-3">
                {autoStartInfo?.needMorePlayers && (
                  <Alert variant="info" className="mb-2">
                    <i className="bi bi-info-circle me-2"></i>
                    <strong>💡 Нужно больше игроков:</strong> Для начала игры нужно минимум 2 игрока.
                    Пригласите друзей или дождитесь других игроков.
                  </Alert>
                )}

                {autoStartInfo && !autoStartInfo.needMorePlayers && !autoStartInfo.allReady && (
                  <Alert variant="warning" className="mb-2">
                    <i className="bi bi-clock me-2"></i>
                    <strong>⏳ Ожидание готовности:</strong> Не все игроки готовы.
                    Готовых: {autoStartInfo.readyCount} из {autoStartInfo.totalCount}
                  </Alert>
                )}

                {autoStartInfo?.allReady && !autoStartInfo.isAutoStarting && (
                  <Alert variant="success" className="mb-2">
                    <i className="bi bi-play-circle me-2"></i>
                    <strong>🎮 Готово!</strong> Все игроки готовы. Игра запустится автоматически!
                  </Alert>
                )}

                {!autoStartInfo && connectedPlayers.length < 2 && (
                  <Alert variant="info" className="mb-2">
                    <i className="bi bi-people me-2"></i>
                    <strong>💡 Совет:</strong> Для начала игры нужно минимум 2 игрока.
                  </Alert>
                )}

                {/* Информация об автостарте */}
                <small className="text-muted">
                  <i className="bi bi-lightning me-1"></i>
                  Игра запускается автоматически когда все игроки нажмут "Готов"
                </small>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default GameRoomPage;
