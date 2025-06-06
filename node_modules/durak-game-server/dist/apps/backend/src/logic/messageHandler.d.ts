import { WebSocket } from 'ws';
import { TelegramUser } from '@shared/types';
import { RoomManager } from './RoomManager';
declare const roomManager: RoomManager;
interface AuthenticatedSocket extends WebSocket {
    playerId?: string;
    telegramUser?: TelegramUser;
    isAuthenticated?: boolean;
    authTimeout?: NodeJS.Timeout;
}
export declare function messageHandler(socket: AuthenticatedSocket, message: string): void;
export { roomManager };
export declare function setupAuthTimeout(socket: AuthenticatedSocket): void;
export declare function cleanupSocket(socket: AuthenticatedSocket): void;
//# sourceMappingURL=messageHandler.d.ts.map