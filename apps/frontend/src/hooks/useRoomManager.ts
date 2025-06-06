// src/hooks/useRoomManager.ts - ХУК ДЛЯ УПРАВЛЕНИЯ КОМНАТАМИ

import { useState, useCallback, useEffect, useMemo } from 'react';
import { 
  Room, 
  WebSocketMessage, 
  WebSocketResponse,
  AutoStartInfo,
  GameRules 
} from '@shared/types';

// ===== ИНТЕРФЕЙСЫ =====

/**
 * Возвращаемые данные хука useRoomManager
 */
export interface UseRoomManagerReturn {
  rooms: Room[];
  currentRoom: Room | null;
  autoStartInfo: AutoStartInfo | null;
  notification: string | null;
  error: string | null;
  isLoading: boolean;
  loadingActions: Set<string>;
  createRoom: (name: string, rules: GameRules, isPrivate?: boolean) => Promise<void>;
  joinRoom: (roomId: string) => Promise<void>;
  leaveRoom: () => Promise<void>;
  setReady: () => Promise<void>;
  startGame: () => Promise<void>;
  clearNotification: () => void;
  clearError: () => void;
  refreshRooms: () => Promise<void>;
}

/**
 * Конфигурация управления комнатами
 */
interface RoomManagerConfig {
  maxRetries: number;
  retryDelay: number;
  actionTimeout: number;
  notificationDuration: number;
}

// ===== КОНСТАНТЫ =====

const ROOM_CONFIG: RoomManagerConfig = {
  maxRetries: 3,
  retryDelay: 1000,
  actionTimeout: 10000,
  notificationDuration: 3000
};

const MESSAGE_TYPES = {
  ROOMS_LIST: 'rooms_list',
  ROOM_CREATED: 'room_created',
  ROOM_JOINED: 'room_joined',
  ROOM_UPDATED: 'room_updated',
  ROOM_LEFT: 'room_left',
  PLAYER_JOINED_ROOM: 'player_joined_room',
  PLAYER_LEFT_ROOM: 'player_left_room',
  PLAYER_READY_CHANGED: 'player_ready_changed',
  AUTO_START_INFO: 'auto_start_info',
  AUTO_START_COUNTDOWN: 'auto_start_countdown',
  ROOM_ERROR: 'room_error',
  CREATE_ROOM: 'create_room',
  JOIN_ROOM: 'join_room',
  LEAVE_ROOM: 'leave_room',
  PLAYER_READY: 'player_ready',
  START_GAME: 'start_game',
  GET_ROOMS: 'get_rooms'
} as const;

const NOTIFICATIONS = {
  ROOM_CREATED: 'Комната успешно создана',
  ROOM_JOINED: 'Вы присоединились к комнате',
  ROOM_LEFT: 'Вы покинули комнату',
  READY_CHANGED: 'Статус готовности изменен',
  GAME_STARTING: 'Игра начинается...'
} as const;

const ERROR_MESSAGES = {
  NO_CONNECTION: 'Нет соединения с сервером',
  CREATE_ROOM_FAILED: 'Ошибка создания комнаты',
  JOIN_ROOM_FAILED: 'Ошибка присоединения к комнате',
  LEAVE_ROOM_FAILED: 'Ошибка выхода из комнаты',
  READY_FAILED: 'Ошибка изменения готовности',
  START_GAME_FAILED: 'Ошибка запуска игры',
  INVALID_ROOM_NAME: 'Название комнаты должно быть от 3 до 50 символов',
  ROOM_NOT_FOUND: 'Комната не найдена',
  ALREADY_IN_ROOM: 'Вы уже находитесь в комнате',
  ROOM_FULL: 'Комната заполнена',
  PARSE_ERROR: 'Ошибка обработки сообщения от сервера',
  TIMEOUT: 'Превышено время ожидания ответа',
  INVALID_MESSAGE: 'Неверный формат сообщения'
} as const;

