export interface Card {
  suit: '♠' | '♥' | '♦' | '♣';
  rank: '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';
}

export interface Player {
  id: string;
  name: string;
  hand: Card[];
  isReady: boolean;
  telegramId?: number;
  avatar?: string;
}

export interface TableCard {
  attack: Card;
  defense?: Card;
}

export interface GameState {
  roomId: string;
  phase: 'waiting' | 'playing' | 'finished';
  players: Player[];
  deck: Card[];
  table: TableCard[];
  trumpCard: Card | null;
  trumpSuit: Card['suit'] | null;
  currentAttackerIndex: number;
  currentDefenderIndex: number;
  turn: number;
  gameMode: 'classic' | 'transferable' | 'smart';
  throwingMode: 'none' | 'all' | 'neighbors';
  maxPlayers: number;
  winner?: string;
}

export interface Rules {
  gameMode: GameState['gameMode'];
  throwingMode: GameState['throwingMode'];
  cardCount: 6 | 8 | 10;
  maxPlayers: number;
}

export interface RoomInfo {
  id: string;
  name: string;
  players: Player[];
  maxPlayers: number;
  rules: Rules;
  status: 'waiting' | 'playing' | 'finished';
  createdAt: string;
}

export type GameAction = 
  | { type: 'attack'; card: Card; playerId: string }
  | { type: 'defend'; card: Card; attackCard: Card; playerId: string }
  | { type: 'take'; playerId: string }
  | { type: 'pass'; playerId: string }
  | { type: 'throw'; card: Card; playerId: string };

export type WebSocketMessage = 
  | { type: 'create_room'; name: string; rules: Rules }
  | { type: 'join_room'; roomId: string }
  | { type: 'leave_room'; roomId: string }
  | { type: 'set_ready'; roomId: string }
  | { type: 'start_game'; roomId: string }
  | { type: 'game_action'; roomId: string; action: GameAction }
  | { type: 'get_rooms' }
  | { type: 'heartbeat' };

export type WebSocketResponse = 
  | { type: 'room_created'; room: RoomInfo }
  | { type: 'room_joined'; room: RoomInfo; player: Player }
  | { type: 'room_left'; roomId: string }
  | { type: 'player_joined'; player: Player; room: RoomInfo }
  | { type: 'player_left'; playerId: string; room: RoomInfo }
  | { type: 'player_ready'; playerId: string; room: RoomInfo }
  | { type: 'game_started'; gameState: GameState }
  | { type: 'game_updated'; gameState: GameState }
  | { type: 'game_ended'; winner: string; gameState: GameState }
  | { type: 'rooms_list'; rooms: RoomInfo[] }
  | { type: 'error'; message: string }
  | { type: 'heartbeat_response' };