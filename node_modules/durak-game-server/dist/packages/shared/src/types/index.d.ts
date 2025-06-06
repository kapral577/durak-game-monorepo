export interface Card {
    id: string;
    suit: '♠' | '♥' | '♦' | '♣';
    rank: '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';
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
export interface TableCard {
    attack: Card;
    defense?: Card;
}
export interface GameState {
    id: string;
    roomId: string;
    phase: 'attack' | 'defend' | 'discard' | 'finished';
    players: Player[];
    deck: Card[];
    table: TableCard[];
    trump: Card | null;
    trumpSuit: Card['suit'] | null;
    currentPlayerId: string;
    currentAttackerIndex: number;
    currentDefenderIndex: number;
    turn: number;
    gameMode: 'classic' | 'transferable';
    throwingMode: 'standard' | 'smart';
    maxPlayers: number;
    winner?: Player;
    createdAt: number;
    updatedAt: number;
}
export interface GameRules {
    gameMode: GameState['gameMode'];
    throwingMode: GameState['throwingMode'];
    cardCount: 6 | 8 | 10;
    maxPlayers: 2 | 3 | 4 | 5 | 6;
}
export interface Room {
    id: string;
    name: string;
    players: Player[];
    maxPlayers: number;
    rules: GameRules;
    status: 'waiting' | 'playing' | 'finished';
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
    telegramUser: any;
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
    stats: any;
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
}
export declare const CARD_SUITS: readonly ["♠", "♥", "♦", "♣"];
export declare const CARD_RANKS: readonly ["6", "7", "8", "9", "10", "J", "Q", "K", "A"];
export declare const GAME_MODES: readonly ["classic", "transferable"];
export declare const THROWING_MODES: readonly ["standard", "smart"];
export declare const ROOM_STATUSES: readonly ["waiting", "playing", "finished"];
export declare const GAME_PHASES: readonly ["attack", "defend", "discard", "finished"];
//# sourceMappingURL=index.d.ts.map