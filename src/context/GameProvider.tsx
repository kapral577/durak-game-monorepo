// src/context/GameProvider.tsx - ФРОНТЕНД - ОБНОВЛЕНО с аутентификацией
import React, { createContext, useContext, useReducer, useEffect, useCallback, ReactNode } from 'react';
import { GameState, Player, RoomInfo, WebSocketMessage, WebSocketResponse } from '../../shared/types';
import { TelegramAuth } from '../utils/TelegramAuth';

interface GameContextState {
  // WebSocket состояние
  socket: WebSocket | null;
  isConnected: boolean;
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error';
  
  // Аутентификация
  telegramUser: any | null;
  isAuthenticated: boolean;
  authToken: string | null;
  
  // Игровое состояние
  gameState: GameState | null;
  currentPlayer: Player | null;
  
  // Комнаты
  rooms: RoomInfo[];
  currentRoom: RoomInfo | null;
  
  // Ошибки
  error: string | null;
}

// ... остальные типы ...

const initialState: GameContextState = {
  socket: null,
  isConnected: false,
  connectionStatus: 'disconnected',
  telegramUser: null,
  isAuthenticated: false,
  authToken: null,
  gameState: null,
  currentPlayer: null,
  rooms: [],
  currentRoom: null,
  error: null,
};

export const GameProvider: React.FC<GameProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  // Инициализация Telegram WebApp
  useEffect(() => {
    TelegramAuth.initTelegramApp();
    
    // Получаем данные пользователя Telegram
    let telegramUser = TelegramAuth.getTelegramUser();
    
    // Для разработки - используем фейкового пользователя
    if (!telegramUser && process.env.NODE_ENV === 'development') {
      telegramUser = TelegramAuth.getMockUser();
    }

    if (telegramUser) {
      dispatch({ type: 'SET_TELEGRAM_USER', user: telegramUser });
      dispatch({ type: 'SET_AUTHENTICATED', isAuthenticated: true });
    } else {
      dispatch({ type: 'SET_ERROR', error: 'Приложение должно запускаться из Telegram' });
    }
  }, []);

  const authenticate = useCallback(async () => {
    if (!state.telegramUser) return false;

    try {
      const initData = TelegramAuth.getTelegramInitData();
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/telegram`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          initData,
          user: state.telegramUser 
        }),
      });

      if (response.ok) {
        const { token, player } = await response.json();
        dispatch({ type: 'SET_AUTH_TOKEN', token });
        dispatch({ type: 'SET_CURRENT_PLAYER', player });
        return true;
      } else {
        dispatch({ type: 'SET_ERROR', error: 'Ошибка аутентификации' });
        return false;
      }
    } catch (error) {
      console.error('Authentication error:', error);
      dispatch({ type: 'SET_ERROR', error: 'Ошибка подключения к серверу' });
      return false;
    }
  }, [state.telegramUser]);

  const connect = useCallback(async () => {
    if (!state.isAuthenticated) {
      dispatch({ type: 'SET_ERROR', error: 'Необходима аутентификация' });
      return;
    }

    // Сначала аутентифицируемся
    const authSuccess = await authenticate();
    if (!authSuccess) return;

    if (state.socket?.readyState === WebSocket.OPEN) return;

    dispatch({ type: 'SET_CONNECTION_STATUS', status: 'connecting' });

    try {
      const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:3001';
      const socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        console.log('[GameProvider] WebSocket connected');
        
        // Отправляем токен аутентификации при подключении
        socket.send(JSON.stringify({ 
          type: 'authenticate', 
          token: state.authToken,
          telegramUser: state.telegramUser
        }));

        dispatch({ type: 'SET_CONNECTION_STATUS', status: 'connected' });
        dispatch({ type: 'SET_SOCKET', socket });
        dispatch({ type: 'SET_ERROR', error: null });

        // Запрашиваем список комнат
        socket.send(JSON.stringify({ type: 'get_rooms' }));
      };

      // ... остальная логика WebSocket ...

    } catch (error) {
      console.error('[GameProvider] Failed to create WebSocket:', error);
      dispatch({ type: 'SET_CONNECTION_STATUS', status: 'error' });
      dispatch({ type: 'SET_ERROR', error: 'Не удалось подключиться к серверу' });
    }
  }, [state.isAuthenticated, state.authToken, state.telegramUser, authenticate]);

  // ... остальные методы ...

  const contextValue: GameContextType = {
    ...state,
    sendMessage,
    connect,
    disconnect,
    clearError,
    authenticate,
    createRoom,
    joinRoom,
    leaveRoom,
    setReady,
    startGame,
    makeGameAction,
  };

  return (
    <GameContext.Provider value={contextValue}>
      {children}
    </GameContext.Provider>
  );
};
