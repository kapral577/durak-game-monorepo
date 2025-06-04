// src/pages/MainMenu.tsx - ПОЛНОСТЬЮ РЕФАКТОРИРОВАННАЯ ВЕРСИЯ

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Alert, Badge } from 'react-bootstrap';
import { TelegramAuth } from '../utils/TelegramAuth';
import { useGame } from '../context/GameProvider';

// ===== КОНСТАНТЫ =====
const UI_TEXT = {
  GAME_TITLE: '🃏 Дурак Онлайн',
  GAME_SUBTITLE: 'Классическая карточная игра онлайн',
  WELCOME_MESSAGE: 'Добро пожаловать, {name}!',
  QUICK_GAME: '⚡ Быстрая игра',
  CREATE_ROOM: '🏠 Создать комнату',
  JOIN_ROOM: '🎯 Найти игру',
  INVITE_FRIENDS: '👥 Пригласить друзей',
  GAME_RULES: '📖 Правила игры',
  SETTINGS: '⚙️ Настройки',
  TELEGRAM_ERROR: 'Это приложение должно запускаться из Telegram.',
  DEV_MODE_NOTICE: '**Режим разработки:** Используется тестовый пользователь',
  LOADING_TEXT: 'Инициализация...',
  RECONNECT_BUTTON: '🔄 Переподключиться',
  CONNECTION_STATUS: 'Статус соединения',
} as const;

const MainMenu: React.FC = () => {
  const navigate = useNavigate();
  const { telegramUser, isConnected, error, connect } = useGame();
  
  const [isInitializing, setIsInitializing] = useState(true);

  // Инициализация Telegram WebApp
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Инициализация Telegram WebApp
        if (window.Telegram?.WebApp) {
          const tg = window.Telegram.WebApp;
          tg.ready();
          tg.expand();
          
          // Настройки для игры
          tg.enableClosingConfirmation();
          tg.disableVerticalSwipes();
        }
        
        // Небольшая задержка для корректной инициализации
        await new Promise(resolve => setTimeout(resolve, 500));
        
        setIsInitializing(false);
      } catch (err) {
        console.error('Initialization error:', err);
        setIsInitializing(false);
      }
    };

    initializeApp();
  }, []);

  // Обработчики навигации
  const handleQuickGame = () => {
    navigate('/rooms');
  };

  const handleCreateRoom = () => {
    navigate('/settings');
  };

  const handleJoinRoom = () => {
    navigate('/rooms');
  };

  const handleInviteFriends = () => {
    navigate('/friends');
  };

  const handleReconnect = () => {
    connect();
  };

  // Loading состояние
  if (isInitializing) {
    return (
      <Container className="main-menu-container">
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">{UI_TEXT.LOADING_TEXT}</span>
          </div>
          <p className="text-muted">{UI_TEXT.LOADING_TEXT}</p>
        </div>
      </Container>
    );
  }

  return (
    <Container className="main-menu-container">
      <Row className="justify-content-center">
        <Col md={8} lg={6}>
          {/* Заголовок игры */}
          <Card className="text-center mb-4">
            <Card.Body>
              <h1 className="display-4 mb-2">{UI_TEXT.GAME_TITLE}</h1>
              <p className="lead text-muted">{UI_TEXT.GAME_SUBTITLE}</p>
              
              {/* Приветствие пользователя */}
              {telegramUser && (
                <Alert variant="success" className="mb-0">
                  <h5 className="mb-0">
                    {UI_TEXT.WELCOME_MESSAGE.replace('{name}', telegramUser.name)}
                  </h5>
                </Alert>
              )}
            </Card.Body>
          </Card>

          {/* Статус соединения */}
          <Card className="mb-4">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <span>{UI_TEXT.CONNECTION_STATUS}:</span>
                <div>
                  <Badge bg={isConnected ? 'success' : 'danger'} className="me-2">
                    {isConnected ? 'Подключено' : 'Отключено'}
                  </Badge>
                  {!isConnected && (
                    <Button variant="outline-primary" size="sm" onClick={handleReconnect}>
                      {UI_TEXT.RECONNECT_BUTTON}
                    </Button>
                  )}
                </div>
              </div>
            </Card.Body>
          </Card>

          {/* Ошибки */}
          {error && (
            <Alert variant="danger" className="mb-4">
              {error}
            </Alert>
          )}

          {/* Ошибка Telegram */}
          {!TelegramAuth.isInTelegram() && process.env.NODE_ENV === 'production' && (
            <Alert variant="warning" className="mb-4">
              <Alert.Heading>⚠️ Внимание</Alert.Heading>
              {UI_TEXT.TELEGRAM_ERROR}
            </Alert>
          )}

          {/* Режим разработки */}
          {process.env.NODE_ENV === 'development' && (
            <Alert variant="info" className="mb-4">
              <small>{UI_TEXT.DEV_MODE_NOTICE}</small>
            </Alert>
          )}

          {/* Основные действия */}
          <Card className="mb-4">
            <Card.Body>
              <div className="d-grid gap-3">
                {/* Быстрая игра */}
                <Button 
                  variant="primary" 
                  size="lg" 
                  onClick={handleQuickGame}
                  disabled={!isConnected}
                >
                  {UI_TEXT.QUICK_GAME}
                </Button>

                {/* Создать комнату */}
                <Button 
                  variant="success" 
                  size="lg" 
                  onClick={handleCreateRoom}
                  disabled={!isConnected}
                >
                  {UI_TEXT.CREATE_ROOM}
                </Button>

                {/* Найти игру */}
                <Button 
                  variant="outline-primary" 
                  size="lg" 
                  onClick={handleJoinRoom}
                  disabled={!isConnected}
                >
                  {UI_TEXT.JOIN_ROOM}
                </Button>
              </div>
            </Card.Body>
          </Card>

          {/* Дополнительные действия */}
          <Card>
            <Card.Body>
              <Row className="g-2">
                {/* Пригласить друзей */}
                <Col xs={6}>
                  <Button 
                    variant="outline-secondary" 
                    className="w-100"
                    onClick={handleInviteFriends}
                    disabled={!isConnected}
                  >
                    {UI_TEXT.INVITE_FRIENDS}
                  </Button>
                </Col>

                {/* Правила игры */}
                <Col xs={6}>
                  <Button 
                    variant="outline-info" 
                    className="w-100"
                    onClick={() => {
                      // TODO: Добавить модальное окно с правилами
                      alert('Правила игры будут добавлены в следующем обновлении');
                    }}
                  >
                    {UI_TEXT.GAME_RULES}
                  </Button>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Информация о версии */}
          <div className="text-center mt-4">
            <small className="text-muted">
              Версия 1.0.0 | Telegram Mini App
            </small>
          </div>
        </Col>
      </Row>

      {/* Декоративные элементы */}
      <div className="decorative-blur top-center"></div>
      <div className="decorative-blur bottom-right"></div>
      <div className="decorative-blur left-side"></div>
    </Container>
  );
};

export default MainMenu;
