// src/pages/MainMenu.tsx - ГЛАВНОЕ МЕНЮ ИГРЫ

import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Button, Card, Alert, Badge, Spinner } from 'react-bootstrap';
import { useGame } from '../context/GameProvider';
import { useAuth } from '../hooks/useAuth';
import { useDeviceType } from '../hooks/useDeviceType';


// ===== ИНТЕРФЕЙСЫ =====

/**
 * Props для MainMenu
 */
export interface MainMenuProps {
  // Если нужны props в будущем
}

// ===== КОНСТАНТЫ =====

const UI_TEXT = {
  GAME_TITLE: 'Дурак Онлайн',
  GAME_SUBTITLE: 'Играйте с друзьями в Telegram',
  WELCOME_MESSAGE: 'Добро пожаловать, {name}!',
  QUICK_GAME: 'Быстрая игра',
  CREATE_ROOM: 'Создать комнату',
  JOIN_ROOM: 'Присоединиться',
  INVITE_FRIENDS: 'Пригласить друзей',
  CONNECTION_STATUS: 'Статус подключения',
  RECONNECT_BUTTON: 'Переподключиться',
  LOADING_TEXT: 'Инициализация...'
} as const;

const APP_INFO = {
  VERSION: '1.0.0',
  TYPE: 'Telegram Mini App'
} as const;

const TELEGRAM_SETTINGS = {
  INIT_DELAY: 500,
  ENABLE_CLOSING_CONFIRMATION: true,
  DISABLE_VERTICAL_SWIPES: true
} as const;

const CSS_CLASSES = {
  MAIN_MENU: 'main-menu',
  WELCOME_SECTION: 'welcome-section',
  MENU_BUTTONS: 'menu-buttons',
  CONNECTION_STATUS: 'connection-status'
} as const;

// ===== ОСНОВНОЙ КОМПОНЕНТ =====

/**
 * Главное меню игры
 */
