// src/context/GameProvider.tsx - ИСПРАВЛЕННАЯ ВЕРСИЯ ДЛЯ АВТОСТАРТА
import React, { createContext, useContext, useReducer, useEffect, useCallback, ReactNode } from 'react';
import { TelegramAuth } from '../utils/TelegramAuth';

// ✅ РАСШИРЕННЫЕ ТИПЫ ДЛЯ АВТОСТАРТА
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
  gameState: any | null;
  currentPlayer: any | null;
  
  // Комнаты
  rooms: any[];
  currentRoom: any | null;
  
  // ✅ НОВЫЕ ПОЛЯ ДЛЯ АВТОСТАРТА
  autoStartInfo: {
    readyCount: number;
    totalCount: number;
    allReady: boolean;
    canStartGame: boolean;
    needMorePlayers: boolean;
    isAutoStarting: boolean;
    countdown: number;
  } | null;
  
  // Ошибки и уведомления
  error: string | null;
  notification: string | null;
} // ✅ ИСПРАВЛЕНО: добавлена закрывающая скобка

interface GameContextType extends GameContextState {
  sendMessage: (message: any) => void;
  connect: () => void;
  disconnect: () => void;
  clearError: () => void;
  clearNotification: () => void;
  authenticate: () => Promise<boolean>; // ✅ ИСПРАВЛЕНО: добавлен тип boolean
  createRoom: (name: string, rules: any) => void;
  joinRoom: (roomId: string) => void;
  leaveRoom: () => void;
  setReady: () => void;
  startGame: () => void;
  makeGameAction: (action: any) => void;
} // ✅ ИСПРАВЛЕНО: добавлена закрывающая скобка

interface GameProviderProps {
  children: ReactNode;
} // ✅ ИСПРАВЛЕНО: добавлена закрывающая скобка

// ✅ РАСШИРЕННЫЙ REDUCER С АВТОСТАРТ ЛОГИКОЙ
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
    case 'SET_CURRENT_ROOM':
      return { ...state, currentRoom: action.room };
    case 'SET_ROOMS':
      return { ...state, rooms: action.rooms };
    case 'SET_GAME_STATE':
      return { ...state, gameState: action.gameState };
    case 'SET_ERROR':
      return { ...state, error: action.error };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    case 'SET_NOTIFICATION':
      return { ...state, notification: action.notification };
    case 'CLEAR_NOTIFICATION':
      return { ...state, notification: null };
    
    // ✅ НОВЫЕ ACTIONS ДЛЯ АВТОСТАРТА
    case 'SET_AUTO_START_INFO':
      return { 
        ...state, 
        autoStartInfo: action.autoStartInfo,
        notification: action.notification || state.notification
      };
    case 'CLEAR_AUTO_START_INFO':
      return { ...state, autoStartInfo: null };
    case 'SET_AUTO_START_COUNTDOWN':
      return { 
        ...state, 
        autoStartInfo: state.autoStartInfo ? {
          ...state.autoStartInfo,
          countdown: action.countdown,
          isAutoStarting: action.countdown > 0
        } : null
      };
    
    default:
      return state;
  } // ✅ ИСПРАВЛЕНО: добавлена закрывающая скобка
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
  autoStartInfo: null,
  error: null,
  notification: null,
};