const LOADING_ACTIONS = {
  CREATE_ROOM: 'create_room',
  JOIN_ROOM: 'join_room',
  LEAVE_ROOM: 'leave_room',
  SET_READY: 'set_ready',
  START_GAME: 'start_game',
  REFRESH_ROOMS: 'refresh_rooms'
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
 * Валидация названия комнаты
 */
const validateRoomName = (name: string): boolean => {
  const trimmedName = name.trim();
  return trimmedName.length >= 3 && trimmedName.length <= 50;
};

/**
 * Валидация структуры комнаты
 */
const validateRoom = (room: any): room is Room => {
  return room &&
    typeof room.id === 'string' &&
    typeof room.name === 'string' &&
    Array.isArray(room.players) &&
    typeof room.maxPlayers === 'number' &&
    room.rules &&
    typeof room.status === 'string';
};

// ===== ОСНОВНОЙ ХУК =====

/**
 * Хук для управления комнатами
 */
export const useRoomManager = (
  socket: WebSocket | null
): UseRoomManagerReturn => {
  // Состояния
  const [rooms, setRooms] = useState<Room[]>([]);
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [autoStartInfo, setAutoStartInfo] = useState<AutoStartInfo | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingActions, setLoadingActions] = useState<Set<string>>(new Set());

  // ===== УПРАВЛЕНИЕ LOADING СОСТОЯНИЯМИ =====

  /**
   * Добавление действия в loading
   */
  const addLoadingAction = useCallback((action: string) => {
    setLoadingActions(prev => new Set(prev).add(action));
    setIsLoading(true);
  }, []);

  /**
   * Удаление действия из loading
   */
  const removeLoadingAction = useCallback((action: string) => {
    setLoadingActions(prev => {
      const newSet = new Set(prev);
      newSet.delete(action);
      setIsLoading(newSet.size > 0);
      return newSet;
    });
  }, []);

  /**
   * Обертка для действий с loading
   */
  const withLoading = useCallback(async <T>(
    actionName: string, 
    action: () => Promise<T>
  ): Promise<T> => {
    addLoadingAction(actionName);
    try {
      return await action();
    } finally {
      removeLoadingAction(actionName);
    }
  }, [addLoadingAction, removeLoadingAction]);

  // ===== УПРАВЛЕНИЕ УВЕДОМЛЕНИЯМИ И ОШИБКАМИ =====

  /**
   * Показ уведомления с автоскрытием
   */
  const showNotification = useCallback((message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(null), ROOM_CONFIG.notificationDuration);
  }, []);

  /**
   * Установка ошибки с логированием
   */
  const setErrorWithLogging = useCallback((errorMessage: string, originalError?: any) => {
    console.error('Room manager error:', errorMessage, originalError);
    setError(errorMessage);
  }, []);

  /**
   * Очистка уведомления
   */
  const clearNotification = useCallback(() => {
    setNotification(null);
  }, []);

  /**
   * Очистка ошибки
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // ===== ОБРАБОТКА СООБЩЕНИЙ =====

  /**
   * Обработка WebSocket сообщений
   */
  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const message = JSON.parse(event.data);
      
      if (!validateMessage(message)) {
        console.warn('Invalid room message format:', message);
        return;
      }

      switch (message.type) {
        case MESSAGE_TYPES.ROOMS_LIST:
          if (Array.isArray(message.rooms)) {
            const validRooms = message.rooms.filter(validateRoom);
            setRooms(validRooms);
            removeLoadingAction(LOADING_ACTIONS.REFRESH_ROOMS);
          }
          break;

        case MESSAGE_TYPES.ROOM_CREATED:
          if (message.room && validateRoom(message.room)) {
            setCurrentRoom(message.room);
            showNotification(NOTIFICATIONS.ROOM_CREATED);
            removeLoadingAction(LOADING_ACTIONS.CREATE_ROOM);
          } else {
            setErrorWithLogging(ERROR_MESSAGES.INVALID_MESSAGE, message);
          }
          break;

        case MESSAGE_TYPES.ROOM_JOINED:
          if (message.room && validateRoom(message.room)) {
            setCurrentRoom(message.room);
            showNotification(NOTIFICATIONS.ROOM_JOINED);
            removeLoadingAction(LOADING_ACTIONS.JOIN_ROOM);
          } else {
            setErrorWithLogging(ERROR_MESSAGES.INVALID_MESSAGE, message);
          }
          break;

        case MESSAGE_TYPES.ROOM_LEFT:
          setCurrentRoom(null);
          setAutoStartInfo(null);
          showNotification(NOTIFICATIONS.ROOM_LEFT);
          removeLoadingAction(LOADING_ACTIONS.LEAVE_ROOM);
          break;

        case MESSAGE_TYPES.ROOM_UPDATED:
        case MESSAGE_TYPES.PLAYER_JOINED_ROOM:
        case MESSAGE_TYPES.PLAYER_LEFT_ROOM:
        case MESSAGE_TYPES.PLAYER_READY_CHANGED:
          if (message.room && validateRoom(message.room)) {
            setCurrentRoom(message.room);
            if (message.type === MESSAGE_TYPES.PLAYER_READY_CHANGED) {
              removeLoadingAction(LOADING_ACTIONS.SET_READY);
            }
          } else {
            setErrorWithLogging(ERROR_MESSAGES.INVALID_MESSAGE, message);
          }
          break;

        case MESSAGE_TYPES.AUTO_START_INFO:
        case MESSAGE_TYPES.AUTO_START_COUNTDOWN:
          if (message.autoStartInfo) {
            setAutoStartInfo(message.autoStartInfo);
            if (message.autoStartInfo.isAutoStarting) {
              showNotification(NOTIFICATIONS.GAME_STARTING);
            }
          }
          break;

        case MESSAGE_TYPES.ROOM_ERROR:
          const errorMsg = message.error || ERROR_MESSAGES.CREATE_ROOM_FAILED;
          setErrorWithLogging(errorMsg);
          // Удаляем все loading состояния при ошибке
          setLoadingActions(new Set());
          setIsLoading(false);
          break;

        default:
          // Игнорируем неизвестные типы сообщений
          break;
      }
    } catch (err) {
      console.error('Error parsing room message:', err);
      setErrorWithLogging(ERROR_MESSAGES.PARSE_ERROR);
    }
  }, [showNotification, setErrorWithLogging, removeLoadingAction]);

  // ===== ДЕЙСТВИЯ С КОМНАТАМИ =====

  /**
   * Отправка сообщения с повторными попытками
   */
  const sendMessageWithRetry = useCallback(async (
    message: WebSocketMessage,
    retryCount = 0
  ): Promise<void> => {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      throw new Error(ERROR_MESSAGES.NO_CONNECTION);
    }

    try {
      socket.send(JSON.stringify(message));
    } catch (err) {
      if (retryCount < ROOM_CONFIG.maxRetries) {
        console.warn(`Message send failed, retrying (${retryCount + 1}/${ROOM_CONFIG.maxRetries})`);
        await new Promise(resolve => 
          setTimeout(resolve, ROOM_CONFIG.retryDelay * (retryCount + 1))
        );
        return sendMessageWithRetry(message, retryCount + 1);
      }
      throw err;
    }
  }, [socket]);

  /**
   * Создание комнаты
   */
  const createRoom = useCallback(async (
    name: string, 
    rules: GameRules, 
    isPrivate = false
  ): Promise<void> => {
    if (!validateRoomName(name)) {
      setErrorWithLogging(ERROR_MESSAGES.INVALID_ROOM_NAME);
      return;
    }

    if (!socket || socket.readyState !== WebSocket.OPEN) {
      setErrorWithLogging(ERROR_MESSAGES.NO_CONNECTION);
      return;
    }

    await withLoading(LOADING_ACTIONS.CREATE_ROOM, async () => {
      setError(null);
      
      const message: WebSocketMessage = {
        type: MESSAGE_TYPES.CREATE_ROOM,
        name: name.trim(),
        rules,
        isPrivate
      };

      await sendMessageWithRetry(message);
    });
  }, [socket, withLoading, sendMessageWithRetry, setErrorWithLogging]);

  /**
   * Присоединение к комнате
   */
  const joinRoom = useCallback(async (roomId: string): Promise<void> => {
    if (!roomId) {
      setErrorWithLogging(ERROR_MESSAGES.ROOM_NOT_FOUND);
      return;
    }

    if (!socket || socket.readyState !== WebSocket.OPEN) {
      setErrorWithLogging(ERROR_MESSAGES.NO_CONNECTION);
      return;
    }

    await withLoading(LOADING_ACTIONS.JOIN_ROOM, async () => {
      setError(null);
      
      const message: WebSocketMessage = {
        type: MESSAGE_TYPES.JOIN_ROOM,
        roomId
      };

      await sendMessageWithRetry(message);
    });
  }, [socket, withLoading, sendMessageWithRetry, setErrorWithLogging]);

  /**
   * Выход из комнаты
   */
  const leaveRoom = useCallback(async (): Promise<void> => {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      setErrorWithLogging(ERROR_MESSAGES.NO_CONNECTION);
      return;
    }

    await withLoading(LOADING_ACTIONS.LEAVE_ROOM, async () => {
      setError(null);
      
      const message: WebSocketMessage = {
        type: MESSAGE_TYPES.LEAVE_ROOM
      };

      await sendMessageWithRetry(message);
    });
  }, [socket, withLoading, sendMessageWithRetry, setErrorWithLogging]);

  /**
   * Изменение готовности
   */
  const setReady = useCallback(async (): Promise<void> => {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      setErrorWithLogging(ERROR_MESSAGES.NO_CONNECTION);
      return;
    }

    await withLoading(LOADING_ACTIONS.SET_READY, async () => {
      setError(null);
      
      const message: WebSocketMessage = {
        type: MESSAGE_TYPES.PLAYER_READY
      };

      await sendMessageWithRetry(message);
    });
  }, [socket, withLoading, sendMessageWithRetry, setErrorWithLogging]);

  /**
   * Запуск игры
   */
  const startGame = useCallback(async (): Promise<void> => {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      setErrorWithLogging(ERROR_MESSAGES.NO_CONNECTION);
      return;
    }

    await withLoading(LOADING_ACTIONS.START_GAME, async () => {
      setError(null);
      
      const message: WebSocketMessage = {
        type: MESSAGE_TYPES.START_GAME
      };

      await sendMessageWithRetry(message);
    });
  }, [socket, withLoading, sendMessageWithRetry, setErrorWithLogging]);

  /**
   * Обновление списка комнат
   */
  const refreshRooms = useCallback(async (): Promise<void> => {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      setErrorWithLogging(ERROR_MESSAGES.NO_CONNECTION);
      return;
    }

    await withLoading(LOADING_ACTIONS.REFRESH_ROOMS, async () => {
      setError(null);
      
      const message: WebSocketMessage = {
        type: MESSAGE_TYPES.GET_ROOMS
      };

      await sendMessageWithRetry(message);
    });
  }, [socket, withLoading, sendMessageWithRetry, setErrorWithLogging]);

  // ===== МЕМОИЗАЦИЯ ДЛЯ ОПТИМИЗАЦИИ =====

  /**
   * Мемоизированный поиск комнат по ID
   */
  const roomsById = useMemo(() => {
    return rooms.reduce((acc, room) => {
      acc[room.id] = room;
      return acc;
    }, {} as Record<string, Room>);
  }, [rooms]);

  // ===== ПОДПИСКА НА WEBSOCKET СОБЫТИЯ =====

  useEffect(() => {
    if (!socket) {
      return;
    }

    // Добавление обработчика сообщений
    socket.addEventListener('message', handleMessage);

    // Обработка закрытия соединения
    const handleClose = () => {
      setLoadingActions(new Set());
      setIsLoading(false);
    };

    // Обработка ошибок соединения
    const handleError = () => {
      setLoadingActions(new Set());
      setIsLoading(false);
      setErrorWithLogging(ERROR_MESSAGES.NO_CONNECTION);
    };

    socket.addEventListener('close', handleClose);
    socket.addEventListener('error', handleError);

    // Автоматическое обновление списка комнат при подключении
    if (socket.readyState === WebSocket.OPEN) {
      refreshRooms();
    }

    // Cleanup
    return () => {
      socket.removeEventListener('message', handleMessage);
      socket.removeEventListener('close', handleClose);
      socket.removeEventListener('error', handleError);
    };
  }, [socket, handleMessage, setErrorWithLogging, refreshRooms]);

  // ===== ВОЗВРАТ ДАННЫХ =====

  return {
    rooms,
    currentRoom,
    autoStartInfo,
    notification,
    error,
    isLoading,
    loadingActions,
    createRoom,
    joinRoom,
    leaveRoom,
    setReady,
    startGame,
    clearNotification,
    clearError,
    refreshRooms
  };
};

// ===== ЭКСПОРТ ДОПОЛНИТЕЛЬНЫХ ТИПОВ И КОНСТАНТ =====
export type { RoomManagerConfig };
export { ROOM_CONFIG, MESSAGE_TYPES, NOTIFICATIONS, ERROR_MESSAGES, LOADING_ACTIONS };
