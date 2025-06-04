// shared/types/index.ts - ЕДИНЫЙ ИСТОЧНИК ИСТИНЫ ДЛЯ ВСЕГО ПРОЕКТА

// ===== БАЗОВЫЕ ТИПЫ =====
export interface Card {
  id: string; // ✅ ДОБАВЛЕНО для уникальной идентификации карт
  suit: '♠' | '♥' | '♦' | '♣';
  rank: '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';
}

export interface Player {
  id: string;
  name: string;
  hand: Card[]; // ✅ ИСПРАВЛЕНО - везде Card[], не string[]
  isReady: boolean;
  isConnected: boolean; // ✅ ДОБАВЛЕНО для отслеживания соединения
  lastSeen: number; // ✅ ДОБАВЛЕНО для heartbeat системы
  telegramId?: number;
  username?: string; // ✅ ДОБАВЛЕНО для Telegram username
  avatar?: string;
}

// ===== СЕРВЕРНЫЕ РАСШИРЕНИЯ =====
export interface ConnectedPlayer extends Player {
  socket: WebSocket; // ✅ Серверная специфика
}

// ===== ИГРОВЫЕ ТИПЫ =====
export interface TableCard {
  attack: Card;
  defense?: Card;
}

export interface GameState {
  id: string; // ✅ ДОБАВЛЕНО для уникальной идентификации игры
  roomId: string;
  phase: 'attack' | 'defend' | 'discard' | 'finished'; // ✅ ИСПРАВЛЕНО - добавлена фаза discard
  players: Player[];
  deck: Card[]; // ✅ ИСПРАВЛЕНО - Card[], не string[]
  table: TableCard[];
  trump: Card | null; // ✅ ПЕРЕИМЕНОВАНО для консистентности с frontend
  trumpSuit: Card['suit'] | null;
  currentPlayerId: string; // ✅ ПЕРЕИМЕНОВАНО для ясности
  currentAttackerIndex: number;
  currentDefenderIndex: number;
  turn: number;
  gameMode: 'classic' | 'transferable';
  throwingMode: 'standard' | 'smart'; // ✅ ИСПРАВЛЕНО для соответствия frontend enum
  maxPlayers: number;
  winner?: Player; // ✅ ИСПРАВЛЕНО - объект Player, не string
  createdAt: number; // ✅ ДОБАВЛЕНО timestamp
  updatedAt: number; // ✅ ДОБАВЛЕНО для отслеживания изменений
}

export interface GameRules {
  gameMode: GameState['gameMode'];
  throwingMode: GameState['throwingMode'];
  cardCount: 6 | 8 | 10;
  maxPlayers: 2 | 3 | 4 | 5 | 6; // ✅ УТОЧНЕНО допустимые значения
}

export interface Room {
  id: string;
  name: string;
  players: Player[];
  maxPlayers: number;
  rules: GameRules; // ✅ ПЕРЕИМЕНОВАНО для консистентности
  status: 'waiting' | 'playing' | 'finished';
  createdAt: string;
  hostId: string; // ✅ ДОБАВЛЕНО для определения хоста комнаты
  isPrivate?: boolean; // ✅ ДОБАВЛЕНО для приватных комнат
  inviteCode?: string; // ✅ ДОБАВЛЕНО для приглашений
}

// ===== АВТОСТАРТ СИСТЕМА =====
export interface AutoStartInfo {
  readyCount: number;
  totalCount: number;
  allReady: boolean;
  canStartGame: boolean;
  needMorePlayers: boolean;
  isAutoStarting: boolean;
  countdown: number;
}

// ===== ИГРОВЫЕ ДЕЙСТВИЯ =====
export type GameAction =
  | { type: 'attack'; cards: Card[]; playerId: string } // ✅ ИСПРАВЛЕНО - множественные карты
  | { type: 'defend'; card: Card; targetCard: Card; playerId: string } // ✅ ПЕРЕИМЕНОВАНО для ясности
  | { type: 'take'; playerId: string }
  | { type: 'pass'; playerId: string }
  | { type: 'throw'; cards: Card[]; playerId: string }; // ✅ ИСПРАВЛЕНО - множественные карты

// ===== WEBSOCKET СООБЩЕНИЯ =====
export type WebSocketMessage =
  | { type: 'authenticate'; token: string; telegramUser: any } // ✅ ДОБАВЛЕНО для аутентификации
  | { type: 'create_room'; name: string; rules: GameRules; isPrivate?: boolean }
  | { type: 'join_room'; roomId: string }
  | { type: 'leave_room' }
  | { type: 'player_ready' } // ✅ УПРОЩЕНО - roomId берется из контекста
  | { type: 'start_game' }
  | { type: 'game_action'; action: GameAction }
  | { type: 'get_rooms' }
  | { type: 'heartbeat' }
  | { type: 'get_server_stats' }; // ✅ ДОБАВЛЕНО для мониторинга

export type WebSocketResponse =
  | { type: 'authenticated'; player: Player }
  | { type: 'room_created'; room: Room }
  | { type: 'room_joined'; room: Room }
  | { type: 'room_left' }
  | { type: 'room_updated'; room: Room } // ✅ ДОБАВЛЕНО для обновлений комнаты
  | { type: 'player_joined_room'; room: Room }
  | { type: 'player_left_room'; room: Room }
  | { type: 'player_ready_changed'; room: Room }
  | { type: 'auto_start_info'; autoStartInfo: AutoStartInfo } // ✅ ДОБАВЛЕНО
  | { type: 'auto_start_countdown'; autoStartInfo: AutoStartInfo } // ✅ ДОБАВЛЕНО
  | { type: 'game_started'; gameState: GameState }
  | { type: 'game_updated'; gameState: GameState }
  | { type: 'game_action_result'; success: boolean; gameState?: GameState; error?: string }
  | { type: 'game_ended'; winner: Player; gameState: GameState }
  | { type: 'player_disconnected'; playerId: string }
  | { type: 'player_reconnected'; playerId: string }
  | { type: 'rooms_list'; rooms: Room[] }
  | { type: 'server_stats'; stats: any } // ✅ ДОБАВЛЕНО
  | { type: 'error'; error: string } // ✅ ПЕРЕИМЕНОВАНО для консистентности
  | { type: 'heartbeat_response' };

// ===== TELEGRAM ТИПЫ =====
export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
}

export interface TelegramInitData {
  user?: TelegramUser;
  auth_date: number;
  hash: string;
  query_id?: string;
}

// ===== УТИЛИТЫ =====
export interface ServerStats {
  connectedClients: number;
  totalRooms: number;
  activeGames: number;
  uptime: number;
  version: string;
}

// ===== КОНСТАНТЫ =====
export const CARD_SUITS = ['♠', '♥', '♦', '♣'] as const;
export const CARD_RANKS = ['6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'] as const;
export const GAME_MODES = ['classic', 'transferable'] as const;
export const THROWING_MODES = ['standard', 'smart'] as const;
export const ROOM_STATUSES = ['waiting', 'playing', 'finished'] as const;
export const GAME_PHASES = ['attack', 'defend', 'discard', 'finished'] as const;
