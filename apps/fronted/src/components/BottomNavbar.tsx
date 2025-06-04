import React, { useCallback, useMemo } from 'react';
import { Navbar, Nav, Badge } from 'react-bootstrap';
import { Link, useLocation } from 'react-router-dom';
import { useGame } from '../context/GameProvider';

// Константы для эмодзи и UI
const EMOJI = {
  HOME_ACTIVE: '🏠',
  HOME_INACTIVE: '🏡',
  ROOMS_ACTIVE: '🎯', 
  ROOMS_INACTIVE: '🎲',
  GAME_ACTIVE: '🃏',
  WAITING: '⏳',
  FRIENDS_ACTIVE: '👥',
  FRIENDS_INACTIVE: '👤',
  SETTINGS_ACTIVE: '⚙️',
  CREATE: '➕',
  ACTIVE_GAME: '🔴',
  NOTIFICATION: '🔔',
  DISCONNECTED: '⚠️'
} as const;

const BottomNavbar: React.FC = () => {
  const location = useLocation();
  const {
    isConnected,
    currentRoom,
    gameState,
    rooms,
    telegramUser
  } = useGame();

  // Мемоизированная функция определения активной страницы
  const isActive = useCallback((path: string): boolean => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  }, [location.pathname]);

  // Мемоизированное количество доступных комнат
  const availableRoomsCount = useMemo(() => {
    if (!rooms || !Array.isArray(rooms)) return 0;
    return rooms.filter(room => 
      room?.status === 'waiting' && 
      room?.players?.length < (room?.maxPlayers || 0)
    ).length;
  }, [rooms]);

  // TODO: Добавить логику уведомлений
  const hasNotifications = false;

  return (
    <Navbar 
      fixed="bottom" 
      bg="dark" 
      variant="dark" 
      className="justify-content-around px-0"
    >
      {/* Главная */}
      <Nav.Link 
        as={Link} 
        to="/" 
        className={`text-center ${isActive('/') ? 'text-primary' : 'text-light'}`}
      >
        <div>
          {isActive('/') ? EMOJI.HOME_ACTIVE : EMOJI.HOME_INACTIVE}
        </div>
        <small>Главная</small>
      </Nav.Link>

      {/* Комнаты */}
      <Nav.Link 
        as={Link} 
        to="/rooms" 
        className={`text-center position-relative ${isActive('/rooms') ? 'text-primary' : 'text-light'}`}
      >
        <div>
          {isActive('/rooms') ? EMOJI.ROOMS_ACTIVE : EMOJI.ROOMS_INACTIVE}
        </div>
        <small>Комнаты</small>
        
        {/* Бейдж с количеством доступных комнат */}
        {availableRoomsCount > 0 && (
          <Badge 
            bg="success" 
            pill 
            className="position-absolute top-0 start-100 translate-middle"
          >
            {availableRoomsCount}
          </Badge>
        )}
      </Nav.Link>

      {/* Текущая игра (если в комнате или игре) */}
      {(currentRoom || gameState) && (
        <Nav.Link 
          as={Link} 
          to={gameState ? "/game" : `/room/${currentRoom?.id}`}
          className={`text-center position-relative ${
            (gameState && isActive('/game')) || 
            (currentRoom && isActive('/room')) 
              ? 'text-primary' 
              : 'text-light'
          }`}
        >
          <div>
            {gameState ? EMOJI.GAME_ACTIVE : EMOJI.WAITING}
          </div>
          <small>{gameState ? 'Игра' : 'Комната'}</small>
          
          {/* Индикатор активной игры */}
          {gameState && (
            <Badge 
              bg="danger" 
              pill 
              className="position-absolute top-0 start-100 translate-middle p-1"
            >
              {EMOJI.ACTIVE_GAME}
            </Badge>
          )}
        </Nav.Link>
      )}

      {/* Друзья */}
      <Nav.Link 
        as={Link} 
        to="/friends" 
        className={`text-center position-relative ${isActive('/friends') ? 'text-primary' : 'text-light'}`}
      >
        <div>
          {isActive('/friends') ? EMOJI.FRIENDS_ACTIVE : EMOJI.FRIENDS_INACTIVE}
        </div>
        <small>Друзья</small>
        
        {/* Бейдж уведомлений */}
        {hasNotifications && (
          <Badge 
            bg="warning" 
            pill 
            className="position-absolute top-0 start-100 translate-middle"
          >
            {EMOJI.NOTIFICATION}
          </Badge>
        )}
      </Nav.Link>

      {/* Создать игру */}
      <Nav.Link 
        as={Link} 
        to="/settings" 
        className={`text-center ${isActive('/settings') ? 'text-primary' : 'text-light'}`}
      >
        <div>
          {isActive('/settings') ? EMOJI.SETTINGS_ACTIVE : EMOJI.CREATE}
        </div>
        <small>Создать</small>
      </Nav.Link>

      {/* Индикатор соединения */}
      {!isConnected && (
        <div className="position-absolute top-0 end-0 m-2">
          <Badge bg="danger">
            {EMOJI.DISCONNECTED}
          </Badge>
        </div>
      )}
    </Navbar>
  );
};

export default BottomNavbar;
