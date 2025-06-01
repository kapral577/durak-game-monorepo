// shared/types.ts - ОБЩИЕ ТИПЫ ДЛЯ ФРОНТЕНДА И БЭКЕНДА
export interface Rules {
  gameMode: 'classic' | 'transferable';
  throwingMode: 'standard' | 'smart';
  cardCount: number;
  maxPlayers: number;
}

export interface Player {
  id: string;
  name: string;
  telegramId: number;
  username?: string;
  avatar?: string;
  isReady: boolean;
  isConnected?: boolean; // ✅ ДОБАВЛЕНО для решения disconnection проблемы
  lastSeen?: Date; // ✅ ДОБАВЛЕНО для отслеживания активности
}

export interface RoomInfo {
  id: string;
  name: string;
  players: Player[];
  maxPlayers: number;
  rules: Rules;
  status: 'waiting' | 'playing' | 'finished';
  createdAt: Date;
  hostId: string;
}

export interface GameState {
  // TODO: добавить игровое состояние
  currentPlayer?: string;
  phase?: 'attack' | 'defend' | 'discard';
}

// ✅ WEBSOCKET СООБЩЕНИЯ
export interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

export interface WebSocketResponse {
  type: string;
  success?: boolean;
  error?: string;
  [key: string]: any;
}

// ✅ НОВЫЕ ТИПЫ ДЛЯ HEARTBEAT
export interface HeartbeatMessage extends WebSocketMessage {
  type: 'heartbeat';
  timestamp: number;
}

export interface PlayerDisconnectedMessage extends WebSocketMessage {
  type: 'player_disconnected';
  playerId: string;
  room: RoomInfo;
}
