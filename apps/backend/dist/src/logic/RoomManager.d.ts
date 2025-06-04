import { WebSocket } from 'ws';
import { GameRules, TelegramUser, GameAction } from '@shared/types';
export declare class RoomManager {
    private rooms;
    private playerRooms;
    private socketPlayerMap;
    private roomDeletionTimeouts;
    createRoom(name: string, rules: GameRules, socket: WebSocket, playerId: string, telegramUser: TelegramUser): string;
    joinRoom(roomId: string, socket: WebSocket, playerId: string, telegramUser: TelegramUser): void;
    leaveRoom(socket: WebSocket, playerId: string): void;
    setPlayerReady(socket: WebSocket, playerId: string): void;
    private autoStartGame;
    handleGameAction(socket: WebSocket, playerId: string, action: GameAction): void;
    handleDisconnection(socket: WebSocket): void;
    handleHeartbeat(socket: WebSocket, playerId: string): void;
    sendRoomsList(socket: WebSocket): void;
    private broadcastRoomsList;
    private scheduleRoomDeletion;
    private sendError;
    getStats(): any;
    startGame(socket: WebSocket, playerId: string): void;
    handleMessage(socket: WebSocket, message: any): void;
}
//# sourceMappingURL=RoomManager.d.ts.map