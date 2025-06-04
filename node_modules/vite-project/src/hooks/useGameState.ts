// src/hooks/useGameState.ts - ХУК ДЛЯ УПРАВЛЕНИЯ ИГРОВЫМ СОСТОЯНИЕМ

import { useState, useCallback, useEffect } from 'react';
import { 
  GameState, 
  GameAction, 
  WebSocketMessage,
  WebSocketResponse 
} from '../../../packages/shared/src/types';

// ===== ИНТЕРФЕЙСЫ =====

/**
 * Возвращаемые данные хука useGameState
 */
export interface UseGameStateReturn {
  gameState: GameState | null;
  error: string | null;
  isLoading: boolean;
  makeGameAction: (action: GameAction) => Promise<void>;
  clearError: () => void;
  resetGameState: () => void;
}

/**
 * Конфигурация игрового состояния
 */
interface GameStateConfig {
  autoRetry: boolean;
  maxRetries: number;
  retryDelay: number;
  actionTimeout: number;
}

// ===== КОНСТАНТЫ =====

const GAME_CONFIG: GameStateConfig = {
  autoRetry: true,
  maxRetries: 3,
  retryDelay: 1000,
  actionTimeout: 10000
};

const MESSAGE_TYPES = {
  GAME_STARTED: 'game_started',
  GAME_UPDATED: 'game_updated',
  GAME_ACTION_RESULT: 'game_action_result',
  GAME_ENDED: 'game_ended',
  PLAYER_DISCONNECTED: 'player_disconnected',
  PLAYER_RECONNECTED: 'player_reconnected',
  GAME_ACTION: 'game_action'
} as const;

const ERROR_MESSAGES = {
  NO_CONNECTION: 'Нет соединения с сервером',
  ACTION_FAILED: 'Ошибка отправки игрового действия',
  PARSE_ERROR: 'Ошибка обработки сообщения от сервера',
  UNKNOWN_ACTION: 'Ошибка игрового действия',
  TIMEOUT: 'Превышено время ожидания ответа',
  INVALID_MESSAGE: 'Неверный формат сообщения',
  GAME_NOT_FOUND: 'Игра не найдена',
  INVALID_ACTION: 'Недопустимое действие'
} as const;

// ===== УТИЛИТАРНЫЕ ФУНКЦИИ =====

/**
 * Валидация WebSocket сообщения
 */
const validateMessage = (message: any): message is WebSocketResponse => {
  return message && 
    typeof message.type === 'string' &&
    message.type.length > 0;
};

/**
 * Валидация игрового состояния
 */
const validateGameState = (gameState: any): gameState is GameState => {
  return gameState &&
    typeof gameState.id === 'string' &&
    typeof gameState.roomId === 'string' &&
    typeof gameState.phase === 'string' &&
    Array.isArray(gameState.players) &&
    Array.isArray(gameState.deck) &&
    Array.isArray(gameState.table);
};

/**
 * Валидация игрового действия
 */
const validateGameAction = (action: any): action is GameAction => {
  return action &&
    typeof action.type === 'string' &&
    typeof action.playerId === 'string' &&
    action.type.length > 0 &&
    action.playerId.length > 0;
};

// ===== ОСНОВНОЙ ХУК =====

/**
 * Хук для управления игровым состоянием
 */
