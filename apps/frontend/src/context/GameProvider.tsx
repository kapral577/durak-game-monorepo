// src/contexts/GameProvider.tsx - ОСНОВНОЙ ПРОВАЙДЕР ИГРЫ

import React, { createContext, useContext, useMemo, useEffect, useState } from 'react';
import { 
  GameState, 
  Player, 
  Room, 
  AutoStartInfo,
  TelegramUser,
  ConnectionStatus,
  GameError,
  WebSocketResponse
} from '@shared/types';
import { useAuth } from '../hooks/useAuth';
import { useWebSocket } from '../hooks/useWebSocket';
import { useGameState } from '../hooks/useGameState';
import { useRoomManager } from '../hooks/useRoomManager';

// ===== ИНТЕРФЕЙСЫ =====

/**
 * Состояние контекста игры
 */
export interface GameContextState {
  // WebSocket состояние
  socket: WebSocket | null;
  isConnected: boolean;
  connectionStatus: ConnectionStatus;
  
  // Аутентификация
  telegramUser: TelegramUser | null;
  isAuthenticated: boolean;
  authToken: string | null;
  currentPlayer: Player | null;
  
  // Игровое состояние
  gameState: GameState | null;
  
  // Комнаты
  rooms: Room[];
  currentRoom: Room | null;
  autoStartInfo: AutoStartInfo | null;
  
  // Уведомления и ошибки
  notification: string | null;
  error: string | null;
  errors: GameError[];
  
  // Состояния загрузки
  isLoading: boolean;
  loadingStates: {
    connecting: boolean;
    authenticating: boolean;
    joiningRoom: boolean;
    startingGame: boolean;
    makingAction: boolean;
  };
}

/**
 * Методы контекста игры
 */
export interface GameContextMethods {
  // Аутентификация
  authenticate: () => Promise<boolean>;
  logout: () => void;
  
  // WebSocket
  connect: () => Promise<void>;
  disconnect: () => void;
  clearError: () => void;
  
  // Игровые действия
  makeGameAction: (action: import('@shared/types').GameAction) => Promise<void>;
  
  // Управление комнатами
  createRoom: (name: string, rules: import('@shared/types').GameRules, isPrivate?: boolean) => Promise<void>;
  joinRoom: (roomId: string) => Promise<void>;
  leaveRoom: () => Promise<void>;
  setReady: () => Promise<void>;
  startGame: () => Promise<void>;
  refreshRooms: () => Promise<void>;
  
  // Утилиты
  clearNotification: () => void;
  addError: (error: GameError) => void;
  clearErrors: () => void;
}

/**
 * Полный тип контекста
 */
export interface GameContextType extends GameContextState, GameContextMethods {}

/**
 * Props для GameProvider
 */
interface GameProviderProps {
  children: React.ReactNode;
}

// ===== КОНСТАНТЫ =====

const MAX_ERRORS_HISTORY = 10;

const LOADING_STATES_DEFAULT = {
  connecting: false,
  authenticating: false,
  joiningRoom: false,
  startingGame: false,
  makingAction: false
};

// ===== СОЗДАНИЕ КОНТЕКСТА =====

const GameContext = createContext<GameContextType | null>(null);

// ===== ПРОВАЙДЕР =====

/**
 * Основной провайдер игры
 */
