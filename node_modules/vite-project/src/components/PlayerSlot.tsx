// src/components/PlayerSlot.tsx - СЛОТ ИГРОКА

import React, { useMemo, useCallback } from 'react';
import { Player } from '../../../packages/shared/src/types';

// ===== ИНТЕРФЕЙСЫ =====

/**
 * Props для PlayerSlot
 */
export interface PlayerSlotProps {
  player: Player | null;
  isYou: boolean;
  ready: boolean;
  isConnected?: boolean;
  showAvatar?: boolean;
  size?: 'small' | 'medium' | 'large';
  onClick?: (player: Player) => void;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Конфигурация размеров слота
 */
interface SlotSizeConfig {
  width: string;
  height: string;
  fontSize: string;
  avatarSize: string;
}

// ===== КОНСТАНТЫ =====

const UI_CONSTANTS = {
  EMPTY_SLOT: 'Пусто',
  YOU_LABEL: '(Вы)',
  READY_EMOJI: '✅',
  READY_TEXT: 'Готов',
  DISCONNECTED_EMOJI: '⚠️',
  DISCONNECTED_TEXT: 'Отключен',
  UNKNOWN_PLAYER: 'Игрок без имени',
  CLASSES: {
    SLOT: 'player-slot',
    SLOT_EMPTY: 'player-slot--empty',
    SLOT_READY: 'player-slot--ready',
    SLOT_YOU: 'player-slot--you',
    SLOT_DISCONNECTED: 'player-slot--disconnected',
    SLOT_CLICKABLE: 'player-slot--clickable',
    PLAYER_INFO: 'player-info',
    PLAYER_NAME: 'player-name',
    PLAYER_STATUS: 'player-status',
    READY_INDICATOR: 'ready-indicator',
    AVATAR: 'player-avatar',
    AVATAR_PLACEHOLDER: 'player-avatar-placeholder'
  }
} as const;

const SLOT_SIZES: Record<string, SlotSizeConfig> = {
  small: {
    width: '80px',
    height: '60px',
    fontSize: '0.75rem',
    avatarSize: '24px'
  },
  medium: {
    width: '120px',
    height: '80px',
    fontSize: '0.875rem',
    avatarSize: '32px'
  },
  large: {
    width: '160px',
    height: '100px',
    fontSize: '1rem',
    avatarSize: '40px'
  }
} as const;

const DEFAULT_AVATAR_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', 
  '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'
];

// ===== УТИЛИТАРНЫЕ ФУНКЦИИ =====

/**
 * Получение инициалов из имени
 */
const getPlayerInitials = (name: string): string => {
  if (!name || name.trim().length === 0) {
    return '?';
  }
  
  const words = name.trim().split(' ');
  if (words.length === 1) {
    return words[0].charAt(0).toUpperCase();
  }
  
  return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
};

/**
 * Получение цвета аватара на основе ID игрока
 */
const getAvatarColor = (playerId: string): string => {
  const hash = playerId.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);
  
  const index = Math.abs(hash) % DEFAULT_AVATAR_COLORS.length;
  return DEFAULT_AVATAR_COLORS[index];
};

/**
 * Получение CSS классов для слота
 */
const getSlotClasses = (
  player: Player | null,
  isYou: boolean,
  ready: boolean,
  isConnected: boolean,
  isClickable: boolean,
  className?: string
): string => {
  let classes = UI_CONSTANTS.CLASSES.SLOT;
  
  if (!player) {
    classes += ` ${UI_CONSTANTS.CLASSES.SLOT_EMPTY}`;
  } else {
    if (isYou) {
      classes += ` ${UI_CONSTANTS.CLASSES.SLOT_YOU}`;
    }
    
    if (ready) {
      classes += ` ${UI_CONSTANTS.CLASSES.SLOT_READY}`;
    }
    
    if (!isConnected) {
      classes += ` ${UI_CONSTANTS.CLASSES.SLOT_DISCONNECTED}`;
    }
    
    if (isClickable) {
      classes += ` ${UI_CONSTANTS.CLASSES.SLOT_CLICKABLE}`;
    }
  }
  
  if (className) {
    classes += ` ${className}`;
  }
  
  return classes;
};

// ===== КОМПОНЕНТЫ =====

/**
 * Компонент аватара игрока
 */
const PlayerAvatar: React.FC<{
  player: Player;
  size: string;
  showAvatar: boolean;
}> = React.memo(({ player, size, showAvatar }) => {
  const avatarStyle: React.CSSProperties = {
    width: size,
    height: size,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: `calc(${size} * 0.4)`,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: '4px'
  };

  if (showAvatar && player.avatar) {
    return (
      <img
        src={player.avatar}
        alt={`Аватар ${player.name}`}
        className={UI_CONSTANTS.CLASSES.AVATAR}
        style={{
          ...avatarStyle,
          objectFit: 'cover'
        }}
        onError={(e) => {
          // Fallback к инициалам при ошибке загрузки
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
        }}
      />
    );
  }

  return (
    <div
      className={UI_CONSTANTS.CLASSES.AVATAR_PLACEHOLDER}
      style={{
        ...avatarStyle,
        backgroundColor: getAvatarColor(player.id)
      }}
      aria-label={`Инициалы игрока ${player.name}`}
    >
      {getPlayerInitials(player.name)}
    </div>
  );
});

