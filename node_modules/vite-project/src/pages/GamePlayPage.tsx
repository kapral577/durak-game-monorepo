// src/pages/GamePlayPage.tsx - ОСНОВНАЯ ИГРОВАЯ СТРАНИЦА

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Alert } from 'react-bootstrap';
import { useGame } from '../contexts/GameProvider';
import { Card as CardType, GameAction } from '../../../packages/shared/src/types';
import GameBoard from '../components/GameBoard';
import PlayerHand from '../components/PlayerHand';
import GameControls from '../components/GameControls';
import GameInfo from '../components/GameInfo';
import TrumpCard from '../components/TrumpCard';

// ===== ИНТЕРФЕЙСЫ =====

/**
 * Props для GamePlayPage
 */
export interface GamePlayPageProps {
  // Если нужны props в будущем
}

/**
 * Информация о текущем состоянии игры
 */
interface GameInfo {
  currentPlayerInGame: any;
  isPlayerTurn: boolean;
  attackingCards: CardType[];
  defendingCards: CardType[];
  phase: string;
  trump: CardType | null;
}

// ===== КОНСТАНТЫ =====

const UI_TEXT = {
  LOADING_GAME: 'Загрузка игры...',
  GAME_NOT_ACTIVE: 'Игра не активна',
  INVALID_MOVE: 'Недопустимый ход',
  CONNECTION_ERROR: 'Ошибка подключения к игре',
  UNKNOWN_ERROR: 'Неизвестная ошибка игры',
  GAME_ENDED: 'Игра завершена',
  WAITING_OPPONENT: 'Ожидание хода противника'
} as const;

const CSS_CLASSES = {
  GAME_PLAY_PAGE: 'game-play-page',
  GAME_BOARD_SECTION: 'game-board-section',
  PLAYER_SECTION: 'player-section',
  TRUMP_SECTION: 'trump-section',
  CONTROLS_SECTION: 'controls-section',
  INFO_SECTION: 'info-section'
} as const;

const GAME_CONFIG = {
  AUTO_CLEAR_TIMEOUT: 1000,
  ERROR_DISPLAY_TIMEOUT: 5000
} as const;

// ===== УТИЛИТАРНЫЕ ФУНКЦИИ =====

/**
 * Валидация игрового действия
 */
const validateGameAction = (action: GameAction): boolean => {
  return action &&
    typeof action.type === 'string' &&
    typeof action.playerId === 'string' &&
    action.type.length > 0 &&
    action.playerId.length > 0;
};

/**
 * Получение информации о текущем состоянии игры
 */
const getGameInfo = (gameState: any, currentPlayer: any): GameInfo | null => {
  if (!gameState || !currentPlayer) return null;

  const currentPlayerInGame = gameState.players?.find(
    (p: any) => p.id === currentPlayer.id
  );

  return {
    currentPlayerInGame,
    isPlayerTurn: gameState.currentPlayerId === currentPlayer.id,
    attackingCards: gameState.table?.map((tc: any) => tc.attack) || [],
    defendingCards: gameState.table?.map((tc: any) => tc.defense).filter(Boolean) || [],
    phase: gameState.phase || 'unknown',
    trump: gameState.trump || null
  };
};

// ===== ОСНОВНОЙ КОМПОНЕНТ =====

/**
 * Основная игровая страница
 */
