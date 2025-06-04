// src/context/GameProvider.tsx - РЕФАКТОРИРОВАННАЯ ВЕРСИЯ

import React, { createContext, useContext, ReactNode } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import { useAuth } from '../hooks/useAuth';
import { useGameState } from '../hooks/useGameState';
import { useRoomManager } from '../hooks/useRoomManager';
import { 
  Player, 
  GameState, 
  Room, 
  WebSocketMessage 
} from '../shared/types';

// ===== ТИПЫ =====
interface GameContextState {
  // WebSocket состояние
  socket: WebSocket | null;
  isConnected: boolean;
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error';
  
  // Аутентификация
  telegramUser: Player | null;
  isAuthenticated: boolean;
  authToken: string | null;
  
  // Игровое состояние
  gameState: GameState | null;
  currentPlayer: Player | null;
  
  // Комнаты
  rooms: Room[];
  currentRoom: Room | null;
  
  // Автостарт система
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
}

interface GameContextType extends GameContextState {
  // WebSocket методы
  sendMessage: (message: WebSocketMessage) => void;
  connect: () => void;
  disconnect: () => void;
  
  // Управление состоянием
  clearError: () => void;
  clearNotification: () => void;
  
  // Аутентификация
  authenticate: () => Promise<boolean>;
  
  // Игровые действия
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

// ===== КОНТЕКСТ =====
const GameContext = createContext<GameContextType | undefined>(undefined);

// ===== ПРОВАЙДЕР =====
export const GameProvider: React.FC<GameProviderProps> = ({ children }) => {
  // Используем разделенные хуки
  const auth = useAuth();
  const webSocket = useWebSocket(auth.authToken, auth.telegramUser);
  const gameState = useGameState(webSocket.socket);
  const roomManager = useRoomManager(webSocket.socket);

  // Объединяем состояние
  const contextValue: GameContextType = {
    // WebSocket состояние
    socket: webSocket.socket,
    isConnected: webSocket.isConnected,
    connectionStatus: webSocket.connectionStatus,
    
    // Аутентификация
    telegramUser: auth.telegramUser,
    isAuthenticated: auth.isAuthenticated,
    authToken: auth.authToken,
    
    // Игровое состояние
    gameState: gameState.gameState,
    currentPlayer: auth.currentPlayer,
    
    // Комнаты
    rooms: roomManager.rooms,
    currentRoom: roomManager.currentRoom,
    autoStartInfo: roomManager.autoStartInfo,
    
    // Ошибки и уведомления
    error: webSocket.error || auth.error || gameState.error || roomManager.error,
    notification: roomManager.notification,
    
    // Методы
    sendMessage: webSocket.sendMessage,
    connect: webSocket.connect,
    disconnect: webSocket.disconnect,
    clearError: webSocket.clearError,
    clearNotification: roomManager.clearNotification,
    authenticate: auth.authenticate,
    createRoom: roomManager.createRoom,
    joinRoom: roomManager.joinRoom,
    leaveRoom: roomManager.leaveRoom,
    setReady: roomManager.setReady,
    startGame: roomManager.startGame,
    makeGameAction: gameState.makeGameAction,
  };

  return (
    <GameContext.Provider value={contextValue}>
      {children}
    </GameContext.Provider>
  );
};

// ===== ХУКИ =====
export const useGame = (): GameContextType => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};
