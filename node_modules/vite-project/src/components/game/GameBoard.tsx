// src/components/GameBoard.tsx - ИГРОВОЕ ПОЛЕ

import React, { useMemo, useCallback } from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { TableCard, Card as CardType } from '@shared/types';
import GameCard from './GameCard';

// ===== ИНТЕРФЕЙСЫ =====

/**
 * Props для GameBoard
 */
export interface GameBoardProps {
  tableCards: TableCard[];
  trump: CardType | null;
  onCardClick?: (card: CardType) => void;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Конфигурация отображения стола
 */
interface BoardConfig {
  maxCardsPerRow: number;
  cardSpacing: string;
  cardSize: 'small' | 'medium' | 'large';
}

// ===== КОНСТАНТЫ =====

const UI_TEXT = {
  BOARD_TITLE: 'Игровое поле',
  EMPTY_BOARD: 'Стол пуст',
  ATTACK_LABEL: 'Атака',
  DEFENSE_LABEL: 'Защита',
  UNDEFENDED_LABEL: 'Не защищена',
  CARDS_COUNT: 'карт на столе'
} as const;

const BOARD_CONFIG: BoardConfig = {
  maxCardsPerRow: 6,
  cardSpacing: '10px',
  cardSize: 'medium'
};

const CSS_CLASSES = {
  BOARD: 'game-board',
  BOARD_EMPTY: 'game-board--empty',
  TABLE_CARDS: 'table-cards',
  CARD_PAIR: 'card-pair',
  CARD_PAIR_DEFENDED: 'card-pair--defended',
  CARD_PAIR_UNDEFENDED: 'card-pair--undefended',
  ATTACK_CARD: 'attack-card',
  DEFENSE_CARD: 'defense-card',
  EMPTY_MESSAGE: 'empty-message'
} as const;

// ===== УТИЛИТАРНЫЕ ФУНКЦИИ =====

/**
 * Валидация карты на столе
 */
const validateTableCard = (tableCard: any): tableCard is TableCard => {
  return tableCard &&
    tableCard.attack &&
    typeof tableCard.attack.id === 'string' &&
    typeof tableCard.attack.rank === 'string' &&
    typeof tableCard.attack.suit === 'string';
};

/**
 * Проверка, является ли карта козырной
 */
const isCardTrump = (card: CardType, trump: CardType | null): boolean => {
  return Boolean(trump && card.suit === trump.suit);
};

/**
 * Получение CSS классов для пары карт
 */
const getCardPairClasses = (tableCard: TableCard): string => {
  let classes = CSS_CLASSES.CARD_PAIR;
  
  if (tableCard.defense) {
    classes += ` ${CSS_CLASSES.CARD_PAIR_DEFENDED}`;
  } else {
    classes += ` ${CSS_CLASSES.CARD_PAIR_UNDEFENDED}`;
  }
  
  return classes;
};

/**
 * Разбиение карт на строки для отображения
 */
const chunkTableCards = (tableCards: TableCard[], maxPerRow: number): TableCard[][] => {
  const chunks: TableCard[][] = [];
  for (let i = 0; i < tableCards.length; i += maxPerRow) {
    chunks.push(tableCards.slice(i, i + maxPerRow));
  }
  return chunks;
};

// ===== КОМПОНЕНТЫ =====

/**
 * Компонент пары карт (атака + защита)
 */
const CardPair: React.FC<{
  tableCard: TableCard;
  trump: CardType | null;
  onCardClick?: (card: CardType) => void;
  index: number;
}> = React.memo(({ tableCard, trump, onCardClick, index }) => {
  const pairClasses = useMemo(() => {
    return getCardPairClasses(tableCard);
  }, [tableCard]);

  const handleAttackClick = useCallback(() => {
    if (onCardClick) {
      onCardClick(tableCard.attack);
    }
  }, [onCardClick, tableCard.attack]);

  const handleDefenseClick = useCallback(() => {
    if (onCardClick && tableCard.defense) {
      onCardClick(tableCard.defense);
    }
  }, [onCardClick, tableCard.defense]);

  return (
    <div 
      className={pairClasses}
      style={{ 
        position: 'relative',
        display: 'inline-block',
        margin: BOARD_CONFIG.cardSpacing
      }}
      role="group"
      aria-label={`Пара карт ${index + 1}: ${tableCard.attack.rank} ${tableCard.attack.suit}${tableCard.defense ? ` защищена ${tableCard.defense.rank} ${tableCard.defense.suit}` : ' не защищена'}`}
    >
      {/* Карта атаки */}
      <div 
        className={CSS_CLASSES.ATTACK_CARD}
        style={{ position: 'relative', zIndex: 1 }}
      >
        <GameCard
          card={tableCard.attack}
          isTrump={isCardTrump(tableCard.attack, trump)}
          onClick={handleAttackClick}
          size={BOARD_CONFIG.cardSize}
          isPlayable={Boolean(onCardClick)}
        />
        <div 
          style={{
            position: 'absolute',
            bottom: '-20px',
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: '0.7rem',
            color: '#6c757d',
            whiteSpace: 'nowrap'
          }}
          aria-label="Карта атаки"
        >
          {UI_TEXT.ATTACK_LABEL}
        </div>
      </div>

      {/* Карта защиты */}
      {tableCard.defense ? (
        <div 
          className={CSS_CLASSES.DEFENSE_CARD}
          style={{ 
            position: 'absolute',
            top: '15px',
            left: '15px',
            zIndex: 2
          }}
        >
          <GameCard
            card={tableCard.defense}
            isTrump={isCardTrump(tableCard.defense, trump)}
            onClick={handleDefenseClick}
            size={BOARD_CONFIG.cardSize}
            isPlayable={Boolean(onCardClick)}
          />
          <div 
            style={{
              position: 'absolute',
              bottom: '-20px',
              left: '50%',
              transform: 'translateX(-50%)',
              fontSize: '0.7rem',
              color: '#28a745',
              whiteSpace: 'nowrap'
            }}
            aria-label="Карта защиты"
          >
            {UI_TEXT.DEFENSE_LABEL}
          </div>
        </div>
      ) : (
        <div 
          style={{
            position: 'absolute',
            top: '50%',
            right: '-80px',
            transform: 'translateY(-50%)',
            fontSize: '0.7rem',
            color: '#dc3545',
            whiteSpace: 'nowrap'
          }}
          aria-label="Карта не защищена"
        >
          {UI_TEXT.UNDEFENDED_LABEL}
        </div>
      )}
    </div>
  );
});

CardPair.displayName = 'CardPair';

/**
 * Компонент пустого стола
 */
const EmptyBoard: React.FC = React.memo(() => (
  <div 
    className={CSS_CLASSES.EMPTY_MESSAGE}
    style={{
      textAlign: 'center',
      padding: '40px 20px',
      color: '#6c757d'
    }}
    role="status"
    aria-label="Игровое поле пустое"
  >
    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🃏</div>
    <h5>{UI_TEXT.EMPTY_BOARD}</h5>
    <p className="text-muted">Карты появятся здесь во время игры</p>
  </div>
));

EmptyBoard.displayName = 'EmptyBoard';

// ===== ОСНОВНОЙ КОМПОНЕНТ =====

/**
 * Компонент игрового поля
 * Отображает карты на столе в виде пар атака-защита
 */
export const GameBoard: React.FC<GameBoardProps> = React.memo(({
  tableCards,
  trump,
  onCardClick,
  className = '',
  style = {}
}) => {
  // ===== ВАЛИДАЦИЯ =====

  const validTableCards = useMemo(() => {
    if (!Array.isArray(tableCards)) {
      console.warn('GameBoard: tableCards must be an array');
      return [];
    }
    return tableCards.filter(validateTableCard);
  }, [tableCards]);

  // ===== МЕМОИЗИРОВАННЫЕ ВЫЧИСЛЕНИЯ =====

  /**
   * Мемоизированное разбиение карт на строки
   */
  const cardRows = useMemo(() => {
    return chunkTableCards(validTableCards, BOARD_CONFIG.maxCardsPerRow);
  }, [validTableCards]);

  /**
   * Мемоизированные CSS классы
   */
  const boardClasses = useMemo(() => {
    let classes = CSS_CLASSES.BOARD;
    
    if (validTableCards.length === 0) {
      classes += ` ${CSS_CLASSES.BOARD_EMPTY}`;
    }
    
    if (className) {
      classes += ` ${className}`;
    }
    
    return classes;
  }, [validTableCards.length, className]);

  /**
   * Мемоизированная статистика
   */
  const boardStats = useMemo(() => {
    const totalCards = validTableCards.length;
    const defendedCards = validTableCards.filter(tc => tc.defense).length;
    const undefendedCards = totalCards - defendedCards;
    
    return {
      total: totalCards,
      defended: defendedCards,
      undefended: undefendedCards
    };
  }, [validTableCards]);

  // ===== EARLY RETURN ДЛЯ ПУСТОГО СТОЛА =====

  if (validTableCards.length === 0) {
    return (
      <Container className={boardClasses} style={style}>
        <Card>
          <Card.Body>
            <EmptyBoard />
          </Card.Body>
        </Card>
      </Container>
    );
  }

  // ===== РЕНДЕР =====

  return (
    <Container 
      className={boardClasses} 
      style={style}
      role="region"
      aria-label={`Игровое поле с ${boardStats.total} ${UI_TEXT.CARDS_COUNT}`}
    >
      <Card>
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">{UI_TEXT.BOARD_TITLE}</h5>
          <small className="text-muted">
            {boardStats.total} {UI_TEXT.CARDS_COUNT}
            {boardStats.undefended > 0 && (
              <span className="text-danger ms-2">
                ({boardStats.undefended} не защищены)
              </span>
            )}
          </small>
        </Card.Header>
        
        <Card.Body className={CSS_CLASSES.TABLE_CARDS}>
          {cardRows.map((row, rowIndex) => (
            <Row 
              key={`row-${rowIndex}`}
              className="justify-content-center mb-4"
              role="group"
              aria-label={`Строка ${rowIndex + 1} из ${cardRows.length}`}
            >
              {row.map((tableCard, cardIndex) => (
                <Col 
                  key={`${tableCard.attack.id}-${rowIndex}-${cardIndex}`}
                  xs="auto"
                  className="d-flex justify-content-center"
                >
                  <CardPair
                    tableCard={tableCard}
                    trump={trump}
                    onCardClick={onCardClick}
                    index={rowIndex * BOARD_CONFIG.maxCardsPerRow + cardIndex}
                  />
                </Col>
              ))}
            </Row>
          ))}
        </Card.Body>
      </Card>
    </Container>
  );
});

// Установка displayName для лучшей отладки
GameBoard.displayName = 'GameBoard';

// ===== ЭКСПОРТ =====
export default GameBoard;
export type { GameBoardProps, BoardConfig };
export { 
  UI_TEXT, 
  BOARD_CONFIG, 
  CSS_CLASSES,
  validateTableCard,
  isCardTrump,
  getCardPairClasses,
  chunkTableCards
};
