// shared/types.ts - ОБЩИЕ ТИПЫ ДЛЯ ФРОНТЕНДА И БЭКЕНДА

export interface Rules {
  gameMode: 'classic' | 'transferable';
  throwingMode: 'standard' | 'smart';
  cardCount: number;
  maxPlayers: number;
} // ✅ ИСПРАВЛЕНО: добавлена закрывающая скобка

export interface Player {
  id: string;
  name: string;
  telegramId: number;
  username?: string;
  avatar?: string;
  isReady: boolean;
  isConnected?: boolean; // ✅ ДОБАВЛЕНО для решения disconnection проблемы
  lastSeen?: Date; // ✅ ДОБАВЛЕНО для отслеживания активности
} // ✅ ИСПРАВЛЕНО: добавлена закрывающая скобка

export interface RoomInfo {
  id: string;
  name: string;
  players: Player[];
  maxPlayers: number;
  rules: Rules;
  status: 'waiting' | 'playing' | 'finished';
  createdAt: Date;
  hostId: string;
} // ✅ ИСПРАВЛЕНО: добавлена закрывающая скобка

// ✅ WEBSOCKET СООБЩЕНИЯ
export interface WebSocketMessage {
  type: string;
  [key: string]: any;
} // ✅ ИСПРАВЛЕНО: добавлена закрывающая скобка

export interface WebSocketResponse {
  type: string;
  success?: boolean;
  error?: string;
  [key: string]: any;
} // ✅ ИСПРАВЛЕНО: добавлена закрывающая скобка

// ✅ НОВЫЕ ТИПЫ ДЛЯ HEARTBEAT
export interface HeartbeatMessage extends WebSocketMessage {
  type: 'heartbeat';
  timestamp: number;
} // ✅ ИСПРАВЛЕНО: добавлена закрывающая скобка

export interface PlayerDisconnectedMessage extends WebSocketMessage {
  type: 'player_disconnected';
  playerId: string;
  room: RoomInfo;
} // ✅ ИСПРАВЛЕНО: добавлена закрывающая скобка

// ✅ КАРТА
export interface Card {
  suit: '♠' | '♥' | '♦' | '♣';
  rank: '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';
  id: string;
} // ✅ ИСПРАВЛЕНО: добавлена закрывающая скобка

// ✅ ИГРОВОЕ ДЕЙСТВИЕ
export interface GameAction {
  type: 'play_card' | 'defend' | 'take_cards' | 'pass_turn';
  playerId: string;
  card?: Card;
  cards?: Card[];
  targetPlayerId?: string;
  timestamp: number;
} // ✅ ИСПРАВЛЕНО: добавлена закрывающая скобка

// ✅ ИГРОВОЕ СОСТОЯНИЕ
export interface GameState {
  status: 'waiting' | 'playing' | 'finished';
  roomId: string;
  players: Player[];
  currentPlayer?: string;
  phase?: 'attack' | 'defend' | 'discard';
  deck?: Card[];
  trumpCard?: Card;
  table?: {
    attackCards: Card[];
    defendCards: Card[];
  };
  playerHands?: { [playerId: string]: Card[] };
  startedAt?: number;
  autoStarted?: boolean;
  rules?: Rules;
} // ✅ ИСПРАВЛЕНО: добавлена закрывающая скобка