export const GamePlayPage: React.FC<GamePlayPageProps> = () => {
  // Состояния
  const [selectedCards, setSelectedCards] = useState<CardType[]>([]);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Хуки
  const navigate = useNavigate();
  const { 
    gameState, 
    currentPlayer, 
    makeGameAction, 
    isConnected,
    error 
  } = useGame();

  // ===== МЕМОИЗИРОВАННЫЕ ВЫЧИСЛЕНИЯ =====

  /**
   * Информация о текущем состоянии игры
   */
  const gameInfo = useMemo(() => {
    return getGameInfo(gameState, currentPlayer);
  }, [gameState, currentPlayer]);

  /**
   * Карты игрока
   */
  const playerCards = useMemo(() => {
    return gameInfo?.currentPlayerInGame?.hand || [];
  }, [gameInfo]);

  /**
   * Карты на столе
   */
  const tableCards = useMemo(() => {
    return gameState?.table || [];
  }, [gameState]);

  // ===== АВТООЧИСТКА ОШИБОК =====

  useEffect(() => {
    if (actionError) {
      const timer = setTimeout(() => setActionError(null), GAME_CONFIG.ERROR_DISPLAY_TIMEOUT);
      return () => clearTimeout(timer);
    }
  }, [actionError]);

  // ===== ИНИЦИАЛИЗАЦИЯ =====

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, GAME_CONFIG.AUTO_CLEAR_TIMEOUT);

    return () => clearTimeout(timer);
  }, []);

  // ===== НАВИГАЦИЯ ПРИ ЗАВЕРШЕНИИ ИГРЫ =====

  useEffect(() => {
    if (gameState?.phase === 'finished') {
      // Показать результат игры и через некоторое время перейти к комнатам
      const timer = setTimeout(() => {
        navigate('/rooms');
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [gameState?.phase, navigate]);

  // ===== ОБРАБОТЧИКИ ИГРОВЫХ ДЕЙСТВИЙ =====

  /**
   * Валидация и выполнение игрового действия
   */
  const handleGameAction = useCallback(async (action: GameAction) => {
    if (!gameInfo?.isPlayerTurn) {
      setActionError(UI_TEXT.INVALID_MOVE);
      return;
    }

    if (!validateGameAction(action)) {
      setActionError('Неверное игровое действие');
      return;
    }

    try {
      setActionError(null);
      await makeGameAction(action);
      
      // Очистка выбранных карт после успешного хода
      setTimeout(() => {
        setSelectedCards([]);
      }, GAME_CONFIG.AUTO_CLEAR_TIMEOUT);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : UI_TEXT.UNKNOWN_ERROR;
      console.error('Game action error:', err);
      setActionError(errorMessage);
    }
  }, [gameInfo?.isPlayerTurn, makeGameAction]);

  /**
   * Обработчик атаки
   */
  const handleAttack = useCallback(() => {
    if (!gameInfo?.currentPlayerInGame || selectedCards.length === 0) {
      setActionError('Выберите карты для атаки');
      return;
    }

    const action: GameAction = {
      type: 'attack',
      cards: selectedCards,
      playerId: gameInfo.currentPlayerInGame.id
    };

    handleGameAction(action);
  }, [gameInfo, selectedCards, handleGameAction]);

  /**
   * Обработчик взятия карт
   */
  const handleTake = useCallback(() => {
    if (!gameInfo?.currentPlayerInGame) {
      setActionError('Игрок не найден');
      return;
    }

    const action: GameAction = {
      type: 'take',
      playerId: gameInfo.currentPlayerInGame.id
    };

    handleGameAction(action);
  }, [gameInfo, handleGameAction]);

  /**
   * Обработчик паса
   */
  const handlePass = useCallback(() => {
    if (!gameInfo?.currentPlayerInGame) {
      setActionError('Игрок не найден');
      return;
    }

    const action: GameAction = {
      type: 'pass',
      playerId: gameInfo.currentPlayerInGame.id
    };

    handleGameAction(action);
  }, [gameInfo, handleGameAction]);

  /**
   * Обработчик выбора карты
   */
  const handleCardSelect = useCallback((card: CardType) => {
    setSelectedCards(prev => {
      const isSelected = prev.some(c => c.id === card.id);
      if (isSelected) {
        return prev.filter(c => c.id !== card.id);
      } else {
        return [...prev, card];
      }
    });
  }, []);

  // ===== KEYBOARD SHORTCUTS =====

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (!gameInfo?.isPlayerTurn) return;

      switch (event.key) {
        case 'Enter':
          if (gameInfo.phase === 'attack' && selectedCards.length > 0) {
            handleAttack();
          }
          break;
        case 'Escape':
          setSelectedCards([]);
          break;
        case 't':
          if (gameInfo.phase === 'defend') {
            handleTake();
          }
          break;
        case 'p':
          if (gameInfo.phase === 'attack') {
            handlePass();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gameInfo, selectedCards, handleAttack, handleTake, handlePass]);

  // ===== EARLY RETURNS =====

  if (isLoading) {
    return (
      <Container className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="text-center">
          <div className="spinner-border mb-3" role="status" aria-hidden="true"></div>
          <div>{UI_TEXT.LOADING_GAME}</div>
        </div>
      </Container>
    );
  }

  if (!gameState || !gameInfo) {
    return (
      <Container className="d-flex justify-content-center align-items-center min-vh-100">
        <Alert variant="warning" role="alert">
          {UI_TEXT.GAME_NOT_ACTIVE}
        </Alert>
      </Container>
    );
  }

  // ===== РЕНДЕР =====

  return (
    <Container 
      className={CSS_CLASSES.GAME_PLAY_PAGE}
      role="main" 
      aria-label="Игровая страница"
      aria-live="polite"
    >
      {/* Ошибки */}
      {(error || actionError) && (
        <Row>
          <Col>
            <Alert 
              variant="danger" 
              role="alert"
              aria-live="assertive"
              dismissible
              onClose={() => {
                setActionError(null);
              }}
            >
              {actionError || error}
            </Alert>
          </Col>
        </Row>
      )}

      {/* Информация об игре */}
      <Row className="mb-3">
        <Col>
          <div className={CSS_CLASSES.INFO_SECTION}>
            <GameInfo
              gameState={gameState}
              currentPlayer={currentPlayer}
              isPlayerTurn={gameInfo.isPlayerTurn}
            />
          </div>
        </Col>
      </Row>

      {/* Основная игровая область */}
      <Row>
        {/* Козырная карта */}
        <Col lg={3} className="mb-3">
          <div className={CSS_CLASSES.TRUMP_SECTION}>
            <TrumpCard trump={gameInfo.trump} />
          </div>
        </Col>

        {/* Игровое поле */}
        <Col lg={9} className="mb-3">
          <div className={CSS_CLASSES.GAME_BOARD_SECTION}>
            <GameBoard
              tableCards={tableCards}
              trump={gameInfo.trump}
            />
          </div>
        </Col>
      </Row>

      {/* Элементы управления */}
      <Row className="mb-3">
        <Col>
          <div className={CSS_CLASSES.CONTROLS_SECTION}>
            <GameControls
              phase={gameInfo.phase as any}
              isPlayerTurn={gameInfo.isPlayerTurn}
              selectedCards={selectedCards}
              onAttack={handleAttack}
              onTake={handleTake}
              onPass={handlePass}
              error={actionError}
            />
          </div>
        </Col>
      </Row>

      {/* Рука игрока */}
      <Row>
        <Col>
          <div className={CSS_CLASSES.PLAYER_SECTION}>
            <PlayerHand
              cards={playerCards}
              selectedCards={selectedCards}
              onCardSelect={handleCardSelect}
              trump={gameInfo.trump}
              isPlayable={gameInfo.isPlayerTurn && isConnected}
            />
          </div>
        </Col>
      </Row>

      {/* Подсказки для клавиш */}
      {process.env.NODE_ENV === 'development' && gameInfo.isPlayerTurn && (
        <Row className="mt-3">
          <Col>
            <Alert variant="info">
              <small>
                <strong>Клавиши:</strong> Enter - Атака, T - Взять, P - Пас, Escape - Сбросить выбор
              </small>
            </Alert>
          </Col>
        </Row>
      )}
    </Container>
  );
};

// Установка displayName для лучшей отладки
GamePlayPage.displayName = 'GamePlayPage';

// ===== ЭКСПОРТ =====
export default GamePlayPage;
export type { GamePlayPageProps, GameInfo };
export { UI_TEXT, CSS_CLASSES, validateGameAction, getGameInfo };