PlayerAvatar.displayName = 'PlayerAvatar';

/**
 * Компонент статуса игрока
 */
const PlayerStatus: React.FC<{
  ready: boolean;
  isConnected: boolean;
  isYou: boolean;
}> = React.memo(({ ready, isConnected, isYou }) => {
  if (!isConnected) {
    return (
      <div className={UI_CONSTANTS.CLASSES.PLAYER_STATUS}>
        <span role="img" aria-label="Отключен">
          {UI_CONSTANTS.DISCONNECTED_EMOJI}
        </span>
        <span className="ms-1">{UI_CONSTANTS.DISCONNECTED_TEXT}</span>
      </div>
    );
  }

  if (ready) {
    return (
      <div className={UI_CONSTANTS.CLASSES.READY_INDICATOR}>
        <span role="img" aria-label="Готов к игре">
          {UI_CONSTANTS.READY_EMOJI}
        </span>
        <span className="ms-1">{UI_CONSTANTS.READY_TEXT}</span>
      </div>
    );
  }

  return null;
});

PlayerStatus.displayName = 'PlayerStatus';

// ===== ОСНОВНОЙ КОМПОНЕНТ =====

/**
 * Компонент слота игрока
 * Отображает информацию об игроке или пустой слот
 */
export const PlayerSlot: React.FC<PlayerSlotProps> = React.memo(({
  player,
  isYou,
  ready,
  isConnected = true,
  showAvatar = true,
  size = 'medium',
  onClick,
  className,
  style = {}
}) => {
  // ===== МЕМОИЗИРОВАННЫЕ ВЫЧИСЛЕНИЯ =====

  /**
   * Мемоизированная конфигурация размера
   */
  const sizeConfig = useMemo(() => {
    return SLOT_SIZES[size] || SLOT_SIZES.medium;
  }, [size]);

  /**
   * Мемоизированный стиль слота
   */
  const slotStyle: React.CSSProperties = useMemo(() => ({
    width: sizeConfig.width,
    height: sizeConfig.height,
    fontSize: sizeConfig.fontSize,
    ...style
  }), [sizeConfig, style]);

  /**
   * Мемоизированные CSS классы
   */
  const slotClasses = useMemo(() => {
    return getSlotClasses(
      player,
      isYou,
      ready,
      isConnected,
      Boolean(onClick && player),
      className
    );
  }, [player, isYou, ready, isConnected, onClick, className]);

  /**
   * Мемоизированное имя игрока
   */
  const playerName = useMemo(() => {
    if (!player) return null;
    return player.name || UI_CONSTANTS.UNKNOWN_PLAYER;
  }, [player]);

  // ===== ОБРАБОТЧИКИ СОБЫТИЙ =====

  /**
   * Обработчик клика по слоту
   */
  const handleClick = useCallback(() => {
    if (onClick && player) {
      onClick(player);
    }
  }, [onClick, player]);

  /**
   * Обработчик клавиатурных событий
   */
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if ((event.key === 'Enter' || event.key === ' ') && onClick && player) {
      event.preventDefault();
      onClick(player);
    }
  }, [onClick, player]);

  // ===== EARLY RETURN ДЛЯ ПУСТОГО СЛОТА =====

  if (!player) {
    return (
      <div
        className={slotClasses}
        style={slotStyle}
        role="listitem"
        aria-label="Пустой слот игрока"
      >
        <div className={UI_CONSTANTS.CLASSES.PLAYER_INFO}>
          <div className="text-muted text-center">
            {UI_CONSTANTS.EMPTY_SLOT}
          </div>
        </div>
      </div>
    );
  }

  // ===== РЕНДЕР СЛОТА С ИГРОКОМ =====

  return (
    <div
      className={slotClasses}
      style={slotStyle}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="listitem"
      tabIndex={onClick ? 0 : -1}
      aria-label={`${isYou ? 'Ваш слот: ' : 'Игрок: '}${playerName}${ready ? ' (готов)' : ''}${!isConnected ? ' (отключен)' : ''}`}
      aria-pressed={ready}
      aria-disabled={!isConnected}
    >
      <div className={UI_CONSTANTS.CLASSES.PLAYER_INFO}>
        {/* Аватар игрока */}
        {showAvatar && (
          <PlayerAvatar
            player={player}
            size={sizeConfig.avatarSize}
            showAvatar={showAvatar}
          />
        )}

        {/* Имя игрока */}
        <div className={UI_CONSTANTS.CLASSES.PLAYER_NAME}>
          {playerName}
          {isYou && (
            <small className="text-muted ms-1">
              {UI_CONSTANTS.YOU_LABEL}
            </small>
          )}
        </div>

        {/* Статус игрока */}
        <PlayerStatus
          ready={ready}
          isConnected={isConnected}
          isYou={isYou}
        />
      </div>
    </div>
  );
});

// Установка displayName для лучшей отладки
PlayerSlot.displayName = 'PlayerSlot';

// ===== ЭКСПОРТ =====
export default PlayerSlot;
export type { PlayerSlotProps, SlotSizeConfig };
export { 
  UI_CONSTANTS, 
  SLOT_SIZES, 
  DEFAULT_AVATAR_COLORS,
  getPlayerInitials,
  getAvatarColor,
  getSlotClasses
};
