// src/components/TrumpCard.tsx - КОЗЫРНАЯ КАРТА

import React, { useMemo } from 'react';
import { Card } from 'react-bootstrap';
import { Card as CardType, SuitSymbol } from '../../../packages/shared/src/types';
import GameCard from './GameCard';

// ===== ИНТЕРФЕЙСЫ =====

/**
 * Props для TrumpCard
 */
export interface TrumpCardProps {
  trump: CardType | null;
  className?: string;
  style?: React.CSSProperties;
}

// ===== КОНСТАНТЫ =====

const UI_CONSTANTS = {
  TRUMP_TITLE: 'КОЗЫРЬ',
  UNKNOWN_TRUMP: 'Козырь неизвестен',
  UNKNOWN_SUIT: 'Неизвестно',
  CLASSES: {
    TRUMP_CARD: 'trump-card',
    TRUMP_INFO: 'trump-info',
    TRUMP_TITLE: 'trump-title',
    TRUMP_DETAILS: 'trump-details'
  }
} as const;

const SUIT_NAMES: Record<SuitSymbol, string> = {
  '♠': 'Пики',
  '♥': 'Червы',
  '♦': 'Бубны',
  '♣': 'Трефы'
} as const;

const SUIT_COLORS: Record<SuitSymbol, string> = {
  '♠': 'text-dark',
  '♥': 'text-danger',
  '♦': 'text-danger',
  '♣': 'text-dark'
} as const;

// ===== УТИЛИТАРНЫЕ ФУНКЦИИ =====

/**
 * Получение цвета масти
 */
const getSuitColor = (suit: string): string => {
  return SUIT_COLORS[suit as SuitSymbol] || 'text-dark';
};

/**
 * Получение названия масти
 */
const getSuitName = (suit: string): string => {
  return SUIT_NAMES[suit as SuitSymbol] || UI_CONSTANTS.UNKNOWN_SUIT;
};

/**
 * Валидация козырной карты
 */
const validateTrumpCard = (trump: any): trump is CardType => {
  return trump &&
    typeof trump.id === 'string' &&
    typeof trump.rank === 'string' &&
    typeof trump.suit === 'string' &&
    trump.rank.length > 0 &&
    trump.suit.length > 0;
};

// ===== КОМПОНЕНТЫ =====

/**
 * Компонент информации о козыре
 */
const TrumpInfo: React.FC<{ trump: CardType }> = React.memo(({ trump }) => {
  const suitColor = useMemo(() => getSuitColor(trump.suit), [trump.suit]);
  const suitName = useMemo(() => getSuitName(trump.suit), [trump.suit]);

  return (
    <div className={`${UI_CONSTANTS.CLASSES.TRUMP_INFO} text-center mt-2`}>
      <div className={`${UI_CONSTANTS.CLASSES.TRUMP_DETAILS} ${suitColor}`}>
        <span style={{ fontSize: '1.2rem', marginRight: '0.5rem' }}>
          {trump.suit}
        </span>
        {suitName}
      </div>
      <small className="text-muted">
        {trump.rank} {trump.suit}
      </small>
    </div>
  );
});

TrumpInfo.displayName = 'TrumpInfo';

/**
 * Компонент неизвестного козыря
 */
const UnknownTrump: React.FC = React.memo(() => (
  <div 
    className="text-center text-muted p-3"
    role="status"
    aria-label="Козырь неизвестен"
  >
    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>❓</div>
    <p className="mb-0">{UI_CONSTANTS.UNKNOWN_TRUMP}</p>
  </div>
));

UnknownTrump.displayName = 'UnknownTrump';

// ===== ОСНОВНОЙ КОМПОНЕНТ =====

/**
 * Компонент козырной карты
 * Отображает козырную карту с дополнительной информацией
 */
export const TrumpCard: React.FC<TrumpCardProps> = React.memo(({
  trump,
  className = '',
  style = {}
}) => {
  // ===== ВАЛИДАЦИЯ =====

  if (!trump) {
    return (
      <Card 
        className={`${UI_CONSTANTS.CLASSES.TRUMP_CARD} ${className}`}
        style={style}
        role="region" 
        aria-label="Козырная карта"
      >
        <Card.Body>
          <h5 
            id="trump-title" 
            className={`${UI_CONSTANTS.CLASSES.TRUMP_TITLE} text-center`}
          >
            {UI_CONSTANTS.TRUMP_TITLE}
          </h5>
          <UnknownTrump />
        </Card.Body>
      </Card>
    );
  }

  // Валидация структуры карты
  if (!validateTrumpCard(trump)) {
    console.warn('TrumpCard: Invalid trump card structure', trump);
    return (
      <Card 
        className={`${UI_CONSTANTS.CLASSES.TRUMP_CARD} ${className}`}
        style={style}
      >
        <Card.Body>
          <h5 className="text-center">{UI_CONSTANTS.TRUMP_TITLE}</h5>
          <div className="text-center text-muted">
            Ошибка отображения козыря
          </div>
        </Card.Body>
      </Card>
    );
  }

  // ===== РЕНДЕР =====

  return (
    <Card 
      className={`${UI_CONSTANTS.CLASSES.TRUMP_CARD} ${className}`}
      style={style}
      role="region" 
      aria-label="Козырная карта"
    >
      <Card.Body>
        <h5 
          id="trump-title" 
          className={`${UI_CONSTANTS.CLASSES.TRUMP_TITLE} text-center`}
        >
          {UI_CONSTANTS.TRUMP_TITLE}
        </h5>
        
        <div 
          className="text-center"
          aria-labelledby="trump-title"
          aria-live="polite"
        >
          <GameCard
            card={trump}
            isTrump={true}
            isPlayable={false}
            size="medium"
          />
          
          <TrumpInfo trump={trump} />
        </div>
      </Card.Body>
    </Card>
  );
});

// Установка displayName для лучшей отладки
TrumpCard.displayName = 'TrumpCard';

// Мемоизация компонента с проверкой trump.id
export default React.memo(TrumpCard, (prevProps, nextProps) => {
  return prevProps.trump?.id === nextProps.trump?.id &&
    prevProps.className === nextProps.className;
});

// ===== ЭКСПОРТ =====
export type { TrumpCardProps };
export { 
  UI_CONSTANTS,
  SUIT_NAMES,
  SUIT_COLORS,
  getSuitColor,
  getSuitName,
  validateTrumpCard
};
