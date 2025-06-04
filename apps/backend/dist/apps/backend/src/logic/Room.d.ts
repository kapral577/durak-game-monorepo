import { WebSocket } from 'ws';
import { GameState, Player, GameRules, Room as RoomType } from '@shared/types';
export declare class Room {
    id: string;
    name: string;
    rules: GameRules;
    maxPlayers: number;
    status: 'waiting' | 'playing' | 'finished';
    createdAt: string;
    hostId: string;
    private players;
    private sockets;
    private gameState;
    constructor(id: string, name: string, rules: GameRules, hostId: string);
    addPlayer(player: Player, socket: WebSocket): boolean;
    removePlayer(socket: WebSocket, playerId?: string): boolean;
    disconnectPlayer(playerId: string): void;
    reconnectPlayer(playerId: string, socket: WebSocket): void;
    getPlayer(playerId: string): Player | undefined;
    getPlayerBySocket(socket: WebSocket): Player | undefined;
    getPlayers(): Player[];
    getConnectedPlayers(): Player[];
    getPlayerCount(): number;
    hasPlayers(): boolean;
    isFull(): boolean;
    markPlayerReady(playerId: string): void;
    areAllPlayersReady(): boolean;
    setGameState(gameState: GameState): void;
    getGameState(): GameState | null;
    endGame(winnerId?: string): void;
    broadcast(message: any, excludeSocket?: WebSocket): void;
    sendToPlayer(playerId: string, message: any): boolean;
    toPublicInfo(): RoomType;
}
//# sourceMappingURL=Room.d.ts.map