// src/components/PlayerHand.tsx - РУКА ИГРОКА

import React, { useMemo, useCallback } from 'react';
import { Card, Row, Col } from 'react-bootstrap';
import { Card as CardType } from '../../../packages/shared/src/types';
import GameCard from './GameCard';

// ===== ИНТЕРФЕЙСЫ =====

/**
 * Props для PlayerHand
 */
export interface PlayerHandProps {
  cards: CardType[];
  selectedCards: CardType[];
  onCardSelect: (card: CardType) => void;
  trump: CardType | null;
  isPlayable?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

// ===== КОНСТАНТЫ =====

const UI_CONSTANTS = {
  HAND_TITLE: 'Ваши карты',
  EMPTY_HAND_MESSAGE: 'Карты закончились',
  GRID_BREAKPOINTS: {
    xs: 6,
    sm: 4,
    md: 3,
    lg: 2
  },
  CLASSES: {
    PLAYER_HAND: 'player-hand',
    HAND_TITLE: 'hand-title',
    HAND_GRID: 'hand-grid',
    EMPTY_HAND: 'empty-hand'
  }
} as const;

// ===== УТИЛИТАРНЫЕ ФУНКЦИИ =====

/**
 * Проверка, выбрана ли карта
 */
const isCardSelected = (card: CardType, selectedCards: CardType[]): boolean => {
  return selectedCards.some(c => c.id === card.id);
};

/**
 * Проверка, является ли карта козырной
 */
const isCardTrump = (card: CardType, trump: CardType | null): boolean => {
  return Boolean(trump && card.suit === trump.suit);
};

/**
 * Валидация карты
 */
const validateCard = (card: any): card is CardType => {
  return card &&
    typeof card.id === 'string' &&
    typeof card.rank === 'string' &&
    typeof card.suit === 'string';
};

// ===== КОМПОНЕНТЫ =====

/**
 * Компонент пустой руки
 */
const EmptyHand: React.FC = React.memo(() => (
  <div 
    className={UI_CONSTANTS.CLASSES.EMPTY_HAND}
    style={{
      textAlign: 'center',
      padding: '40px 20px',
      color: '#6c757d'
    }}
    role="status"
    aria-label="Карты закончились"
  >
    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🃏</div>
    <p>{UI_CONSTANTS.EMPTY_HAND_MESSAGE}</p>
  </div>
));

EmptyHand.displayName = 'EmptyHand';

// ===== ОСНОВНОЙ КОМПОНЕНТ =====

/**
 * Компонент руки игрока
 * Отображает карты игрока с возможностью выбора
 */
export const PlayerHand: React.FC<PlayerHandProps> = React.memo(({
  cards = [],
  selectedCards = [],
  onCardSelect,
  trump,
  isPlayable = true,
  className = '',
  style = {}
}) => {
  // ===== ВАЛИДАЦИЯ =====

  if (!onCardSelect) {
    console.warn('PlayerHand: onCardSelect callback is required');
    return null;
  }

  if (!Array.isArray(cards)) {
    console.error('PlayerHand: cards must be an array');
    return (
      <Card className={className} style={style}>
        <Card.Body>
          <div>Ошибка загрузки карт</div>
        </Card.Body>
      </Card>
    );
  }

  // ===== МЕМОИЗИРОВАННЫЕ ВЫЧИСЛЕНИЯ =====

  /**
   * Мемоизированный Set выбранных карт для быстрого поиска
   */
  const selectedCardIds = useMemo(() => 
    new Set(selectedCards.map(c => c.id)), 
    [selectedCards]
  );

  /**
   * Мемоизированный список валидных карт
   */
  const validCards = useMemo(() => {
    return cards.filter(validateCard);
  }, [cards]);

  /**
   * Мемоизированная проверка выбора карты
   */
  const isCardSelectedMemo = useCallback((card: CardType) => {
    return selectedCardIds.has(card.id);
  }, [selectedCardIds]);

  /**
   * Мемоизированная проверка козырности карты
   */
  const isCardTrumpMemo = useCallback((card: CardType) => {
    return isCardTrump(card, trump);
  }, [trump]);

  // ===== ОБРАБОТЧИКИ СОБЫТИЙ =====

  /**
   * Обработчик выбора карты
   */
  const handleCardSelect = useCallback((card: CardType) => {
    if (isPlayable) {
      onCardSelect(card);
    }
  }, [onCardSelect, isPlayable]);

  // ===== EARLY RETURN ДЛЯ ПУСТОЙ РУКИ =====

  if (validCards.length === 0) {
    return (
      <Card className={`${UI_CONSTANTS.CLASSES.PLAYER_HAND} ${className}`} style={style}>
        <Card.Body>
          <EmptyHand />
        </Card.Body>
      </Card>
    );
  }

  // ===== РЕНДЕР =====

  return (
    <Card 
      className={`${UI_CONSTANTS.CLASSES.PLAYER_HAND} ${className}`} 
      style={style}
      role="region" 
      aria-label="Ваша рука"
    >
      <Card.Body>
        <h4 
          id="player-hand-title"
          className={UI_CONSTANTS.CLASSES.HAND_TITLE}
        >
          {UI_CONSTANTS.HAND_TITLE} ({validCards.length})
        </h4>
        
        <Row 
          className={UI_CONSTANTS.CLASSES.HAND_GRID}
          role="grid" 
          aria-labelledby="player-hand-title"
          aria-live="polite"
        >
          {validCards.map((card) => (
            <Col 
              key={card.id}
              xs={UI_CONSTANTS.GRID_BREAKPOINTS.xs} 
              sm={UI_CONSTANTS.GRID_BREAKPOINTS.sm} 
              md={UI_CONSTANTS.GRID_BREAKPOINTS.md} 
              lg={UI_CONSTANTS.GRID_BREAKPOINTS.lg}
              className="mb-3"
              role="gridcell"
            >
              <GameCard
                card={card}
                isSelected={isCardSelectedMemo(card)}
                isPlayable={isPlayable}
                isTrump={isCardTrumpMemo(card)}
                onClick={() => handleCardSelect(card)}
                size="medium"
              />
            </Col>
          ))}
        </Row>
      </Card.Body>
    </Card>
  );
});

// Установка displayName для лучшей отладки
PlayerHand.displayName = 'PlayerHand';

// Мемоизация компонента с кастомным comparator
export default React.memo(PlayerHand, (prevProps, nextProps) => {
  // Сравнение массивов карт
  const cardsEqual = prevProps.cards.length === nextProps.cards.length &&
    prevProps.cards.every((card, index) => card.id === nextProps.cards[index]?.id);
  
  // Сравнение выбранных карт
  const selectedCardsEqual = prevProps.selectedCards.length === nextProps.selectedCards.length &&
    prevProps.selectedCards.every((card, index) => card.id === nextProps.selectedCards[index]?.id);
  
  // Сравнение козыря
  const trumpEqual = prevProps.trump?.id === nextProps.trump?.id;
  
  // Сравнение других props
  const otherPropsEqual = prevProps.isPlayable === nextProps.isPlayable &&
    prevProps.onCardSelect === nextProps.onCardSelect &&
    prevProps.className === nextProps.className;
  
  return cardsEqual && selectedCardsEqual && trumpEqual && otherPropsEqual;
});

// ===== ЭКСПОРТ =====
export type { PlayerHandProps };
export { 
  UI_CONSTANTS,
  isCardSelected,
  isCardTrump,
  validateCard
};
