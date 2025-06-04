// src/components/GameCard.tsx - ИГРОВАЯ КАРТА

import React, { useMemo, useCallback } from 'react';
import { Card as CardType } from '../../../packages/shared/src/types';
import { CardSize, SuitColor, UI_CONFIG } from '../types/context';

// ===== ИНТЕРФЕЙСЫ =====

/**
 * Props для GameCard
 */
export interface GameCardProps {
  card: CardType;
  isSelected?: boolean;
  isPlayable?: boolean;
  isTrump?: boolean;
  onClick?: () => void;
  size?: CardSize;
  className?: string;
  style?: React.CSSProperties;
}

// ===== КОНСТАНТЫ =====

const CARD_CONSTANTS = {
  COLORS: {
    RED_SUITS: ['♥', '♦'] as const,
    DANGER: 'text-danger' as const,
    DARK: 'text-dark' as const
  },
  BORDERS: {
    DEFAULT: '1px solid #dee2e6',
    SELECTED: '2px solid #007bff',
    TRUMP: '2px solid #ffc107'
  },
  BACKGROUNDS: {
    TRUMP: '#fff3cd',
    DEFAULT: '#ffffff',
    SELECTED: '#e3f2fd'
  },
  TRANSFORMS: {
    SELECTED: 'translateY(-5px)',
    DEFAULT: 'none'
  },
  OPACITY: {
    PLAYABLE: 1,
    NOT_PLAYABLE: 0.7
  },
  TRANSITIONS: {
    ALL: 'all 0.3s ease'
  },
  CLASSES: {
    CARD: 'game-card',
    CARD_SELECTED: 'game-card--selected',
    CARD_TRUMP: 'game-card--trump',
    CARD_DISABLED: 'game-card--disabled',
    CARD_CLICKABLE: 'game-card--clickable',
    CARD_CONTENT: 'game-card-content',
    CARD_RANK: 'game-card-rank',
    CARD_SUIT: 'game-card-suit'
  }
} as const;

// ===== УТИЛИТАРНЫЕ ФУНКЦИИ =====

/**
 * Получение цвета масти
 */
const getSuitColor = (suit: string): SuitColor => {
  return CARD_CONSTANTS.COLORS.RED_SUITS.includes(suit as any) 
    ? CARD_CONSTANTS.COLORS.DANGER 
    : CARD_CONSTANTS.COLORS.DARK;
};

/**
 * Валидация карты
 */
const validateCard = (card: CardType): boolean => {
  return Boolean(
    card &&
    typeof card.rank === 'string' &&
    typeof card.suit === 'string' &&
    card.rank.length > 0 &&
    card.suit.length > 0
  );
};

/**
 * Получение CSS классов для карты
 */
const getCardClasses = (
  isSelected: boolean,
  isTrump: boolean,
  isPlayable: boolean,
  isClickable: boolean,
  className?: string
): string => {
  let classes = CARD_CONSTANTS.CLASSES.CARD;
  
  if (isSelected) {
    classes += ` ${CARD_CONSTANTS.CLASSES.CARD_SELECTED}`;
  }
  
  if (isTrump) {
    classes += ` ${CARD_CONSTANTS.CLASSES.CARD_TRUMP}`;
  }
  
  if (!isPlayable) {
    classes += ` ${CARD_CONSTANTS.CLASSES.CARD_DISABLED}`;
  }
  
  if (isClickable) {
    classes += ` ${CARD_CONSTANTS.CLASSES.CARD_CLICKABLE}`;
  }
  
  if (className) {
    classes += ` ${className}`;
  }
  
  return classes;
};

/**
 * Получение стилей карты
 */
const getCardStyle = (
  size: CardSize,
  isSelected: boolean,
  isTrump: boolean,
  isPlayable: boolean,
  customStyle?: React.CSSProperties
): React.CSSProperties => {
  const sizeConfig = UI_CONFIG.CARD_SIZES[size];
  
  let backgroundColor = CARD_CONSTANTS.BACKGROUNDS.DEFAULT;
  if (isTrump) {
    backgroundColor = CARD_CONSTANTS.BACKGROUNDS.TRUMP;
  } else if (isSelected) {
    backgroundColor = CARD_CONSTANTS.BACKGROUNDS.SELECTED;
  }
  
  const border = isSelected 
    ? CARD_CONSTANTS.BORDERS.SELECTED 
    : isTrump 
      ? CARD_CONSTANTS.BORDERS.TRUMP 
      : CARD_CONSTANTS.BORDERS.DEFAULT;
  
  return {
    ...sizeConfig,
    backgroundColor,
    border,
    borderRadius: '8px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: isPlayable ? 'pointer' : 'default',
    opacity: isPlayable ? CARD_CONSTANTS.OPACITY.PLAYABLE : CARD_CONSTANTS.OPACITY.NOT_PLAYABLE,
    transform: isSelected ? CARD_CONSTANTS.TRANSFORMS.SELECTED : CARD_CONSTANTS.TRANSFORMS.DEFAULT,
    transition: CARD_CONSTANTS.TRANSITIONS.ALL,
    userSelect: 'none',
    position: 'relative',
    ...customStyle
  };
};

