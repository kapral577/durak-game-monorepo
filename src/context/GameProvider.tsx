// src/context/GameProvider.tsx - ПОЛНОЕ ИСПРАВЛЕНИЕ ОБРАБОТКИ WEBSOCKET
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

interface GameContextType extends GameContextState {
  sendMessage: (message: any) => void;
  connect: () => void;
  disconnect: () => void;
  clearError: () => void;
  authenticate: () => Promise<boolean>;
  createRoom: (name: string, rules: any) => void;
  joinRoom: (roomId: string) => void;
  leaveRoom: () => void;
  setReady: () => void;
  startGame: () => void;
  makeGameAction: (action: any) => void;
}

interface GameProviderProps {
  children: ReactNode;
}

// ✅ ИСПРАВЛЕН REDUCER - добавлены новые actions
function gameReducer(state: GameContextState, action: any): GameContextState {
  switch (action.type) {
    case 'SET_SOCKET':
      return { ...state, socket: action.socket };
    case 'SET_CONNECTION_STATUS':
      return { ...state, connectionStatus: action.status, isConnected: action.status === 'connected' };
    case 'SET_TELEGRAM_USER':
      return { ...state, telegramUser: action.user };
    case 'SET_AUTHENTICATED':
      return { ...state, isAuthenticated: action.isAuthenticated };
    case 'SET_AUTH_TOKEN':
      return { ...state, authToken: action.token };
    case 'SET_CURRENT_PLAYER':
      return { ...state, currentPlayer: action.player };
    case 'SET_CURRENT_ROOM':  // ✅ ДОБАВЛЕНО
      return { ...state, currentRoom: action.room };
    case 'SET_ROOMS':  // ✅ ДОБАВЛЕНО
      return { ...state, rooms: action.rooms };
    case 'SET_GAME_STATE':  // ✅ ДОБАВЛЕНО
      return { ...state, gameState: action.gameState };
    case 'SET_ERROR':
      return { ...state, error: action.error };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
}

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

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<GameProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  useEffect(() => {
    console.log('🔍 Initializing GameProvider...');
    
    TelegramAuth.initTelegramApp();
    
    if (!TelegramAuth.isInTelegram()) {
      console.log('❌ Not in Telegram environment');
      
      if (process.env.NODE_ENV === 'development') {
        console.log('🧪 Development mode: using mock user');
        const mockUser = TelegramAuth.getMockUser();
        dispatch({ type: 'SET_TELEGRAM_USER', user: mockUser });
        dispatch({ type: 'SET_AUTHENTICATED', isAuthenticated: true });
        
        setTimeout(() => {
          console.log('🔌 Auto-connecting in development...');
          connect();
        }, 1000);
        return;
      }
      
      dispatch({ type: 'SET_ERROR', error: 'Приложение должно запускаться из Telegram' });
      return;
    }

    let telegramUser = TelegramAuth.getTelegramUser();

    if (telegramUser) {
      console.log('✅ Telegram user authenticated:', telegramUser);
      dispatch({ type: 'SET_TELEGRAM_USER', user: telegramUser });
      dispatch({ type: 'SET_AUTHENTICATED', isAuthenticated: true });
      
      setTimeout(() => {
        console.log('🔌 Auto-connecting to server...');
        connect();
      }, 1000);
    } else {
      console.log('❌ No Telegram user data');
      dispatch({ type: 'SET_ERROR', error: 'Не удалось получить данные пользователя из Telegram' });
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

    const authSuccess = await authenticate();
    if (!authSuccess) return;

    if (state.socket?.readyState === WebSocket.OPEN) return;

    dispatch({ type: 'SET_CONNECTION_STATUS', status: 'connecting' });

    try {
      const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:3001';
      console.log('🔌 Connecting to:', wsUrl);
      const socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        console.log('[GameProvider] WebSocket connected');
        
        socket.send(JSON.stringify({ 
          type: 'authenticate', 
          token: state.authToken,
          telegramUser: state.telegramUser
        }));

        dispatch({ type: 'SET_CONNECTION_STATUS', status: 'connected' });
        dispatch({ type: 'SET_SOCKET', socket });
        dispatch({ type: 'SET_ERROR', error: null });

        socket.send(JSON.stringify({ type: 'get_rooms' }));
      };

      // ✅ ИСПРАВЛЕНА ОБРАБОТКА СООБЩЕНИЙ - ПОЛНАЯ РЕАЛИЗАЦИЯ
      socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log('Received message:', message);
          
          // ✅ ОБРАБОТКА ВСЕХ ТИПОВ СООБЩЕНИЙ
          switch (message.type) {
            case 'room_created':
              console.log('✅ Room created successfully:', message.room);
              dispatch({ type: 'SET_CURRENT_ROOM', room: message.room });
              dispatch({ type: 'SET_ERROR', error: null });
              
              // ✅ УВЕДОМЛЯЕМ КОМПОНЕНТЫ О СОЗДАНИИ КОМНАТЫ
              window.dispatchEvent(new CustomEvent('room-created', { 
                detail: { room: message.room } 
              }));
              break;
              
            case 'room_joined':
              console.log('✅ Joined room:', message.room);
              dispatch({ type: 'SET_CURRENT_ROOM', room: message.room });
              break;
              
            case 'rooms_list':
              console.log('📋 Rooms list received:', message.rooms);
              dispatch({ type: 'SET_ROOMS', rooms: message.rooms || [] });
              break;
              
            case 'player_joined':
              console.log('👤 Player joined:', message.player);
              if (state.currentRoom && message.room) {
                dispatch({ type: 'SET_CURRENT_ROOM', room: message.room });
              }
              break;
              
            case 'player_left':
              console.log('👤 Player left:', message.playerId);
              if (state.currentRoom && message.room) {
                dispatch({ type: 'SET_CURRENT_ROOM', room: message.room });
              }
              break;
              
            case 'game_started':
              console.log('🎮 Game started');
              if (message.gameState) {
                dispatch({ type: 'SET_GAME_STATE', gameState: message.gameState });
              }
              break;
              
            case 'error':
              console.log('❌ Server error:', message.message);
              dispatch({ type: 'SET_ERROR', error: message.message });
              
              // ✅ УВЕДОМЛЯЕМ КОМПОНЕНТЫ ОБ ОШИБКЕ
              window.dispatchEvent(new CustomEvent('room-error', { 
                detail: { error: message.message } 
              }));
              break;
              
            case 'authenticated':
              console.log('✅ WebSocket authenticated');
              dispatch({ type: 'SET_AUTH_TOKEN', token: message.token });
              dispatch({ type: 'SET_CURRENT_PLAYER', player: message.player });
              break;
              
            default:
              console.log('❓ Unknown message type:', message.type);
          }
          
        } catch (error) {
          console.error('Error parsing message:', error);
        }
      };

      socket.onclose = () => {
        dispatch({ type: 'SET_CONNECTION_STATUS', status: 'disconnected' });
        dispatch({ type: 'SET_SOCKET', socket: null });
      };

      socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        dispatch({ type: 'SET_CONNECTION_STATUS', status: 'error' });
      };

    } catch (error) {
      console.error('[GameProvider] Failed to create WebSocket:', error);
      dispatch({ type: 'SET_CONNECTION_STATUS', status: 'error' });
      dispatch({ type: 'SET_ERROR', error: 'Не удалось подключиться к серверу' });
    }
  }, [state.isAuthenticated, state.authToken, state.telegramUser, authenticate]);

  const sendMessage = useCallback((message: any) => {
    if (state.socket && state.socket.readyState === WebSocket.OPEN) {
      state.socket.send(JSON.stringify(message));
    }
  }, [state.socket]);

  const disconnect = useCallback(() => {
    if (state.socket) {
      state.socket.close();
    }
  }, [state.socket]);

  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  const createRoom = useCallback((name: string, rules: any) => {
    sendMessage({ type: 'create_room', name, rules });
  }, [sendMessage]);

  const joinRoom = useCallback((roomId: string) => {
    sendMessage({ type: 'join_room', roomId });
  }, [sendMessage]);

  const leaveRoom = useCallback(() => {
    sendMessage({ type: 'leave_room' });
  }, [sendMessage]);

  const setReady = useCallback(() => {
    sendMessage({ type: 'set_ready' });
  }, [sendMessage]);

  const startGame = useCallback(() => {
    sendMessage({ type: 'start_game' });
  }, [sendMessage]);

  const makeGameAction = useCallback((action: any) => {
    sendMessage({ type: 'game_action', action });
  }, [sendMessage]);

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

export const useGame = (): GameContextType => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};
