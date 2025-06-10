import { WebSocket } from 'ws';
export type SuitSymbol = '♠' | '♥' | '♦' | '♣';
export type CardRank = '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';
export type CardCount = 6 | 8 | 10;
export type PlayerCount = 2 | 3 | 4 | 5 | 6;
export interface Card {
    id: string;
    suit: SuitSymbol;
    rank: CardRank;
}
export interface Player {
    id: string;
    name: string;
    hand: Card[];
    isReady: boolean;
    isConnected: boolean;
    lastSeen: number;
    telegramId?: number;
    username?: string;
    avatar?: string;
}
export interface ConnectedPlayer extends Player {
    socket: WebSocket;
}
export type GamePhase = 'attack' | 'defend' | 'discard' | 'finished';
export type GameMode = 'classic' | 'transferable';
export type ThrowingMode = 'standard' | 'smart';
export type RoomStatus = 'waiting' | 'playing' | 'finished';
export interface TableCard {
    attack: Card;
    defense?: Card;
}
export interface GameState {
    id: string;
    roomId: string;
    phase: GamePhase;
    players: Player[];
    deck: Card[];
    table: TableCard[];
    trump: Card | null;
    trumpSuit: SuitSymbol | null;
    currentPlayerId: string;
    currentAttackerIndex: number;
    currentDefenderIndex: number;
    turn: number;
    gameMode: GameMode;
    throwingMode: ThrowingMode;
    maxPlayers: PlayerCount;
    winner?: Player;
    createdAt: number;
    updatedAt: number;
}
export interface GameRules {
    gameMode: GameMode;
    throwingMode: ThrowingMode;
    cardCount: CardCount;
    maxPlayers: PlayerCount;
    minPlayers: PlayerCount;
}
export interface Room {
    id: string;
    name: string;
    players: Player[];
    maxPlayers: PlayerCount;
    rules: GameRules;
    status: RoomStatus;
    createdAt: string;
    hostId: string;
    isPrivate?: boolean;
    inviteCode?: string;
}
export interface AutoStartInfo {
    readyCount: number;
    totalCount: number;
    allReady: boolean;
    canStartGame: boolean;
    needMorePlayers: boolean;
    isAutoStarting: boolean;
    countdown: number;
    minPlayers: number;
    maxPlayers: number;
}
export type GameAction = {
    type: 'attack';
    cards: Card[];
    playerId: string;
} | {
    type: 'defend';
    card: Card;
    targetCard: Card;
    playerId: string;
} | {
    type: 'take';
    playerId: string;
} | {
    type: 'pass';
    playerId: string;
} | {
    type: 'throw';
    cards: Card[];
    playerId: string;
};
export type WebSocketMessage = {
    type: 'authenticate';
    token: string;
    telegramUser: TelegramUser;
} | {
    type: 'create_room';
    name: string;
    rules: GameRules;
    isPrivate?: boolean;
} | {
    type: 'join_room';
    roomId: string;
} | {
    type: 'leave_room';
} | {
    type: 'player_ready';
} | {
    type: 'start_game';
} | {
    type: 'game_action';
    action: GameAction;
} | {
    type: 'get_rooms';
} | {
    type: 'heartbeat';
} | {
    type: 'get_server_stats';
};
export type WebSocketResponse = {
    type: 'authenticated';
    player: Player;
} | {
    type: 'room_created';
    room: Room;
} | {
    type: 'room_joined';
    room: Room;
} | {
    type: 'room_left';
} | {
    type: 'room_updated';
    room: Room;
} | {
    type: 'player_joined_room';
    room: Room;
} | {
    type: 'player_left_room';
    room: Room;
} | {
    type: 'player_ready_changed';
    room: Room;
} | {
    type: 'auto_start_info';
    autoStartInfo: AutoStartInfo;
} | {
    type: 'auto_start_countdown';
    autoStartInfo: AutoStartInfo;
} | {
    type: 'game_started';
    gameState: GameState;
} | {
    type: 'game_updated';
    gameState: GameState;
} | {
    type: 'game_action_result';
    success: boolean;
    gameState?: GameState;
    error?: string;
} | {
    type: 'game_ended';
    winner: Player;
    gameState: GameState;
} | {
    type: 'player_disconnected';
    playerId: string;
} | {
    type: 'player_reconnected';
    playerId: string;
} | {
    type: 'rooms_list';
    rooms: Room[];
} | {
    type: 'server_stats';
    stats: ServerStats;
} | {
    type: 'error';
    error: string;
} | {
    type: 'heartbeat_response';
};
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
export interface GameError {
    type: 'websocket' | 'auth' | 'game' | 'room' | 'validation';
    message: string;
    code?: string;
    timestamp: Date;
    details?: Record<string, any>;
}
export declare const CARD_SUITS: readonly SuitSymbol[];
export declare const CARD_RANKS: readonly CardRank[];
export declare const GAME_MODES: readonly GameMode[];
export declare const THROWING_MODES: readonly ThrowingMode[];
export declare const ROOM_STATUSES: readonly RoomStatus[];
export declare const GAME_PHASES: readonly GamePhase[];
export declare const CARD_COUNTS: readonly CardCount[];
export declare const PLAYER_COUNTS: readonly PlayerCount[];
export declare const VALIDATION_RULES: {
    readonly ROOM_NAME: {
        readonly MIN_LENGTH: 3;
        readonly MAX_LENGTH: 50;
    };
    readonly PLAYER_NAME: {
        readonly MIN_LENGTH: 2;
        readonly MAX_LENGTH: 30;
    };
    readonly CARD_COUNT: {
        readonly ALLOWED: readonly CardCount[];
    };
    readonly PLAYER_COUNT: {
        readonly MIN: 2;
        readonly MAX: 6;
        readonly ALLOWED: readonly PlayerCount[];
    };
    readonly AUTH_DATE: {
        readonly MAX_AGE_HOURS: 24;
    };
};
export declare const WEBSOCKET_CONFIG: {
    readonly HEARTBEAT_INTERVAL: 30000;
    readonly RECONNECT_DELAY: 3000;
    readonly MAX_RECONNECT_ATTEMPTS: 5;
    readonly CONNECTION_TIMEOUT: 10000;
};
export declare const GAME_CONFIG: {
    readonly AUTO_START_COUNTDOWN: 10;
    readonly TURN_TIMEOUT: 60000;
    readonly MAX_CARDS_IN_ATTACK: 6;
};
export declare const UI_CONFIG: {
    readonly CARD_WIDTH: 120;
    readonly CARD_HEIGHT: 180;
    readonly CARD_BORDER_RADIUS: 8;
    readonly CARD_SHADOW: "0 2px 4px rgba(0,0,0,0.1)";
    readonly ANIMATION_DURATION: 300;
    readonly BOARD_PADDING: 20;
    readonly HAND_SPACING: 10;
};
export type CardSize = 'small' | 'medium' | 'large';
export type SuitColor = 'red' | 'black';
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';
export type LoadingState = boolean;
export type ErrorState = string | null;
export type EventHandler<T = void> = (data: T) => void;
export type AsyncEventHandler<T = void> = (data: T) => Promise<void>;
export type ValidationResult = {
    isValid: boolean;
    errors: string[];
};
export type { Card as CardType, Player as PlayerType, GameState as GameStateType, Room as RoomType, GameAction as GameActionType, WebSocketMessage as WSMessage, WebSocketResponse as WSResponse };
//# sourceMappingURL=index.d.ts.map