// ===== ОСНОВНОЙ КОМПОНЕНТ =====

/**
 * Компонент игровой карты
 */
export const GameCard: React.FC<GameCardProps> = React.memo(({
  card,
  isSelected = false,
  isPlayable = true,
  isTrump = false,
  onClick,
  size = 'medium',
  className,
  style
}) => {
  // ===== ВАЛИДАЦИЯ =====
  
  if (!validateCard(card)) {
    console.warn('Invalid card provided to GameCard:', card);
    return null;
  }

  // ===== МЕМОИЗИРОВАННЫЕ ВЫЧИСЛЕНИЯ =====

  /**
   * Мемоизированный цвет масти
   */
  const suitColor = useMemo(() => {
    return getSuitColor(card.suit);
  }, [card.suit]);

  /**
   * Мемоизированная проверка кликабельности
   */
  const isClickable = useMemo(() => {
    return Boolean(onClick && isPlayable);
  }, [onClick, isPlayable]);

  /**
   * Мемоизированные CSS классы
   */
  const cardClasses = useMemo(() => {
    return getCardClasses(isSelected, isTrump, isPlayable, isClickable, className);
  }, [isSelected, isTrump, isPlayable, isClickable, className]);

  /**
   * Мемоизированные стили карты
   */
  const cardStyle = useMemo(() => {
    return getCardStyle(size, isSelected, isTrump, isPlayable, style);
  }, [size, isSelected, isTrump, isPlayable, style]);

  // ===== ОБРАБОТЧИКИ СОБЫТИЙ =====

  /**
   * Обработчик клика по карте
   */
  const handleClick = useCallback(() => {
    if (isClickable) {
      onClick?.();
    }
  }, [isClickable, onClick]);

  /**
   * Обработчик клавиатурных событий
   */
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if ((event.key === 'Enter' || event.key === ' ') && isClickable) {
      event.preventDefault();
      onClick?.();
    }
  }, [isClickable, onClick]);

  /**
   * Обработчик hover эффектов
   */
  const handleMouseEnter = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (isClickable) {
      event.currentTarget.style.transform = isSelected 
        ? 'translateY(-8px)' 
        : 'translateY(-3px)';
    }
  }, [isClickable, isSelected]);

  const handleMouseLeave = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (isClickable) {
      event.currentTarget.style.transform = isSelected 
        ? CARD_CONSTANTS.TRANSFORMS.SELECTED 
        : CARD_CONSTANTS.TRANSFORMS.DEFAULT;
    }
  }, [isClickable, isSelected]);

  // ===== РЕНДЕР =====

  return (
    <div
      className={cardClasses}
      style={cardStyle}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      role="button"
      tabIndex={isClickable ? 0 : -1}
      aria-label={`${card.rank} ${card.suit}${isTrump ? ' (козырь)' : ''}${isSelected ? ' (выбрана)' : ''}`}
      aria-pressed={isSelected}
      aria-disabled={!isPlayable}
      data-card-id={card.id}
      data-card-rank={card.rank}
      data-card-suit={card.suit}
    >
      <div className={CARD_CONSTANTS.CLASSES.CARD_CONTENT}>
        {/* Ранг карты */}
        <div 
          className={`${CARD_CONSTANTS.CLASSES.CARD_RANK} ${suitColor}`}
          style={{ 
            fontWeight: 'bold',
            lineHeight: 1,
            marginBottom: '2px'
          }}
        >
          {card.rank}
        </div>
        
        {/* Масть карты */}
        <div 
          className={`${CARD_CONSTANTS.CLASSES.CARD_SUIT} ${suitColor}`}
          style={{ 
            fontSize: '1.2em',
            lineHeight: 1
          }}
          role="img"
          aria-label={`Масть: ${card.suit}`}
        >
          {card.suit}
        </div>
      </div>

      {/* Индикатор козыря */}
      {isTrump && (
        <div
          style={{
            position: 'absolute',
            top: '2px',
            right: '2px',
            fontSize: '0.6em',
            color: '#856404'
          }}
          role="img"
          aria-label="Козырная карта"
        >
          👑
        </div>
      )}

      {/* Индикатор выбора */}
      {isSelected && (
        <div
          style={{
            position: 'absolute',
            top: '2px',
            left: '2px',
            fontSize: '0.6em',
            color: '#007bff'
          }}
          role="img"
          aria-label="Выбранная карта"
        >
          ✓
        </div>
      )}
    </div>
  );
});

// Установка displayName для лучшей отладки
GameCard.displayName = 'GameCard';

// ===== ЭКСПОРТ =====
export default GameCard;
export type { GameCardProps };
export { 
  CARD_CONSTANTS,
  getSuitColor,
  validateCard,
  getCardClasses,
  getCardStyle
};
