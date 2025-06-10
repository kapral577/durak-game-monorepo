"use strict";
// durak-server/logic/Room.ts - РЕФАКТОРИРОВАННАЯ ВЕРСИЯ
Object.defineProperty(exports, "__esModule", { value: true });
exports.Room = void 0;
const ws_1 = require("ws");
class Room {
    constructor(id, name, rules, hostId) {
        this.players = new Map();
        this.sockets = new Map();
        this.gameState = null;
        this.id = id;
        this.name = name;
        this.rules = rules;
        this.maxPlayers = rules.maxPlayers; // ✅ ИСПРАВЛЕНО - берем из rules
        this.status = 'waiting';
        this.createdAt = new Date().toISOString();
        this.hostId = hostId;
    }
    /* ───────────── Управление игроками ───────────── */
    addPlayer(player, socket) {
        if (this.players.has(player.id)) {
            return false; // Игрок уже в комнате
        }
        if (this.players.size >= this.maxPlayers) {
            return false; // Комната полная
        }
        this.players.set(player.id, player);
        this.sockets.set(player.id, socket);
        if (process.env.NODE_ENV === 'development') {
            console.log(`➕ Player ${player.name} joined room ${this.id}`);
        }
        return true;
    }
    removePlayer(socket, playerId) {
        let removedPlayerId = null;
        if (playerId && this.players.has(playerId)) {
            removedPlayerId = playerId;
        }
        else {
            // Найти игрока по сокету
            for (const [id, sock] of this.sockets.entries()) {
                if (sock === socket) {
                    removedPlayerId = id;
                    break;
                }
            }
        }
        if (removedPlayerId) {
            this.players.delete(removedPlayerId);
            this.sockets.delete(removedPlayerId);
            if (process.env.NODE_ENV === 'development') {
                console.log(`➖ Player ${removedPlayerId} left room ${this.id}`);
            }
            return true;
        }
        return false;
    }
    disconnectPlayer(playerId) {
        const player = this.players.get(playerId);
        if (player) {
            player.isConnected = false;
            player.lastSeen = Date.now();
            this.sockets.delete(playerId);
        }
    }
    reconnectPlayer(playerId, socket) {
        const player = this.players.get(playerId);
        if (player) {
            player.isConnected = true;
            player.lastSeen = Date.now();
            this.sockets.set(playerId, socket);
        }
    }
    getPlayer(playerId) {
        return this.players.get(playerId);
    }
    getPlayerBySocket(socket) {
        for (const [playerId, sock] of this.sockets.entries()) {
            if (sock === socket) {
                return this.players.get(playerId);
            }
        }
        return undefined;
    }
    getPlayers() {
        return Array.from(this.players.values());
    }
    getConnectedPlayers() {
        return Array.from(this.players.values()).filter(p => p.isConnected !== false);
    }
    getPlayerCount() {
        return this.players.size;
    }
    hasPlayers() {
        return this.players.size > 0;
    }
    isFull() {
        return this.players.size >= this.maxPlayers;
    }
    /* ───────────── Готовность игроков ───────────── */
    markPlayerReady(playerId) {
        const player = this.players.get(playerId);
        if (player) {
            player.isReady = !player.isReady;
            if (process.env.NODE_ENV === 'development') {
                console.log(`🎯 Player ${player.name} ready status: ${player.isReady}`);
            }
        }
    }
    areAllPlayersReady() {
        const connectedPlayers = this.getConnectedPlayers();
        return connectedPlayers.length >= 2 && connectedPlayers.every(p => p.isReady);
    }
    /* ───────────── Игровое состояние ───────────── */
    setGameState(gameState) {
        this.gameState = gameState;
        this.status = 'playing';
    }
    getGameState() {
        return this.gameState;
    }
    endGame(winnerId) {
        this.gameState = null;
        this.status = 'finished';
        if (process.env.NODE_ENV === 'development') {
            console.log(`🏁 Game ended in room ${this.id}, winner: ${winnerId || 'none'}`);
        }
    }
    /* ───────────── Сообщения ───────────── */
    broadcast(message, excludeSocket) {
        const messageStr = typeof message === 'string' ? message : JSON.stringify(message);
        for (const socket of this.sockets.values()) {
            if (socket !== excludeSocket && socket.readyState === ws_1.WebSocket.OPEN) {
                try {
                    socket.send(messageStr);
                }
                catch (error) {
                    if (process.env.NODE_ENV === 'development') {
                        console.error('❌ Error broadcasting message:', error);
                    }
                }
            }
        }
    }
    sendToPlayer(playerId, message) {
        const socket = this.sockets.get(playerId);
        if (socket && socket.readyState === ws_1.WebSocket.OPEN) {
            try {
                const messageStr = typeof message === 'string' ? message : JSON.stringify(message);
                socket.send(messageStr);
                return true;
            }
            catch (error) {
                if (process.env.NODE_ENV === 'development') {
                    console.error(`❌ Error sending message to player ${playerId}:`, error);
                }
            }
        }
        return false;
    }
    /* ───────────── Публичная информация ───────────── */
    toPublicInfo() {
        return {
            id: this.id,
            name: this.name,
            players: this.getPlayers(),
            maxPlayers: this.maxPlayers,
            rules: this.rules,
            status: this.status,
            createdAt: this.createdAt,
            hostId: this.hostId,
        };
    }
}
exports.Room = Room;
//# sourceMappingURL=Room.js.map