const GameContext = createContext<GameContextType | undefined>(undefined); // ✅ ИСПРАВЛЕНО: добавлен тип

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
      } // ✅ ИСПРАВЛЕНО: добавлена закрывающая скобка
      
      dispatch({ type: 'SET_ERROR', error: 'Приложение должно запускаться из Telegram' });
      return;
    } // ✅ ИСПРАВЛЕНО: добавлена закрывающая скобка

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
    } // ✅ ИСПРАВЛЕНО: добавлена закрывающая скобка
  }, []);

  // ✅ АВТОСТАРТ COUNTDOWN СИСТЕМА
  useEffect(() => {
    let countdownInterval: NodeJS.Timeout;
    
    if (state.autoStartInfo?.isAutoStarting && state.autoStartInfo.countdown > 0) {
      countdownInterval = setInterval(() => {
        dispatch({ 
          type: 'SET_AUTO_START_COUNTDOWN', 
          countdown: state.autoStartInfo!.countdown - 1 
        });
      }, 1000);
    } // ✅ ИСПРАВЛЕНО: добавлена закрывающая скобка
    
    return () => {
      if (countdownInterval) {
        clearInterval(countdownInterval);
      } // ✅ ИСПРАВЛЕНО: добавлена закрывающая скобка
    };
  }, [state.autoStartInfo?.isAutoStarting, state.autoStartInfo?.countdown]);

  // ✅ HEARTBEAT СИСТЕМА
  useEffect(() => {
    let heartbeatInterval: NodeJS.Timeout;
    
    if (state.socket && state.isConnected) {
      heartbeatInterval = setInterval(() => {
        if (state.socket?.readyState === WebSocket.OPEN) {
          state.socket.send(JSON.stringify({ type: 'heartbeat' }));
          console.log('💓 Heartbeat sent');
        } // ✅ ИСПРАВЛЕНО: добавлена закрывающая скобка
      }, 30000);
    } // ✅ ИСПРАВЛЕНО: добавлена закрывающая скобка
    
    return () => {
      if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
      } // ✅ ИСПРАВЛЕНО: добавлена закрывающая скобка
    };
  }, [state.socket, state.isConnected]);

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
      } // ✅ ИСПРАВЛЕНО: добавлена закрывающая скобка
    } catch (error) {
      console.error('Authentication error:', error);
      dispatch({ type: 'SET_ERROR', error: 'Ошибка подключения к серверу' });
      return false;
    } // ✅ ИСПРАВЛЕНО: добавлена закрывающая скобка
  }, [state.telegramUser]);

  const connect = useCallback(async () => {
    if (!state.isAuthenticated) {
      dispatch({ type: 'SET_ERROR', error: 'Необходима аутентификация' });
      return;
    } // ✅ ИСПРАВЛЕНО: добавлена закрывающая скобка

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

      // ✅ ПОЛНАЯ ОБРАБОТКА ВСЕХ СООБЩЕНИЙ С АВТОСТАРТОМ
      socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log('Received message:', message);
          
          switch (message.type) {
            case 'room_created':
              console.log('✅ Room created successfully:', message.room);
              dispatch({ type: 'SET_CURRENT_ROOM', room: message.room });
              dispatch({ type: 'SET_ERROR', error: null });
              
              // ✅ КРИТИЧЕСКИ ВАЖНО ДЛЯ АВТОПЕРЕНАПРАВЛЕНИЯ
              window.dispatchEvent(new CustomEvent('room-created', { 
                detail: { room: message.room } 
              }));
              break;
              
            case 'room_joined':
              console.log('✅ Joined room:', message.room);
              dispatch({ type: 'SET_CURRENT_ROOM', room: message.room });
              dispatch({ type: 'CLEAR_AUTO_START_INFO' });
              break;
              
            case 'rooms_list':
              console.log('📋 Rooms list received:', message.rooms);
              dispatch({ type: 'SET_ROOMS', rooms: message.rooms || [] });
              break;
              
            case 'player_joined':
              // ✅ ДОБАВЛЕНЫ ДИАГНОСТИЧЕСКИЕ ЛОГИ
              console.log('👤 Player joined:', message.player);
              
              console.log('🔍 GameProvider player_joined debug:', {
                hasCurrentRoom: !!state.currentRoom,
                hasMessageRoom: !!message.room,
                currentRoomId: state.currentRoom?.id,
                messageRoomId: message.room?.id,
                currentRoomPlayers: state.currentRoom?.players?.length,
                messageRoomPlayers: message.room?.players?.length,
                conditionPasses: !!(state.currentRoom && message.room)
              });
              
              if (state.currentRoom && message.room) {
                console.log('✅ Condition passed, dispatching SET_CURRENT_ROOM');
                console.log('📊 Before dispatch - currentRoom players:', state.currentRoom.players?.length);
                console.log('📊 Message room players:', message.room.players?.length);
                
                dispatch({ type: 'SET_CURRENT_ROOM', room: message.room });
                dispatch({ type: 'SET_NOTIFICATION', notification: `👋 ${message.player.name} присоединился к игре!` });
                
                console.log('✅ Dispatched SET_CURRENT_ROOM and notification');
              } else {
                console.log('❌ Condition failed - NOT dispatching SET_CURRENT_ROOM');
                console.log('❌ state.currentRoom:', state.currentRoom);
                console.log('❌ message.room:', message.room);
              }
              break;
              
            case 'player_left':
              console.log('👤 Player left:', message.playerId);
              if (state.currentRoom && message.room) {
                dispatch({ type: 'SET_CURRENT_ROOM', room: message.room });
                dispatch({ type: 'CLEAR_AUTO_START_INFO' });
                dispatch({ type: 'SET_NOTIFICATION', notification: `👋 Игрок покинул комнату` });
              } // ✅ ИСПРАВЛЕНО: добавлена закрывающая скобка
              break;

            // ✅ РАСШИРЕННАЯ ОБРАБОТКА ГОТОВНОСТИ С АВТОСТАРТОМ
            case 'player_ready_changed':
              console.log('🔄 Player ready changed:', message.playerId, message.isReady);
              if (state.currentRoom && message.room) {
                dispatch({ type: 'SET_CURRENT_ROOM', room: message.room });
                
                // ✅ ОБНОВЛЯЕМ ИНФОРМАЦИЮ ОБ АВТОСТАРТЕ
                const autoStartInfo = {
                  readyCount: message.readyCount || 0,
                  totalCount: message.totalCount || 0,
                  allReady: message.allReady || false,
                  canStartGame: message.canStartGame || false,
                  needMorePlayers: message.needMorePlayers || false,
                  isAutoStarting: false,
                  countdown: 0
                };

                let notification = null;
                if (message.canStartGame) {
                  notification = `🎮 Все игроки готовы! Игра запускается...`;
                  autoStartInfo.isAutoStarting = true;
                  autoStartInfo.countdown = 3; // 3 секунды countdown
                } else if (message.needMorePlayers) {
                  notification = `👥 Ожидаем больше игроков (${message.totalCount}/2)`;
                } else {
                  notification = `⏳ Готовы: ${message.readyCount}/${message.totalCount} игроков`;
                }

                dispatch({ 
                  type: 'SET_AUTO_START_INFO', 
                  autoStartInfo,
                  notification
                });
              } // ✅ ИСПРАВЛЕНО: добавлена закрывающая скобка
              break;

            case 'player_reconnected':
              console.log('🔄 Player reconnected:', message.player);
              if (state.currentRoom && message.room) {
                dispatch({ type: 'SET_CURRENT_ROOM', room: message.room });
                dispatch({ type: 'SET_NOTIFICATION', notification: `🔄 ${message.player.name} переподключился!` });
              } // ✅ ИСПРАВЛЕНО: добавлена закрывающая скобка
              break;

            case 'player_disconnected':
              console.log('🔌 Player disconnected:', message.playerId);
              if (state.currentRoom && message.room) {
                dispatch({ type: 'SET_CURRENT_ROOM', room: message.room });
                dispatch({ type: 'CLEAR_AUTO_START_INFO' });
                dispatch({ type: 'SET_NOTIFICATION', notification: `🔌 Игрок отключился` });
              } // ✅ ИСПРАВЛЕНО: добавлена закрывающая скобка
              break;

            case 'heartbeat_response':
              console.log('💓 Heartbeat response received');
              break;
              
            // ✅ РАСШИРЕННАЯ ОБРАБОТКА СТАРТА ИГРЫ
            case 'game_started':
              console.log('🎮 Game started');
              if (message.gameState) {
                dispatch({ type: 'SET_GAME_STATE', gameState: message.gameState });
              } // ✅ ИСПРАВЛЕНО: добавлена закрывающая скобка
              
              dispatch({ type: 'CLEAR_AUTO_START_INFO' });
              
              if (message.autoStarted) {
                dispatch({ 
                  type: 'SET_NOTIFICATION', 
                  notification: `🎉 ${message.message || 'Игра началась автоматически!'}` 
                });
              } else {
                dispatch({ 
                  type: 'SET_NOTIFICATION', 
                  notification: `🎮 Игра началась!` 
                });
              } // ✅ ИСПРАВЛЕНО: добавлена закрывающая скобка
              break;
              
            case 'error':
              console.log('❌ Server error:', message.message);
              dispatch({ type: 'SET_ERROR', error: message.message });
              
              window.dispatchEvent(new CustomEvent('room-error', { 
                detail: { error: message.message } 
              }));
              break;

            case 'info':
              console.log('ℹ️ Server info:', message.message);
              dispatch({ type: 'SET_NOTIFICATION', notification: message.message });
              break;
              
            case 'authenticated':
              console.log('✅ WebSocket authenticated');
              dispatch({ type: 'SET_AUTH_TOKEN', token: message.token });
              dispatch({ type: 'SET_CURRENT_PLAYER', player: message.player });
              break;
              
            default:
              console.log('❓ Unknown message type:', message.type);
          } // ✅ ИСПРАВЛЕНО: добавлена закрывающая скобка
          
        } catch (error) {
          console.error('Error parsing message:', error);
        } // ✅ ИСПРАВЛЕНО: добавлена закрывающая скобка
      };

      // ✅ AUTO-RECONNECT ЛОГИКА
      socket.onclose = (event) => {
        console.log(`🔌 WebSocket closed: ${event.code} ${event.reason}`);
        dispatch({ type: 'SET_CONNECTION_STATUS', status: 'disconnected' });
        dispatch({ type: 'SET_SOCKET', socket: null });
        dispatch({ type: 'CLEAR_AUTO_START_INFO' });
        
        if (event.code !== 1000) {
          console.log('🔄 Attempting to reconnect in 3 seconds...');
          setTimeout(() => {
            if (state.isAuthenticated) {
              connect();
            } // ✅ ИСПРАВЛЕНО: добавлена закрывающая скобка
          }, 3000);
        } // ✅ ИСПРАВЛЕНО: добавлена закрывающая скобка
      };

      socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        dispatch({ type: 'SET_CONNECTION_STATUS', status: 'error' });
      };

    } catch (error) {
      console.error('[GameProvider] Failed to create WebSocket:', error);
      dispatch({ type: 'SET_CONNECTION_STATUS', status: 'error' });
      dispatch({ type: 'SET_ERROR', error: 'Не удалось подключиться к серверу' });
    } // ✅ ИСПРАВЛЕНО: добавлена закрывающая скобка
  }, [state.isAuthenticated, state.authToken, state.telegramUser, authenticate]);

  const sendMessage = useCallback((message: any) => {
    if (state.socket && state.socket.readyState === WebSocket.OPEN) {
      state.socket.send(JSON.stringify(message));
    } // ✅ ИСПРАВЛЕНО: добавлена закрывающая скобка
  }, [state.socket]);

  const disconnect = useCallback(() => {
    if (state.socket) {
      state.socket.close();
    } // ✅ ИСПРАВЛЕНО: добавлена закрывающая скобка
  }, [state.socket]);

  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  const clearNotification = useCallback(() => {
    dispatch({ type: 'CLEAR_NOTIFICATION' });
  }, []);

  const createRoom = useCallback((name: string, rules: any) => {
    sendMessage({ type: 'create_room', name, rules });
  }, [sendMessage]);

  const joinRoom = useCallback((roomId: string) => {
    sendMessage({ type: 'join_room', roomId });
  }, [sendMessage]);

  const leaveRoom = useCallback(() => {
    sendMessage({ type: 'leave_room' });
    dispatch({ type: 'CLEAR_AUTO_START_INFO' });
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
    clearNotification,
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
  } // ✅ ИСПРАВЛЕНО: добавлена закрывающая скобка
  return context;
};
