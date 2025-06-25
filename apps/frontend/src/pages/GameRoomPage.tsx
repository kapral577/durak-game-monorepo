// src/pages/GameRoomPage.tsx - СТРАНИЦА ИГРОВОЙ КОМНАТЫ

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Alert, Badge, ProgressBar, Spinner } from 'react-bootstrap';
import { useGame } from '../context/GameProvider';
import PlayerSlot from '../components/PlayerSlot';
import { useDeviceType } from '../hooks/useDeviceType';

// ===== ИНТЕРФЕЙСЫ =====

/**
 * Props для GameRoomPage
 */
export interface GameRoomPageProps {
  // Если нужны props в будущем
}

/**
 * Параметры маршрута
 */
interface RouteParams {
  roomId: string;
}

// ===== КОНСТАНТЫ =====

const UI_TEXT = {
  PAGE_TITLE: 'Игровая комната',
  LOADING_DATA: 'Загрузка данных комнаты...',
  ROOM_NOT_EXISTS: 'Комната {roomId} не найдена',
  READY_BUTTON: 'Готов',
  NOT_READY_BUTTON: 'Не готов',
  CANCEL_READY: 'Отменить готовность',
  START_GAME_BUTTON: 'Начать игру',
  LEAVE_ROOM_BUTTON: 'Покинуть комнату',
  WAITING_PLAYERS: 'Ожидание игроков...',
  AUTO_START_COUNTDOWN: 'Автостарт через {seconds} сек',
  GAME_RULES_TITLE: 'Правила игры',
  PLAYERS_TITLE: 'Игроки',
  READY_PROGRESS: 'Готовность игроков',
  EMPTY_SLOT: 'Свободное место'
} as const;

const GAME_MODE_TEXTS = {
  classic: 'Классический дурак',
  transferable: 'Переводной дурак'
} as const;

const THROWING_MODE_TEXTS = {
  standard: 'Стандартное подкидывание',
  smart: 'Умное подкидывание'
} as const;

const STATUS_VARIANTS = {
  waiting: 'success',
  playing: 'warning',
  finished: 'secondary'
} as const;

const CSS_CLASSES = {
  GAME_ROOM_PAGE: 'game-room-page',
  ROOM_HEADER: 'room-header',
  PLAYERS_SECTION: 'players-section',
  RULES_SECTION: 'rules-section',
  CONTROLS_SECTION: 'controls-section',
  AUTO_START_SECTION: 'auto-start-section',
  PROGRESS_SECTION: 'progress-section'
} as const;

// ===== УТИЛИТАРНЫЕ ФУНКЦИИ =====

/**
 * Получение статуса игрока
 */
const getPlayerStatus = (player: any) => {
  if (!player.isConnected) return 'disconnected';
  if (player.isReady) return 'ready';
  return 'waiting';
};

/**
 * Получение текста режима игры
 */
const getGameModeText = (gameMode: string): string => {
  return GAME_MODE_TEXTS[gameMode as keyof typeof GAME_MODE_TEXTS] || gameMode;
};

/**
 * Получение текста режима подкидывания
 */
const getThrowingModeText = (throwingMode: string): string => {
  return THROWING_MODE_TEXTS[throwingMode as keyof typeof THROWING_MODE_TEXTS] || throwingMode;
};

// ===== КОМПОНЕНТЫ =====

/**
 * Заголовок комнаты
 */
const RoomHeader: React.FC<{
  roomName: string;
  roomStatus: string;
  autoStartInfo: any;
}> = React.memo(({ roomName, roomStatus, autoStartInfo }) => (
  <Row className={`${CSS_CLASSES.ROOM_HEADER} mb-4`}>
    <Col>
      <div className="d-flex justify-content-between align-items-center">
        <h2>{UI_TEXT.PAGE_TITLE}: {roomName}</h2>
        <div>
          <Badge 
            bg={STATUS_VARIANTS[roomStatus as keyof typeof STATUS_VARIANTS] || 'secondary'}
            className="me-2"
          >
            {roomStatus === 'waiting' ? 'Ожидание' : roomStatus === 'playing' ? 'В игре' : 'Завершена'}
          </Badge>
          
          {autoStartInfo?.isAutoStarting && (
            <Badge bg="warning" className="animate-pulse">
              {UI_TEXT.AUTO_START_COUNTDOWN.replace('{seconds}', autoStartInfo.countdown.toString())}
            </Badge>
          )}
        </div>
      </div>
    </Col>
  </Row>
));

RoomHeader.displayName = 'RoomHeader';

/**
 * Прогресс готовности
 */
const ReadyProgress: React.FC<{
  readyCount: number;
  totalCount: number;
}> = React.memo(({ readyCount, totalCount }) => {
  const percentage = totalCount > 0 ? (readyCount / totalCount) * 100 : 0;
  
  return (
    <div className={`${CSS_CLASSES.PROGRESS_SECTION} mb-3`}>
      <div className="d-flex justify-content-between align-items-center mb-2">
        <small className="text-muted">{UI_TEXT.READY_PROGRESS}</small>
        <small className="text-muted">{readyCount}/{totalCount}</small>
      </div>
      <ProgressBar 
        now={percentage} 
        variant={percentage === 100 ? 'success' : 'primary'}
        aria-label={`${readyCount} из ${totalCount} игроков готовы`}
      />
    </div>
  );
});

