// src/components/BottomNavbar.tsx - НИЖНЯЯ НАВИГАЦИЯ

import React, { useMemo, useCallback } from 'react';
import { Navbar, Nav, Badge } from 'react-bootstrap';
import { useNavigate, useLocation } from 'react-router-dom';
import { useGame } from '../contexts/GameProvider';

// ===== ИНТЕРФЕЙСЫ =====

/**
 * Props для BottomNavbar
 */
export interface BottomNavbarProps {
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Элемент навигации
 */
interface NavItem {
  path: string;
  emoji: string;
  label: string;
  badge?: number | string;
  isActive?: boolean;
  isDisabled?: boolean;
  ariaLabel: string;
}

// ===== КОНСТАНТЫ =====

const NAV_ROUTES = {
  HOME: '/',
  ROOMS: '/rooms',
  GAME: '/game',
  FRIENDS: '/friends',
  SETTINGS: '/settings'
} as const;

const NAV_ITEMS_CONFIG = {
  HOME: {
    emoji: '🏠',
    label: 'Главная',
    ariaLabel: 'Перейти на главную страницу'
  },
  ROOMS: {
    emoji: '🏪',
    label: 'Комнаты',
    ariaLabel: 'Перейти к списку игровых комнат'
  },
  GAME: {
    emoji: '🎮',
    label: 'Игра',
    ariaLabel: 'Перейти к текущей игре'
  },
  FRIENDS: {
    emoji: '👥',
    label: 'Друзья',
    ariaLabel: 'Пригласить друзей в игру'
  },
  SETTINGS: {
    emoji: '⚙️',
    label: 'Настройки',
    ariaLabel: 'Настройки игры'
  }
} as const;

const NAVBAR_CLASSES = {
  CONTAINER: 'bottom-navbar',
  NAV_LINK: 'bottom-nav-link',
  NAV_LINK_ACTIVE: 'bottom-nav-link--active',
  NAV_LINK_DISABLED: 'bottom-nav-link--disabled',
  BADGE: 'bottom-nav-badge'
} as const;

// ===== УТИЛИТАРНЫЕ ФУНКЦИИ =====

/**
 * Проверка активности маршрута
 */
const isRouteActive = (currentPath: string, targetPath: string): boolean => {
  if (targetPath === NAV_ROUTES.HOME) {
    return currentPath === NAV_ROUTES.HOME;
  }
  return currentPath.startsWith(targetPath);
};

/**
 * Проверка доступности маршрута
 */
const isRouteDisabled = (
  path: string, 
  isConnected: boolean, 
  gameState: any, 
  currentRoom: any
): boolean => {
  switch (path) {
    case NAV_ROUTES.GAME:
      return !gameState || !isConnected;
    case NAV_ROUTES.ROOMS:
    case NAV_ROUTES.FRIENDS:
      return !isConnected;
    default:
      return false;
  }
};

/**
 * Получение badge для маршрута
 */
const getRouteBadge = (
  path: string,
  rooms: any[],
  currentRoom: any,
  autoStartInfo: any
): number | string | undefined => {
  switch (path) {
    case NAV_ROUTES.ROOMS:
      const waitingRooms = rooms.filter(room => room.status === 'waiting');
      return waitingRooms.length > 0 ? waitingRooms.length : undefined;
    
    case NAV_ROUTES.GAME:
      if (currentRoom && autoStartInfo?.isAutoStarting) {
        return '!';
      }
      return undefined;
    
    default:
      return undefined;
  }
};

/**
 * Получение CSS классов для навигационной ссылки
 */
const getNavLinkClasses = (isActive: boolean, isDisabled: boolean): string => {
  let classes = NAVBAR_CLASSES.NAV_LINK;
  
  if (isActive) {
    classes += ` ${NAVBAR_CLASSES.NAV_LINK_ACTIVE}`;
  }
  
  if (isDisabled) {
    classes += ` ${NAVBAR_CLASSES.NAV_LINK_DISABLED}`;
  }
  
  return classes;
};

// ===== ОСНОВНОЙ КОМПОНЕНТ =====

/**
 * Компонент нижней навигации
 */
export const BottomNavbar: React.FC<BottomNavbarProps> = React.memo(({ 
  className = '', 
  style = {} 
}) => {
  // Хуки
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    isConnected, 
    gameState, 
    rooms, 
    currentRoom, 
    autoStartInfo 
  } = useGame();

  // ===== МЕМОИЗИРОВАННЫЕ ВЫЧИСЛЕНИЯ =====

  /**
   * Мемоизированный список элементов навигации
   */
  const navItems: NavItem[] = useMemo(() => {
    const currentPath = location.pathname;
    
    return [
      {
        path: NAV_ROUTES.HOME,
        emoji: NAV_ITEMS_CONFIG.HOME.emoji,
        label: NAV_ITEMS_CONFIG.HOME.label,
        ariaLabel: NAV_ITEMS_CONFIG.HOME.ariaLabel,
        isActive: isRouteActive(currentPath, NAV_ROUTES.HOME),
        isDisabled: isRouteDisabled(NAV_ROUTES.HOME, isConnected, gameState, currentRoom)
      },
      {
        path: NAV_ROUTES.ROOMS,
        emoji: NAV_ITEMS_CONFIG.ROOMS.emoji,
        label: NAV_ITEMS_CONFIG.ROOMS.label,
        ariaLabel: NAV_ITEMS_CONFIG.ROOMS.ariaLabel,
        badge: getRouteBadge(NAV_ROUTES.ROOMS, rooms, currentRoom, autoStartInfo),
        isActive: isRouteActive(currentPath, NAV_ROUTES.ROOMS),
        isDisabled: isRouteDisabled(NAV_ROUTES.ROOMS, isConnected, gameState, currentRoom)
      },
      {
        path: NAV_ROUTES.GAME,
        emoji: NAV_ITEMS_CONFIG.GAME.emoji,
        label: NAV_ITEMS_CONFIG.GAME.label,
        ariaLabel: NAV_ITEMS_CONFIG.GAME.ariaLabel,
        badge: getRouteBadge(NAV_ROUTES.GAME, rooms, currentRoom, autoStartInfo),
        isActive: isRouteActive(currentPath, NAV_ROUTES.GAME),
        isDisabled: isRouteDisabled(NAV_ROUTES.GAME, isConnected, gameState, currentRoom)
      },
      {
        path: NAV_ROUTES.FRIENDS,
        emoji: NAV_ITEMS_CONFIG.FRIENDS.emoji,
        label: NAV_ITEMS_CONFIG.FRIENDS.label,
        ariaLabel: NAV_ITEMS_CONFIG.FRIENDS.ariaLabel,
        isActive: isRouteActive(currentPath, NAV_ROUTES.FRIENDS),
        isDisabled: isRouteDisabled(NAV_ROUTES.FRIENDS, isConnected, gameState, currentRoom)
      },
      {
        path: NAV_ROUTES.SETTINGS,
        emoji: NAV_ITEMS_CONFIG.SETTINGS.emoji,
        label: NAV_ITEMS_CONFIG.SETTINGS.label,
        ariaLabel: NAV_ITEMS_CONFIG.SETTINGS.ariaLabel,
        isActive: isRouteActive(currentPath, NAV_ROUTES.SETTINGS),
        isDisabled: isRouteDisabled(NAV_ROUTES.SETTINGS, isConnected, gameState, currentRoom)
      }
    ];
  }, [
    location.pathname,
    isConnected,
    gameState,
    rooms,
    currentRoom,
    autoStartInfo
  ]);

  // ===== ОБРАБОТЧИКИ СОБЫТИЙ =====

  /**
   * Обработчик навигации
   */
  const handleNavigation = useCallback((path: string, isDisabled: boolean) => {
    if (!isDisabled) {
      navigate(path);
    }
  }, [navigate]);

  /**
   * Обработчик клавиатурной навигации
   */
  const handleKeyDown = useCallback((
    event: React.KeyboardEvent,
    path: string,
    isDisabled: boolean
  ) => {
    if ((event.key === 'Enter' || event.key === ' ') && !isDisabled) {
      event.preventDefault();
      navigate(path);
    }
  }, [navigate]);

  // ===== РЕНДЕР =====

  return (
    <Navbar 
      fixed="bottom" 
      className={`${NAVBAR_CLASSES.CONTAINER} ${className}`}
      style={style}
      role="navigation"
      aria-label="Основная навигация"
    >
      <Nav className="w-100 justify-content-around">
        {navItems.map((item) => (
          <Nav.Item key={item.path} className="text-center">
            <div
              className={getNavLinkClasses(item.isActive || false, item.isDisabled || false)}
              onClick={() => handleNavigation(item.path, item.isDisabled || false)}
              onKeyDown={(e) => handleKeyDown(e, item.path, item.isDisabled || false)}
              role="button"
              tabIndex={item.isDisabled ? -1 : 0}
              aria-label={item.ariaLabel}
              aria-current={item.isActive ? 'page' : undefined}
              aria-disabled={item.isDisabled}
              style={{
                cursor: item.isDisabled ? 'not-allowed' : 'pointer',
                opacity: item.isDisabled ? 0.5 : 1,
                position: 'relative'
              }}
            >
              <div className="nav-emoji" style={{ fontSize: '1.2rem', marginBottom: '2px' }}>
                {item.emoji}
              </div>
              
              <div className="nav-label" style={{ fontSize: '0.75rem' }}>
                {item.label}
              </div>

              {/* Badge для уведомлений */}
              {item.badge && (
                <Badge 
                  variant="danger" 
                  className={NAVBAR_CLASSES.BADGE}
                  style={{
                    position: 'absolute',
                    top: '-5px',
                    right: '10px',
                    fontSize: '0.6rem',
                    minWidth: '16px',
                    height: '16px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  aria-label={`${item.badge} уведомлений`}
                >
                  {item.badge}
                </Badge>
              )}
            </div>
          </Nav.Item>
        ))}
      </Nav>
    </Navbar>
  );
});

// Установка displayName для лучшей отладки
BottomNavbar.displayName = 'BottomNavbar';

// ===== ЭКСПОРТ =====
export default BottomNavbar;
export type { BottomNavbarProps, NavItem };
export { 
  NAV_ROUTES, 
  NAV_ITEMS_CONFIG, 
  NAVBAR_CLASSES,
  isRouteActive,
  isRouteDisabled,
  getRouteBadge,
  getNavLinkClasses
};