export const MainMenu: React.FC<MainMenuProps> = () => {
  console.log('🏠 MainMenu component START rendering...');

  // Состояния
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  // Хуки
  const navigate = useNavigate();
  const { isAuthenticated, logout, telegramUser: authUser } = useAuth();
  const device = useDeviceType();
  console.log('🏠 MainMenu useAuth result:', { isAuthenticated, hasAuthUser: !!authUser });
  const { 
    telegramUser,
    isConnected, 
    connect,
    clearError,
    reconnectAttempts 
  } = useGame();
  console.log('🏠 MainMenu useGame result:', { hasTelegramUser: !!telegramUser, isConnected });


  // ===== ПРОВЕРКА АВТОРИЗАЦИИ ===== ← ДОБАВИТЬ ВЕСЬ ЭТОТ БЛОК
  useEffect(() => {
    console.log('🏠 MainMenu: AUTH CHECK START - isAuthenticated:', isAuthenticated);
    if (!isAuthenticated) {
      console.log('❌ User not authenticated, redirecting to login...');
      navigate('/login', { replace: true });
      return;
    }
    console.log('✅ User authenticated, rendering menu...');
  }, [isAuthenticated, navigate]);

  // ===== ИНИЦИАЛИЗАЦИЯ ПРИЛОЖЕНИЯ =====

  useEffect(() => {
    const initializeApp = async () => {
      try {
        if (window.Telegram?.WebApp) {
          const tg = window.Telegram.WebApp;
          tg.ready();
          tg.expand();
          
          if (TELEGRAM_SETTINGS.ENABLE_CLOSING_CONFIRMATION) {
            tg.enableClosingConfirmation();
          }
          
          if (TELEGRAM_SETTINGS.DISABLE_VERTICAL_SWIPES) {
            tg.disableVerticalSwipes();
          }
          
          // Настройка темы
          if (tg.colorScheme === 'dark') {
            document.body.classList.add('dark-theme');
          }
          
          await new Promise(resolve => setTimeout(resolve, TELEGRAM_SETTINGS.INIT_DELAY));
        } else if (process.env.NODE_ENV === 'production') {
          throw new Error('Telegram WebApp not available');
        }
      } catch (err) {
        console.error('Initialization error:', err);
        // Показать пользователю ошибку
      } finally {
        setIsInitializing(false);
      }
    };

    initializeApp();
  }, []);

  // ===== ОТСЛЕЖИВАНИЕ ОНЛАЙН СТАТУСА =====

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // ===== ОБРАБОТЧИКИ НАВИГАЦИИ =====

  /**
   * Обработчик быстрой игры
   */
  const handleQuickGame = useCallback(() => {
    navigate('/rooms');
  }, [navigate]);

  /**
   * Обработчик создания комнаты
   */
  const handleCreateRoom = useCallback(() => {
    navigate('/settings');
  }, [navigate]);

  /**
   * Обработчик присоединения к комнате
   */
  const handleJoinRoom = useCallback(() => {
    navigate('/rooms');
  }, [navigate]);

  /**
   * Обработчик приглашения друзей
   */
  const handleInviteFriends = useCallback(() => {
    navigate('/friends');
  }, [navigate]);

  /**
   * Обработчик переподключения
   */
  
  const handleReconnect = useCallback(async () => {
    if (!isConnected) {
      try {
        await connect();
        clearError();
      } catch (err) {
        console.error('Reconnection failed:', err);
      }
    }
  }, [isConnected, connect, clearError]);

  /**
   * Обработчик выхода из системы
   */
  const handleLogout = useCallback(async () => {
    try {
      console.log('🚪 Logging out...');
      await logout();
      navigate('/login', { replace: true });
    } catch (err) {
      console.error('❌ Logout error:', err);
    }
  }, [logout, navigate]);

  // ===== KEYBOARD SHORTCUTS =====

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      switch (event.key) {
        case '1':
          handleQuickGame();
          break;
        case '2':
          handleCreateRoom();
          break;
        case '3':
          handleJoinRoom();
          break;
        case '4':
          handleInviteFriends();
          break;
        case 'Escape':
          handleLogout();
          break;
        case 'r':
          if (event.ctrlKey && !isConnected) {
            handleReconnect();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleQuickGame, handleCreateRoom, handleJoinRoom, handleInviteFriends, handleReconnect, isConnected]);

  // ===== EARLY RETURN ДЛЯ ИНИЦИАЛИЗАЦИИ =====

  if (isInitializing) {
    return (
      <Container className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="text-center">
          <Spinner animation="border" className="mb-3" />
          <p>{UI_TEXT.LOADING_TEXT}</p>
        </div>
      </Container>
    );
  }

  // ===== РЕНДЕР =====

  return (
    <Container 
      className={`${CSS_CLASSES.MAIN_MENU} adaptive-container with-safe-area`}
      role="main" 
      aria-label="Главное меню игры"
    >
      {/* Уведомление об отсутствии интернета */}
      {!isOnline && (
        <Alert variant="warning" className="mb-3">
          Нет подключения к интернету
        </Alert>
      )}

      {/* Секция приветствия */}
      <Row className="mb-4">
        <Col>
          <Card className={`${CSS_CLASSES.WELCOME_SECTION} text-center`}>
            <Card.Body>
              <h1 className="display-4">{UI_TEXT.GAME_TITLE}</h1>
              <p className="lead text-muted">{UI_TEXT.GAME_SUBTITLE}</p>
              {telegramUser && (
                <Alert variant="info">
                  {UI_TEXT.WELCOME_MESSAGE.replace('{name}', telegramUser.first_name || 'Игрок')}
                </Alert>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Статус подключения */}
      <Row className="mb-3">
        <Col>
          <div className={`${CSS_CLASSES.CONNECTION_STATUS} d-flex justify-content-between align-items-center`}>
            <span>{UI_TEXT.CONNECTION_STATUS}:</span>
            <div>
              <Badge variant={isConnected ? "success" : "danger"}>
                {isConnected ? 'Подключено' : 'Отключено'}
              </Badge>
              {!isConnected && (
                <Button 
                  variant="outline-primary" 
                  size="sm" 
                  onClick={handleReconnect} 
                  className="ms-2"
                  aria-label="Попробовать переподключиться"
                >
                  {UI_TEXT.RECONNECT_BUTTON}
                  {reconnectAttempts > 0 && (
                    <Badge variant="light" className="ms-1">
                      {reconnectAttempts}
                    </Badge>
                  )}
                </Button>
              )}
            </div>
          </div>
        </Col>
      </Row>

      {/* Кнопки меню */}
      <div className={`${CSS_CLASSES.MENU_BUTTONS} safe-area-bottom`}>
        <Row className="g-3">
          <Col xs={12}>
            <Button
              variant="primary"
              size="lg"
              onClick={handleQuickGame}
              className="w-100"
              aria-label="Начать быструю игру"
              accessKey="1"
            >
              🎮 {UI_TEXT.QUICK_GAME}
            </Button>
          </Col>
          
          <Col xs={12} md={6}>
            <Button
              variant="success"
              size="lg"
              onClick={handleCreateRoom}
              className="w-100"
              aria-label="Создать новую игровую комнату"
              accessKey="2"
            >
              ➕ {UI_TEXT.CREATE_ROOM}
            </Button>
          </Col>
          
          <Col xs={12} md={6}>
            <Button
              variant="info"
              size="lg"
              onClick={handleJoinRoom}
              className="w-100"
              aria-label="Присоединиться к существующей комнате"
              accessKey="3"
            >
              🚪 {UI_TEXT.JOIN_ROOM}
            </Button>
          </Col>
          
          <Col xs={12}>
            <Button
              variant="outline-primary"
              size="lg"
              onClick={handleInviteFriends}
              className="w-100"
              aria-label="Пригласить друзей в игру"
              accessKey="4"
            >
              👥 {UI_TEXT.INVITE_FRIENDS}
            </Button>
          </Col>

          <Col xs={12}>
            <Button
              variant="outline-primary"
              size="lg"
              onClick={handleInviteFriends}
              className="w-100"
              aria-label="Пригласить друзей в игру"
              accessKey="4"
            >
              👥 {UI_TEXT.INVITE_FRIENDS}
            </Button>
          </Col>
          
          {/* ДОБАВИТЬ НОВУЮ КНОПКУ ЗДЕСЬ: */}
          <Col xs={12} className="mt-3">
            <Button
              variant="outline-danger"
              size="lg"
              onClick={handleLogout}
              className="btn btn-outline-danger safe-area-bottom"
              aria-label="Выйти из игры"
            >
              🚪 Выйти
            </Button>
          </Col>
        </Row>
      </div>

      {/* Информация о приложении */}
      <Row className="mt-4">
        <Col>
          <Card>
            <Card.Body className="text-center">
              <small className="text-muted">
                {APP_INFO.TYPE} v{APP_INFO.VERSION}
                {process.env.NODE_ENV === 'development' && (
                  <span className="text-warning ms-2">(Development)</span>
                )}
              </small>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Подсказки по клавишам для development */}
      {process.env.NODE_ENV === 'development' && (
        <Row className="mt-3">
          <Col>
            <Alert variant="info">
              <small>
                <strong>Клавиши:</strong> 1 - Быстрая игра, 2 - Создать, 3 - Присоединиться, 4 - Друзья, Ctrl+R - Переподключение
              </small>
            </Alert>
          </Col>
        </Row>
      )}
    </Container>
  );
};

// Установка displayName для лучшей отладки
MainMenu.displayName = 'MainMenu';

// ===== ЭКСПОРТ =====
export default MainMenu;
export type { MainMenuProps };
export { UI_TEXT, APP_INFO, TELEGRAM_SETTINGS, CSS_CLASSES };