ReadyProgress.displayName = 'ReadyProgress';

/**
 * Список игроков
 */
const PlayersList: React.FC<{
  players: any[];
  maxPlayers: number;
  currentPlayer: any;
}> = React.memo(({ players, maxPlayers, currentPlayer }) => {
  // Создаем массив слотов с пустыми местами
  const playerSlots = useMemo(() => {
    const slots = [...players];
    while (slots.length < maxPlayers) {
      slots.push(null);
    }
    return slots;
  }, [players, maxPlayers]);

  return (
    <Card className={`${CSS_CLASSES.PLAYERS_SECTION} mb-4`}>
      <Card.Header>
        <h5 className="mb-0">{UI_TEXT.PLAYERS_TITLE} ({players.length}/{maxPlayers})</h5>
      </Card.Header>
      <Card.Body>
        <Row>
          {playerSlots.map((player, index) => (
            <Col key={player?.id || `empty-${index}`} xs={6} md={3} className="mb-3">
              <PlayerSlot
                player={player}
                isYou={player?.id === currentPlayer?.id}
                ready={player?.isReady || false}
                isConnected={player?.isConnected ?? true}
                size="medium"
              />
            </Col>
          ))}
        </Row>
        
        <ReadyProgress 
          readyCount={players.filter(p => p.isReady).length}
          totalCount={players.length}
        />
      </Card.Body>
    </Card>
  );
});

PlayersList.displayName = 'PlayersList';

/**
 * Правила игры
 */
const GameRules: React.FC<{
  rules: any;
}> = React.memo(({ rules }) => (
  <Card className={`${CSS_CLASSES.RULES_SECTION} mb-4`}>
    <Card.Header>
      <h5 className="mb-0">{UI_TEXT.GAME_RULES_TITLE}</h5>
    </Card.Header>
    <Card.Body>
      <Row>
        <Col md={6}>
          <div className="mb-2">
            <strong>Режим игры:</strong> {getGameModeText(rules.gameMode)}
          </div>
          <div className="mb-2">
            <strong>Подкидывание:</strong> {getThrowingModeText(rules.throwingMode)}
          </div>
        </Col>
        <Col md={6}>
          <div className="mb-2">
            <strong>Количество карт:</strong> {rules.cardCount}
          </div>
          <div className="mb-2">
            <strong>Максимум игроков:</strong> {rules.maxPlayers}
          </div>
        </Col>
      </Row>
    </Card.Body>
  </Card>
));

GameRules.displayName = 'GameRules';

/**
 * Элементы управления
 */
const RoomControls: React.FC<{
  isPlayerReady: boolean;
  canStartGame: boolean;
  isHost: boolean;
  onReadyToggle: () => void;
  onStartGame: () => void;
  onLeaveRoom: () => void;
  isLoading: boolean;
}> = React.memo(({ 
  isPlayerReady, 
  canStartGame, 
  isHost, 
  onReadyToggle, 
  onStartGame, 
  onLeaveRoom,
  isLoading 
}) => (
  <Card className={CSS_CLASSES.CONTROLS_SECTION}>
    <Card.Body>
      <div className="d-flex flex-wrap gap-2 justify-content-center">
        <Button
          variant={isPlayerReady ? "success" : "primary"}
          onClick={onReadyToggle}
          disabled={isLoading}
          aria-pressed={isPlayerReady}
          aria-label={isPlayerReady ? "Отменить готовность" : "Отметить готовность"}
        >
          {isLoading ? (
            <Spinner size="sm" className="me-2" />
          ) : null}
          {isPlayerReady ? UI_TEXT.CANCEL_READY : UI_TEXT.READY_BUTTON}
        </Button>

        {isHost && (
          <Button
            variant="success"
            onClick={onStartGame}
            disabled={!canStartGame || isLoading}
            aria-label="Начать игру для всех игроков"
          >
            {UI_TEXT.START_GAME_BUTTON}
          </Button>
        )}

        <Button
          variant="outline-danger"
          onClick={onLeaveRoom}
          disabled={isLoading}
          aria-label="Покинуть игровую комнату"
        >
          {UI_TEXT.LEAVE_ROOM_BUTTON}
        </Button>
      </div>
    </Card.Body>
  </Card>
));

RoomControls.displayName = 'RoomControls';

// ===== ОСНОВНОЙ КОМПОНЕНТ =====

/**
 * Страница игровой комнаты
 */
