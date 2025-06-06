// packages/shared/src/types/index.ts - ЕДИНЫЙ ИСТОЧНИК ИСТИНЫ ДЛЯ ВСЕГО ПРОЕКТА

// ===== БАЗОВЫЕ ТИПЫ =====
export type SuitSymbol = '♠' | '♥' | '♦' | '♣';
export type CardRank = '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';
export type CardCount = 6 | 8 | 10;
export type PlayerCount = 2 | 3 | 4 | 5 | 6;

export interface Card {
  id: string; // ✅ ДОБАВЛЕНО для уникальной идентификации карт
  suit: SuitSymbol;
  rank: CardRank;
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
export type GamePhase = 'attack' | 'defend' | 'discard' | 'finished';
export type GameMode = 'classic' | 'transferable';
export type ThrowingMode = 'standard' | 'smart';
export type RoomStatus = 'waiting' | 'playing' | 'finished';

export interface TableCard {
  attack: Card;
  defense?: Card;
}

export interface GameState {
  id: string; // ✅ ДОБАВЛЕНО для уникальной идентификации игры
  roomId: string;
  phase: GamePhase; // ✅ ИСПРАВЛЕНО - добавлена фаза discard
  players: Player[];
  deck: Card[]; // ✅ ИСПРАВЛЕНО - Card[], не string[]
  table: TableCard[];
  trump: Card | null; // ✅ ПЕРЕИМЕНОВАНО для консистентности с frontend
  trumpSuit: SuitSymbol | null;
  currentPlayerId: string; // ✅ ПЕРЕИМЕНОВАНО для ясности
  currentAttackerIndex: number;
  currentDefenderIndex: number;
  turn: number;
  gameMode: GameMode;
  throwingMode: ThrowingMode; // ✅ ИСПРАВЛЕНО для соответствия frontend enum
  maxPlayers: PlayerCount;
  winner?: Player; // ✅ ИСПРАВЛЕНО - объект Player, не string
  createdAt: number; // ✅ ДОБАВЛЕНО timestamp
  updatedAt: number; // ✅ ДОБАВЛЕНО для отслеживания изменений
}

export interface GameRules {
  gameMode: GameMode;
  throwingMode: ThrowingMode;
  cardCount: CardCount;
  maxPlayers: PlayerCount; // ✅ УТОЧНЕНО допустимые значения
}

export interface Room {
  id: string;
  name: string;
  players: Player[];
  maxPlayers: PlayerCount;
  rules: GameRules; // ✅ ПЕРЕИМЕНОВАНО для консистентности
  status: RoomStatus;
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
  minPlayers: number; // ✅ ДОБАВЛЕНО для валидации
  maxPlayers: number; // ✅ ДОБАВЛЕНО для валидации
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
  | { type: 'authenticate'; token: string; telegramUser: TelegramUser } // ✅ ТИПИЗИРОВАНО
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
  | { type: 'server_stats'; stats: ServerStats } // ✅ ТИПИЗИРОВАНО
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
  memoryUsage?: {
    used: number;
    total: number;
  };
}

// ===== ОШИБКИ =====
export interface GameError {
  type: 'websocket' | 'auth' | 'game' | 'room' | 'validation';
  message: string;
  code?: string;
  timestamp: Date;
  details?: Record<string, any>;
}

// ===== КОНСТАНТЫ =====
export const CARD_SUITS: readonly SuitSymbol[] = ['♠', '♥', '♦', '♣'] as const;
export const CARD_RANKS: readonly CardRank[] = ['6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'] as const;
export const GAME_MODES: readonly GameMode[] = ['classic', 'transferable'] as const;
export const THROWING_MODES: readonly ThrowingMode[] = ['standard', 'smart'] as const;
export const ROOM_STATUSES: readonly RoomStatus[] = ['waiting', 'playing', 'finished'] as const;
export const GAME_PHASES: readonly GamePhase[] = ['attack', 'defend', 'discard', 'finished'] as const;
export const CARD_COUNTS: readonly CardCount[] = [6, 8, 10] as const;
export const PLAYER_COUNTS: readonly PlayerCount[] = [2, 3, 4, 5, 6] as const;

// ===== ВАЛИДАЦИОННЫЕ КОНСТАНТЫ =====
export const VALIDATION_RULES = {
  ROOM_NAME: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 50
  },
  PLAYER_NAME: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 30
  },
  CARD_COUNT: {
    ALLOWED: CARD_COUNTS
  },
  PLAYER_COUNT: {
    MIN: 2,
    MAX: 6,
    ALLOWED: PLAYER_COUNTS
  },
  AUTH_DATE: {
    MAX_AGE_HOURS: 24
  }
} as const;

// ===== КОНФИГУРАЦИОННЫЕ КОНСТАНТЫ =====
export const WEBSOCKET_CONFIG = {
  HEARTBEAT_INTERVAL: 30000,
  RECONNECT_DELAY: 3000,
  MAX_RECONNECT_ATTEMPTS: 5,
  CONNECTION_TIMEOUT: 10000
} as const;

export const GAME_CONFIG = {
  AUTO_START_COUNTDOWN: 10,
  TURN_TIMEOUT: 60000,
  MAX_CARDS_IN_ATTACK: 6
} as const;

// ===== UI КОНСТАНТЫ =====
export const UI_CONFIG = {
  CARD_WIDTH: 120,
  CARD_HEIGHT: 180,
  CARD_BORDER_RADIUS: 8,
  CARD_SHADOW: '0 2px 4px rgba(0,0,0,0.1)',
  ANIMATION_DURATION: 300,
  BOARD_PADDING: 20,
  HAND_SPACING: 10
} as const;

// ===== UI ТИПЫ =====
export type CardSize = 'small' | 'medium' | 'large';
export type SuitColor = 'red' | 'black';
// ===== УТИЛИТАРНЫЕ ТИПЫ =====
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';
export type LoadingState = boolean;
export type ErrorState = string | null;

// ===== ФУНКЦИОНАЛЬНЫЕ ТИПЫ =====
export type EventHandler<T = void> = (data: T) => void;
export type AsyncEventHandler<T = void> = (data: T) => Promise<void>;
export type ValidationResult = { isValid: boolean; errors: string[] };

// ===== ЭКСПОРТ ВСЕХ ТИПОВ ДЛЯ УДОБСТВА =====
export type {
  // Переэкспорт для удобства импорта
  Card as CardType,
  Player as PlayerType,
  GameState as GameStateType,
  Room as RoomType,
  GameAction as GameActionType,
  WebSocketMessage as WSMessage,
  WebSocketResponse as WSResponse
};
