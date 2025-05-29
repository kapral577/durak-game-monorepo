import React from 'react';
import { Navbar, Nav, Badge } from 'react-bootstrap';
import { Link, useLocation } from 'react-router-dom';
import { useGame } from '../context/GameProvider';

const BottomNavbar: React.FC = () => {
  const location = useLocation();
  const { 
    isConnected, 
    currentRoom, 
    gameState, 
    rooms,
    telegramUser 
  } = useGame();

  // Определяем активную страницу
  const isActive = (path: string): boolean => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  // Получаем количество доступных комнат
  const availableRoomsCount = rooms.filter(room => 
    room.status === 'waiting' && room.players.length < room.maxPlayers
  ).length;

  // Проверяем, есть ли уведомления (например, приглашения)
  const hasNotifications = false; // Можно добавить логику уведомлений

  return (
    <Navbar bg="light" className="border-top justify-content-center fixed-bottom">
      <Nav className="d-flex justify-content-around w-100">
        
        {/* Главная */}
        <Nav.Item className="text-center">
          <Nav.Link
            as={Link}
            to="/"
            className={`d-flex flex-column align-items-center p-2 ${
              isActive('/') ? 'text-primary' : 'text-muted'
            }`}
          >
            <span style={{ fontSize: '1.2rem' }}>
              {isActive('/') ? '🏠' : '🏡'}
            </span>
            <small>Главная</small>
          </Nav.Link>
        </Nav.Item>

        {/* Комнаты */}
        <Nav.Item className="text-center position-relative">
          <Nav.Link
            as={Link}
            to="/rooms"
            className={`d-flex flex-column align-items-center p-2 ${
              isActive('/rooms') ? 'text-primary' : 'text-muted'
            }`}
          >
            <span style={{ fontSize: '1.2rem' }}>
              {isActive('/rooms') ? '🎯' : '🎲'}
            </span>
            <small>Комнаты</small>
            
            {/* Бейдж с количеством доступных комнат */}
            {availableRoomsCount > 0 && (
              <Badge 
                bg="success" 
                pill 
                className="position-absolute"
                style={{ 
                  top: '0px', 
                  right: '8px',
                  fontSize: '0.6rem',
                  minWidth: '16px',
                  height: '16px'
                }}
              >
                {availableRoomsCount}
              </Badge>
            )}
          </Nav.Link>
        </Nav.Item>

        {/* Текущая игра (если в комнате или игре) */}
        {(currentRoom || gameState) && (
          <Nav.Item className="text-center">
            <Nav.Link
              as={Link}
              to={gameState ? `/game/${currentRoom?.id}` : `/room/${currentRoom?.id}`}
              className={`d-flex flex-column align-items-center p-2 ${
                isActive('/room/') || isActive('/game/') ? 'text-primary' : 'text-muted'
              }`}
            >
              <span style={{ fontSize: '1.2rem' }}>
                {gameState ? '🃏' : '⏳'}
              </span>
              <small>{gameState ? 'Игра' : 'Комната'}</small>
              
              {/* Индикатор активной игры */}
              {gameState && (
                <div 
                  className="position-absolute bg-success rounded-circle"
                  style={{ 
                    top: '8px', 
                    right: '8px',
                    width: '8px',
                    height: '8px'
                  }}
                />
              )}
            </Nav.Link>
          </Nav.Item>
        )}

        {/* Друзья */}
        <Nav.Item className="text-center position-relative">
          <Nav.Link
            as={Link}
            to="/friends"
            className={`d-flex flex-column align-items-center p-2 ${
              isActive('/friends') ? 'text-primary' : 'text-muted'
            }`}
          >
            <span style={{ fontSize: '1.2rem' }}>
              {isActive('/friends') ? '👥' : '👤'}
            </span>
            <small>Друзья</small>
            
            {/* Бейдж уведомлений */}
            {hasNotifications && (
              <Badge 
                bg="danger" 
                pill 
                className="position-absolute"
                style={{ 
                  top: '0px', 
                  right: '8px',
                  fontSize: '0.6rem',
                  minWidth: '16px',
                  height: '16px'
                }}
              >
                !
              </Badge>
            )}
          </Nav.Link>
        </Nav.Item>

        {/* Создать игру */}
        <Nav.Item className="text-center">
          <Nav.Link
            as={Link}
            to="/settings"
            className={`d-flex flex-column align-items-center p-2 ${
              isActive('/settings') ? 'text-primary' : 'text-muted'
            }`}
            style={{ opacity: isConnected ? 1 : 0.5 }}
          >
            <span style={{ fontSize: '1.2rem' }}>
              {isActive('/settings') ? '⚙️' : '➕'}
            </span>
            <small>Создать</small>
          </Nav.Link>
        </Nav.Item>

      </Nav>

      {/* Индикатор соединения */}
      {!isConnected && (
        <div 
          className="position-absolute bg-warning rounded-circle"
          style={{ 
            top: '5px', 
            left: '50%',
            transform: 'translateX(-50%)',
            width: '6px',
            height: '6px'
          }}
          title="Нет соединения"
        />
      )}
    </Navbar>
  );
};

export default BottomNavbar;