export const GameRoomPage: React.FC<GameRoomPageProps> = () => {
  // Состояния
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const device = useDeviceType();

  // Хуки
  const navigate = useNavigate();
  const { roomId } = useParams<RouteParams>();
  const { 
    currentRoom, 
    currentPlayer, 
    autoStartInfo,
    setReady, 
    startGame, 
    leaveRoom,
    error,
    clearError
  } = useGame();

  // ===== МЕМОИЗАЦИЯ =====

  /**
   * Проверка готовности текущего игрока
   */
  const isPlayerReady = useMemo(() => {
    if (!currentRoom || !currentPlayer) return false;
    const player = currentRoom.players.find(p => p.id === currentPlayer.id);
    return player?.isReady || false;
  }, [currentRoom, currentPlayer]);

  /**
   * Проверка возможности старта игры
   */
  const canStartGame = useMemo(() => {
    if (!currentRoom || !autoStartInfo) return false;
    return autoStartInfo.allReady && autoStartInfo.readyCount >= 2;
  }, [currentRoom, autoStartInfo]);

  /**
   * Проверка является ли игрок хостом
   */
  const isHost = useMemo(() => {
    if (!currentRoom || !currentPlayer) return false;
    return currentRoom.hostId === currentPlayer.id;
  }, [currentRoom, currentPlayer]);

  // ===== ОБРАБОТЧИКИ =====

  /**
   * Переключение готовности
   */
  const handleReadyToggle = useCallback(async () => {
    setIsLoading(true);
    clearError();
    try {
      await setReady();
    } catch (error) {
      console.error('Error toggling ready status:', error);
    } finally {
      setIsLoading(false);
    }
  }, [setReady, clearError]);

  /**
   * Начало игры
   */
  const handleStartGame = useCallback(async () => {
    setIsLoading(true);
    clearError();
    try {
      await startGame();
    } catch (error) {
      console.error('Error starting game:', error);
    } finally {
      setIsLoading(false);
    }
  }, [startGame, clearError]);

  /**
   * Выход из комнаты
   */
  const handleLeaveRoom = useCallback(async () => {
    setIsLoading(true);
    clearError();
    try {
      await leaveRoom();
      navigate('/rooms');
    } catch (error) {
      console.error('Error leaving room:', error);
    } finally {
      setIsLoading(false);
    }
  }, [leaveRoom, navigate, clearError]);

  // ===== АВТОМАТИЧЕСКАЯ НАВИГАЦИЯ ПРИ СТАРТЕ ИГРЫ =====

  useEffect(() => {
    if (currentRoom?.status === 'playing') {
      navigate('/game');
    }
  }, [currentRoom?.status, navigate]);

  // ===== ИНИЦИАЛИЗАЦИЯ =====

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // ===== KEYBOARD SHORTCUTS =====

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case 'r':
            event.preventDefault();
            handleReadyToggle();
            break;
          case 'Escape':
            event.preventDefault();
            handleLeaveRoom();
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleReadyToggle, handleLeaveRoom]);

  // ===== EARLY RETURNS =====

  if (isLoading) {
    return (
      <Container className="d-flex justify-content-center align-items-center min-vh-100 adaptive-container">
        <div className="text-center">
          <Spinner animation="border" className="mb-3" />
          <div>{UI_TEXT.LOADING_DATA}</div>
        </div>
      </Container>
    );
  }

  if (!currentRoom || !roomId) {
    return (
      <Container className="d-flex justify-content-center align-items-center min-vh-100 adaptive-container">
        <Alert variant="warning">
          <div>{UI_TEXT.ROOM_NOT_EXISTS.replace('{roomId}', roomId || '')}</div>
        </Alert>
      </Container>
    );
  }

  // ===== РЕНДЕР =====

  return (
    <Container 
      className={`${CSS_CLASSES.GAME_ROOM_PAGE} adaptive-container with-safe-area`}
      role="main"
      aria-label="Страница игровой комнаты"
    >
      {/* Заголовок */}
      <RoomHeader
        roomName={currentRoom.name}
        roomStatus={currentRoom.status}
        autoStartInfo={autoStartInfo}
      />

      {/* Ошибка */}
      {error && (
        <Alert variant="danger" role="alert" aria-live="assertive">
          {error}
        </Alert>
      )}

      {/* Список игроков */}
      <PlayersList
        players={currentRoom.players}
        maxPlayers={currentRoom.maxPlayers}
        currentPlayer={currentPlayer}
      />

      {/* Правила игры */}
      <GameRules rules={currentRoom.rules} />

      {/* Элементы управления */}
      <RoomControls
        isPlayerReady={isPlayerReady}
        canStartGame={canStartGame}
        isHost={isHost}
        onReadyToggle={handleReadyToggle}
        onStartGame={handleStartGame}
        onLeaveRoom={handleLeaveRoom}
        isLoading={isLoading}
      />
    </Container>
  );
};

// Установка displayName для лучшей отладки
GameRoomPage.displayName = 'GameRoomPage';

// ===== ЭКСПОРТ =====
export default GameRoomPage;
export type { GameRoomPageProps, RouteParams };
export { UI_TEXT, CSS_CLASSES, getPlayerStatus, getGameModeText, getThrowingModeText };
