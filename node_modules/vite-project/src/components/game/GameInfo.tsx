// src/components/GameInfo.tsx - ИНФОРМАЦИЯ ОБ ИГРЕ

import React, { useMemo, useCallback } from 'react';
import { Card, Row, Col, Badge, Alert } from 'react-bootstrap';
import { GameState, Player } from '../../../packages/shared/src/types';

// ===== ИНТЕРФЕЙСЫ =====

/**
 * Props для GameInfo
 */
export interface GameInfoProps {
  gameState: GameState;
  currentPlayer: Player | null;
  isPlayerTurn: boolean;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Конфигурация фазы игры
 */
interface PhaseConfig {
  text: string;
  variant: string;
  emoji: string;
}

// ===== КОНСТАНТЫ =====

const UI_TEXT = {
  PHASE_LABEL: 'Фаза',
  TURN_LABEL: 'Ходит',
  DECK_LABEL: 'Колода',
  PLAYERS_LABEL: 'Игроки',
  YOUR_TURN: 'Ваш ход',
  WINNER_PREFIX: '🏆 Победитель:',
  UNKNOWN: 'Неизвестно',
  DISCONNECTED_INDICATOR: '⚠️',
  CARDS_COUNT: 'карт'
} as const;

const PHASE_CONFIG: Record<string, PhaseConfig> = {
  attack: { 
    text: 'Атака', 
    variant: 'danger',
    emoji: '🗡️'
  },
  defend: { 
    text: 'Защита', 
    variant: 'warning',
    emoji: '🛡️'
  },
  discard: { 
    text: 'Сброс', 
    variant: 'info',
    emoji: '🗑️'
  },
  finished: { 
    text: 'Завершена', 
    variant: 'success',
    emoji: '🏁'
  }
} as const;

const CSS_CLASSES = {
  GAME_INFO: 'game-info',
  PHASE_INFO: 'phase-info',
  TURN_INFO: 'turn-info',
  DECK_INFO: 'deck-info',
  PLAYERS_INFO: 'players-info',
  PLAYER_ITEM: 'player-item',
  WINNER_ALERT: 'winner-alert'
} as const;

// ===== УТИЛИТАРНЫЕ ФУНКЦИИ =====

/**
 * Получение конфигурации фазы
 */
const getPhaseConfig = (phase: string): PhaseConfig => {
  return PHASE_CONFIG[phase] || { 
    text: UI_TEXT.UNKNOWN, 
    variant: 'secondary',
    emoji: '❓'
  };
};

/**
 * Получение имени текущего игрока
 */
const getCurrentPlayerName = (gameState: GameState): string => {
  if (!gameState?.currentPlayerId || !gameState?.players) {
    return UI_TEXT.UNKNOWN;
  }
  
  const currentGamePlayer = gameState.players.find(
    p => p?.id === gameState.currentPlayerId
  );
  return currentGamePlayer?.name || UI_TEXT.UNKNOWN;
};

/**
 * Валидация игрового состояния
 */
const validateGameState = (gameState: any): gameState is GameState => {
  return gameState &&
    typeof gameState.phase === 'string' &&
    Array.isArray(gameState.players) &&
    Array.isArray(gameState.deck);
};

// ===== КОМПОНЕНТЫ =====

/**
 * Компонент информации о фазе
 */
const PhaseInfo: React.FC<{
  phase: string;
}> = React.memo(({ phase }) => {
  const config = useMemo(() => getPhaseConfig(phase), [phase]);
  
  return (
    <Col className={CSS_CLASSES.PHASE_INFO}>
      <Badge 
        variant={config.variant}
        role="status"
        aria-label={`Текущая фаза игры: ${config.text}`}
        style={{ fontSize: '0.9rem', padding: '0.5rem' }}
      >
        <span role="img" aria-hidden="true" className="me-1">
          {config.emoji}
        </span>
        {config.text}
      </Badge>
      <div className="text-muted small mt-1">{UI_TEXT.PHASE_LABEL}</div>
    </Col>
  );
});

PhaseInfo.displayName = 'PhaseInfo';

/**
 * Компонент информации о ходе
 */
const TurnInfo: React.FC<{
  currentPlayerName: string;
  isPlayerTurn: boolean;
}> = React.memo(({ currentPlayerName, isPlayerTurn }) => (
  <Col className={CSS_CLASSES.TURN_INFO}>
    <div className="fw-bold">
      {isPlayerTurn ? (
        <span className="text-success">
          <span role="img" aria-label="Ваш ход" className="me-1">✨</span>
          {UI_TEXT.YOUR_TURN}
        </span>
      ) : (
        <span>
          <span role="img" aria-label="Ход игрока" className="me-1">👤</span>
          {currentPlayerName}
        </span>
      )}
    </div>
    <div className="text-muted small mt-1">{UI_TEXT.TURN_LABEL}</div>
  </Col>
));

TurnInfo.displayName = 'TurnInfo';

/**
 * Компонент информации о колоде
 */
const DeckInfo: React.FC<{
  deckCount: number;
}> = React.memo(({ deckCount }) => (
  <Col className={CSS_CLASSES.DECK_INFO}>
    <div className="fw-bold">
      <span role="img" aria-label="Колода карт" className="me-1">🃏</span>
      {deckCount} {UI_TEXT.CARDS_COUNT}
    </div>
    <div className="text-muted small mt-1">{UI_TEXT.DECK_LABEL}</div>
  </Col>
));

DeckInfo.displayName = 'DeckInfo';

/**
 * Компонент списка игроков
 */
const PlayersList: React.FC<{
  players: Player[];
}> = React.memo(({ players }) => (
  <div className={CSS_CLASSES.PLAYERS_INFO}>
    <h6 className="mb-2">{UI_TEXT.PLAYERS_LABEL}</h6>
    <Row>
      {players.map((player) => (
        <Col 
          key={player.id} 
          xs={6} 
          md={3}
          className={CSS_CLASSES.PLAYER_ITEM}
        >
          <div className="d-flex align-items-center">
            <span className="me-2">
              {player.name}
              {!player.isConnected && (
                <span 
                  role="img" 
                  aria-label="Отключен"
                  className="ms-1 text-warning"
                >
                  {UI_TEXT.DISCONNECTED_INDICATOR}
                </span>
              )}
            </span>
            <Badge 
              variant="light"
              aria-label={`${player.hand?.length || 0} карт в руке`}
            >
              {player.hand?.length || 0}
            </Badge>
          </div>
        </Col>
      ))}
    </Row>
  </div>
));

PlayersList.displayName = 'PlayersList';

/**
 * Компонент информации о победителе
 */
const WinnerInfo: React.FC<{
  winner: Player;
}> = React.memo(({ winner }) => (
  <Alert 
    variant="success" 
    className={CSS_CLASSES.WINNER_ALERT}
    role="alert"
    aria-live="polite"
  >
    <div className="text-center">
      <h5 className="mb-2">
        {UI_TEXT.WINNER_PREFIX} {winner.name}
      </h5>
      <div>
        <span role="img" aria-label="Поздравления" style={{ fontSize: '2rem' }}>
          🎉
        </span>
      </div>
    </div>
  </Alert>
));

WinnerInfo.displayName = 'WinnerInfo';

// ===== ОСНОВНОЙ КОМПОНЕНТ =====

/**
 * Компонент информации об игре
 * Отображает текущую фазу, ход, состояние колоды и игроков
 */
export const GameInfo: React.FC<GameInfoProps> = React.memo(({
  gameState,
  currentPlayer,
  isPlayerTurn,
  className = '',
  style = {}
}) => {
  // ===== ВАЛИДАЦИЯ =====

  if (!validateGameState(gameState)) {
    console.warn('GameInfo: Invalid gameState provided');
    return (
      <Card className={className} style={style}>
        <Card.Body>
          <Alert variant="warning">
            Ошибка загрузки информации об игре
          </Alert>
        </Card.Body>
      </Card>
    );
  }

  // ===== МЕМОИЗИРОВАННЫЕ ВЫЧИСЛЕНИЯ =====

  /**
   * Мемоизированное имя текущего игрока
   */
  const currentPlayerName = useMemo(() => {
    return getCurrentPlayerName(gameState);
  }, [gameState]);

  /**
   * Мемоизированная информация о колоде
   */
  const deckCount = useMemo(() => {
    return gameState.deck?.length || 0;
  }, [gameState.deck]);

  /**
   * Мемоизированный список игроков
   */
  const validPlayers = useMemo(() => {
    return gameState.players?.filter(player => player && player.id) || [];
  }, [gameState.players]);

  // ===== РЕНДЕР =====

  return (
    <Card 
      className={`${CSS_CLASSES.GAME_INFO} ${className}`} 
      style={style}
      role="region"
      aria-label="Информация об игре"
    >
      <Card.Body>
        {/* Информация о победителе */}
        {gameState.winner && (
          <WinnerInfo winner={gameState.winner} />
        )}

        {/* Основная информация */}
        <Row className="mb-3">
          <PhaseInfo phase={gameState.phase} />
          <TurnInfo 
            currentPlayerName={currentPlayerName}
            isPlayerTurn={isPlayerTurn}
          />
          <DeckInfo deckCount={deckCount} />
        </Row>

        {/* Список игроков */}
        {validPlayers.length > 0 && (
          <PlayersList players={validPlayers} />
        )}
      </Card.Body>
    </Card>
  );
});

// Установка displayName для лучшей отладки
GameInfo.displayName = 'GameInfo';

// ===== ЭКСПОРТ =====
export default GameInfo;
export type { GameInfoProps, PhaseConfig };
export { 
  UI_TEXT, 
  PHASE_CONFIG, 
  CSS_CLASSES,
  getPhaseConfig,
  getCurrentPlayerName,
  validateGameState
};