export const useGameState = (
  socket: WebSocket | null
): UseGameStateReturn => {
  // Состояния
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // ===== УПРАВЛЕНИЕ ОШИБКАМИ =====

  /**
   * Очистка ошибки
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Установка ошибки с логированием
   */
  const setErrorWithLogging = useCallback((errorMessage: string, originalError?: any) => {
    console.error('Game state error:', errorMessage, originalError);
    setError(errorMessage);
  }, []);

  // ===== СБРОС СОСТОЯНИЯ =====

  /**
   * Сброс игрового состояния
   */
  const resetGameState = useCallback(() => {
    setGameState(null);
    setError(null);
    setIsLoading(false);
  }, []);

  // ===== ОБРАБОТКА СООБЩЕНИЙ =====

  /**
   * Обработка WebSocket сообщений
   */
  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const message = JSON.parse(event.data);
      
      if (!validateMessage(message)) {
        console.warn('Invalid game message format:', message);
        return;
      }

      switch (message.type) {
        case MESSAGE_TYPES.GAME_STARTED:
          if (message.gameState && validateGameState(message.gameState)) {
            setGameState(message.gameState);
            setError(null);
            console.log('Game started:', message.gameState.id);
          } else {
            setErrorWithLogging(ERROR_MESSAGES.INVALID_MESSAGE, message);
          }
          break;

        case MESSAGE_TYPES.GAME_UPDATED:
          if (message.gameState && validateGameState(message.gameState)) {
            setGameState(message.gameState);
            setError(null);
          } else {
            setErrorWithLogging(ERROR_MESSAGES.INVALID_MESSAGE, message);
          }
          break;

        case MESSAGE_TYPES.GAME_ACTION_RESULT:
          setIsLoading(false);
          if (message.success) {
            if (message.gameState && validateGameState(message.gameState)) {
              setGameState(message.gameState);
              setError(null);
            }
          } else {
            setErrorWithLogging(message.error || ERROR_MESSAGES.UNKNOWN_ACTION);
          }
          break;

        case MESSAGE_TYPES.GAME_ENDED:
          if (message.gameState && validateGameState(message.gameState)) {
            setGameState(message.gameState);
            setError(null);
            console.log('Game ended, winner:', message.winner?.name);
          } else {
            setErrorWithLogging(ERROR_MESSAGES.INVALID_MESSAGE, message);
          }
          break;

        case MESSAGE_TYPES.PLAYER_DISCONNECTED:
          if (message.playerId && gameState?.players) {
            setGameState(prevState => {
              if (!prevState) return null;
              
              return {
                ...prevState,
                players: prevState.players.map(p =>
                  p.id === message.playerId
                    ? { ...p, isConnected: false }
                    : p
                )
              };
            });
          }
          break;

        case MESSAGE_TYPES.PLAYER_RECONNECTED:
          if (message.playerId && gameState?.players) {
            setGameState(prevState => {
              if (!prevState) return null;
              
              return {
                ...prevState,
                players: prevState.players.map(p =>
                  p.id === message.playerId
                    ? { ...p, isConnected: true }
                    : p
                )
              };
            });
          }
          break;

        default:
          // Игнорируем неизвестные типы сообщений
          break;
      }
    } catch (err) {
      console.error('Error parsing game message:', err);
      setErrorWithLogging(ERROR_MESSAGES.PARSE_ERROR);
    }
  }, [gameState, setErrorWithLogging]);

  // ===== ИГРОВЫЕ ДЕЙСТВИЯ =====

  /**
   * Выполнение игрового действия с повторными попытками
   */
  const makeGameActionWithRetry = useCallback(async (
    action: GameAction, 
    retryCount = 0
  ): Promise<void> => {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      throw new Error(ERROR_MESSAGES.NO_CONNECTION);
    }

    if (!validateGameAction(action)) {
      throw new Error(ERROR_MESSAGES.INVALID_ACTION);
    }

    try {
      const message: WebSocketMessage = {
        type: MESSAGE_TYPES.GAME_ACTION,
        action
      };

      socket.send(JSON.stringify(message));
    } catch (err) {
      if (GAME_CONFIG.autoRetry && retryCount < GAME_CONFIG.maxRetries) {
        console.warn(`Game action failed, retrying (${retryCount + 1}/${GAME_CONFIG.maxRetries})`);
        
        await new Promise(resolve => 
          setTimeout(resolve, GAME_CONFIG.retryDelay * (retryCount + 1))
        );
        
        return makeGameActionWithRetry(action, retryCount + 1);
      }
      
      throw err;
    }
  }, [socket]);

  /**
   * Основная функция выполнения игрового действия
   */
  const makeGameAction = useCallback(async (action: GameAction): Promise<void> => {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      setErrorWithLogging(ERROR_MESSAGES.NO_CONNECTION);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Таймаут для действия
      const actionPromise = makeGameActionWithRetry(action);
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error(ERROR_MESSAGES.TIMEOUT)), GAME_CONFIG.actionTimeout);
      });

      await Promise.race([actionPromise, timeoutPromise]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : ERROR_MESSAGES.ACTION_FAILED;
      setErrorWithLogging(errorMessage, err);
    } finally {
      // Сброс loading состояния через небольшую задержку
      // чтобы дать время на получение ответа от сервера
      setTimeout(() => setIsLoading(false), 1000);
    }
  }, [socket, makeGameActionWithRetry, setErrorWithLogging]);

  // ===== ПОДПИСКА НА WEBSOCKET СОБЫТИЯ =====

  useEffect(() => {
    if (!socket) {
      return;
    }

    // Добавление обработчика сообщений
    socket.addEventListener('message', handleMessage);

    // Обработка закрытия соединения
    const handleClose = () => {
      setIsLoading(false);
    };

    // Обработка ошибок соединения
    const handleError = () => {
      setIsLoading(false);
      setErrorWithLogging(ERROR_MESSAGES.NO_CONNECTION);
    };

    socket.addEventListener('close', handleClose);
    socket.addEventListener('error', handleError);

    // Cleanup
    return () => {
      socket.removeEventListener('message', handleMessage);
      socket.removeEventListener('close', handleClose);
      socket.removeEventListener('error', handleError);
    };
  }, [socket, handleMessage, setErrorWithLogging]);

  // ===== СБРОС СОСТОЯНИЯ ПРИ ОТКЛЮЧЕНИИ =====

  useEffect(() => {
    if (!socket) {
      setIsLoading(false);
    }
  }, [socket]);

  // ===== ВОЗВРАТ ДАННЫХ =====

  return {
    gameState,
    error,
    isLoading,
    makeGameAction,
    clearError,
    resetGameState
  };
};

// ===== ЭКСПОРТ ДОПОЛНИТЕЛЬНЫХ ТИПОВ И КОНСТАНТ =====
export type { GameStateConfig };
export { GAME_CONFIG, MESSAGE_TYPES, ERROR_MESSAGES };