export const GameProvider: React.FC<GameProviderProps> = ({ children }) => {
  // Дополнительные состояния
  const [errors, setErrors] = useState<GameError[]>([]);
  const [loadingStates, setLoadingStates] = useState(LOADING_STATES_DEFAULT);

// Хуки
  const auth = useAuth();
  
  // WebSocket на верхнем уровне
  const gameWebSocket = useWebSocket(
    auth.isAuthenticated && auth.authToken ? auth.authToken : null,
    auth.isAuthenticated && auth.telegramUser ? auth.telegramUser : null
  );
  
  const gameState = useGameState(gameWebSocket?.socket || null);
  const roomManager = useRoomManager(gameWebSocket?.socket || null);
  
  // Логирование auth изменений
  useEffect(() => {
    console.log('🔧 DEBUG: GameProvider auth check (DETAILED):', {
      isAuthenticated: auth.isAuthenticated,
      hasToken: !!auth.authToken,
      hasUser: !!auth.telegramUser,
      authTokenValue: auth.authToken,
      telegramUserValue: auth.telegramUser,
      timestamp: Date.now()
    });
    
    if (auth.isAuthenticated && auth.authToken && auth.telegramUser) {
      console.log('🔧 DEBUG: WebSocket should be connected');
    } else {
      console.log('🔧 DEBUG: WebSocket should be disconnected');
    }
  }, [auth.isAuthenticated, auth.authToken, auth.telegramUser]);

// Автоматическое подключение WebSocket после авторизации
useEffect(() => {
  if (auth.isAuthenticated && auth.authToken && auth.telegramUser && gameWebSocket && !gameWebSocket.isConnected) {
    console.log('🚀 GameProvider: Auto-connecting WebSocket after auth');
    gameWebSocket.connect();
  }
}, [auth.isAuthenticated, auth.authToken, auth.telegramUser]);

// Принудительное обновление при изменении auth
useEffect(() => {
  console.log('🔄 GameProvider FORCE UPDATE:', {
    authChanged: Date.now(),
    isAuthenticated: auth.isAuthenticated,
    hasToken: !!auth.authToken,
    hasUser: !!auth.telegramUser
  });
}, [auth.isAuthenticated, auth.authToken, auth.telegramUser]);

/*
// Обработка WebSocket сообщений
useEffect(() => {
   if (gameWebSocket?.socket) {
    console.log('🔧 DEBUG: Adding WebSocket listener in GameProvider');
    const handleMessage = (event: MessageEvent) => {
      try {
        const message: WebSocketResponse = JSON.parse(event.data);
        console.log('📨 GameProvider received message:', message);

        // Обработка игровых сообщений (НЕ authenticated - это уже обработано в LoginPage)
      } catch (error) {
        console.error('❌ GameProvider message parse error:', error);
      }
    };

    gameWebSocket.socket.addEventListener('message', handleMessage);

    return () => {
      gameWebSocket.socket?.removeEventListener('message', handleMessage);
    };
  }
}, [gameWebSocket?.socket, gameWebSocket?.isConnected]);

/*
  // ===== УПРАВЛЕНИЕ ОШИБКАМИ =====

  /**
   * Добавление ошибки в историю
   */
  const addError = (error: GameError) => {
    setErrors(prev => {
      const newErrors = [error, ...prev];
      return newErrors.slice(0, MAX_ERRORS_HISTORY);
    });
  };

  /**
   * Очистка истории ошибок
   */
  const clearErrors = () => {
    setErrors([]);
  };

  /**
   * Централизованная очистка ошибок
   */
  const clearError = () => {
    gameWebSocket?.clearError();
    gameState.clearError();
    roomManager.clearError();
  };

  // ===== УПРАВЛЕНИЕ СОСТОЯНИЯМИ ЗАГРУЗКИ =====

  /**
   * Обновление состояния загрузки
   */
  const updateLoadingState = (key: keyof typeof LOADING_STATES_DEFAULT, value: boolean) => {
    setLoadingStates(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // ===== РАСШИРЕННЫЕ МЕТОДЫ =====

  /**
   * Аутентификация с обновлением состояния загрузки
   */
  const authenticate = async (): Promise<boolean> => {
    updateLoadingState('authenticating', true);
    try {
      const result = await auth.authenticate();
      return result;
    } finally {
      updateLoadingState('authenticating', false);
    }
  };

  /**
   * Подключение с обновлением состояния загрузки
   */
  const connect = async (): Promise<void> => {
    updateLoadingState('connecting', true);
    try {
      await gameWebSocket?.connect?.();
    } finally {
      updateLoadingState('connecting', false);
    }
  };

  /**
   * Создание комнаты с обновлением состояния
   */
  const createRoom = async (
    name: string, 
    rules: import('@shared/types').GameRules, 
    isPrivate = false
  ): Promise<void> => {
    updateLoadingState('joiningRoom', true);
    try {
      await roomManager.createRoom(name, rules, isPrivate);
    } finally {
      updateLoadingState('joiningRoom', false);
    }
  };

  /**
   * Присоединение к комнате с обновлением состояния
   */
  const joinRoom = async (roomId: string): Promise<void> => {
    updateLoadingState('joiningRoom', true);
    try {
      await roomManager.joinRoom(roomId);
    } finally {
      updateLoadingState('joiningRoom', false);
    }
  };

  /**
   * Запуск игры с обновлением состояния
   */
  const startGame = async (): Promise<void> => {
    updateLoadingState('startingGame', true);
    try {
      await roomManager.startGame();
    } finally {
      updateLoadingState('startingGame', false);
    }
  };

  /**
   * Игровое действие с обновлением состояния
   */
  const makeGameAction = async (action: import('@shared/types').GameAction): Promise<void> => {
    updateLoadingState('makingAction', true);
    try {
      await gameState.makeGameAction(action);
    } finally {
      updateLoadingState('makingAction', false);
    }
  };

  // ===== АВТОМАТИЧЕСКОЕ ОТСЛЕЖИВАНИЕ ОШИБОК =====

  useEffect(() => {
    if (auth.error) {
      addError({
        type: 'auth',
        message: auth.error,
        timestamp: new Date()
      });
    }
  }, [auth.error]);

  useEffect(() => {
    if (gameWebSocket?.error) {
      addError({
        type: 'websocket',
        message: gameWebSocket.error,
        timestamp: new Date()
      });
    }
  }, [gameWebSocket?.error]);

  useEffect(() => {
    if (gameState.error) {
      addError({
        type: 'game',
        message: gameState.error,
        timestamp: new Date()
      });
    }
  }, [gameState.error]);

  useEffect(() => {
    if (roomManager.error) {
      addError({
        type: 'room',
        message: roomManager.error,
        timestamp: new Date()
      });
    }
  }, [roomManager.error]);

  // ===== МЕМОИЗИРОВАННОЕ ЗНАЧЕНИЕ КОНТЕКСТА =====

  const contextValue: GameContextType = useMemo(() => {
    // Вычисление общего состояния загрузки
    const isLoading = Object.values(loadingStates).some(Boolean) ||
      auth.isLoading ||
      gameState.isLoading ||
      roomManager.isLoading;

    // Определение основной ошибки для отображения
    const primaryError = auth.error || 
      gameWebSocket?.error || 
      gameState.error || 
      roomManager.error;

    return {
      // WebSocket состояние
      socket: gameWebSocket?.socket ?? null,
      isConnected: gameWebSocket?.isConnected || false,
      connectionStatus: gameWebSocket?.connectionStatus || 'disconnected',
      
      // Аутентификация
      telegramUser: auth.telegramUser,
      isAuthenticated: auth.isAuthenticated,
      authToken: auth.authToken,
      currentPlayer: auth.currentPlayer,
      
      // Игровое состояние
      gameState: gameState.gameState,
      
      // Комнаты
      rooms: roomManager.rooms,
      currentRoom: roomManager.currentRoom,
      autoStartInfo: roomManager.autoStartInfo,
      
      // Уведомления и ошибки
      notification: roomManager.notification,
      error: primaryError,
      errors,
      
      // Состояния загрузки
      isLoading,
      loadingStates,
      
      // Методы аутентификации
      authenticate,
      logout: auth.logout,
      
      // WebSocket методы
      connect,
      disconnect: gameWebSocket?.disconnect,
      clearError,
      
      // Игровые методы
      makeGameAction,
      
      // Методы управления комнатами
      createRoom,
      joinRoom,
      leaveRoom: roomManager.leaveRoom,
      setReady: roomManager.setReady,
      startGame,
      refreshRooms: roomManager.refreshRooms,
      
      // Утилиты
      clearNotification: roomManager.clearNotification,
      addError,
      clearErrors
    };
  }, [
    // Auth зависимости
      auth.telegramUser,
      auth.isAuthenticated, 
      auth.authToken,
      auth.currentPlayer,
      auth.error,
      auth.isLoading,
      auth.logout,
    
    // WebSocket зависимости
    gameWebSocket?.socket,
    gameWebSocket?.isConnected,
    gameWebSocket?.connectionStatus,
    gameWebSocket?.error,
    gameWebSocket?.disconnect,
    gameWebSocket?.clearError,
    
    // Game state зависимости
    gameState.gameState,
    gameState.error,
    gameState.isLoading,
    gameState.clearError,
    
    // Room manager зависимости
    roomManager.rooms,
    roomManager.currentRoom,
    roomManager.autoStartInfo,
    roomManager.notification,
    roomManager.error,
    roomManager.isLoading,
    roomManager.leaveRoom,
    roomManager.setReady,
    roomManager.refreshRooms,
    roomManager.clearNotification,
    roomManager.clearError,
    
    // Локальные состояния
    errors,
    loadingStates,
    
    // Методы
    authenticate,
    connect,
    createRoom,
    joinRoom,
    startGame,
    makeGameAction,
    clearError,
    addError,
    clearErrors
  ]);

  // ===== ОБРАБОТКА ОШИБОК ПРОВАЙДЕРА =====

  try {
    return (
      <GameContext.Provider value={contextValue}>
        {children}
      </GameContext.Provider>
    );
  } catch (error) {
    console.error('GameProvider error:', error);
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Ошибка инициализации игры</h2>
        <p>Попробуйте перезагрузить страницу</p>
        <button onClick={() => window.location.reload()}>
          Перезагрузить
        </button>
      </div>
    );
  }
};

// ===== ХУК ДЛЯ ИСПОЛЬЗОВАНИЯ КОНТЕКСТА =====

/**
 * Хук для использования игрового контекста
 */
export const useGame = (): GameContextType => {
  const context = useContext(GameContext);
  
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  
  return context;
};

// ===== ЭКСПОРТ ДОПОЛНИТЕЛЬНЫХ ТИПОВ =====
export type { GameProviderProps };
