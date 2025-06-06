"use strict";
// durak-server/logic/RoomManager.ts - РЕФАКТОРИРОВАННАЯ ВЕРСИЯ
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoomManager = void 0;
const uuid_1 = require("uuid");
const ws_1 = require("ws");
const startGame_1 = require("./startGame");
// ===== КОНСТАНТЫ =====
const EMPTY_ROOM_TIMEOUT = 30000; // 30 секунд
const ALL_DISCONNECTED_TIMEOUT = 60000; // 60 секунд
const AUTO_START_DELAY = 1500; // 1.5 секунды для UI
// ===== ROOM CLASS =====
class Room {
    constructor(id, name, rules, hostId, isPrivate = false) {
        this.players = new Map();
        this.sockets = new Map();
        this.status = 'waiting';
        this.id = id;
        this.name = name;
        this.rules = rules;
        this.maxPlayers = rules.maxPlayers;
        this.createdAt = new Date().toISOString();
        this.hostId = hostId;
        this.isPrivate = isPrivate;
    }
    addPlayer(player, socket) {
        if (this.players.size >= this.maxPlayers) {
            return false;
        }
        this.players.set(player.id, player);
        this.sockets.set(player.id, socket);
        return true;
    }
    removePlayer(playerId) {
        this.players.delete(playerId);
        this.sockets.delete(playerId);
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
    areAllPlayersReady() {
        const connectedPlayers = Array.from(this.players.values()).filter(p => p.isConnected);
        return connectedPlayers.length >= 2 && connectedPlayers.every(p => p.isReady);
    }
    getConnectedPlayers() {
        return Array.from(this.players.values()).filter(p => p.isConnected);
    }
    broadcast(message, excludeSocket) {
        const messageStr = JSON.stringify(message);
        this.sockets.forEach((socket, playerId) => {
            if (socket !== excludeSocket && socket.readyState === ws_1.WebSocket.OPEN) {
                try {
                    socket.send(messageStr);
                }
                catch (error) {
                    if (process.env.NODE_ENV === 'development') {
                        console.error(`Failed to send message to player ${playerId}:`, error);
                    }
                }
            }
        });
    }
    toPublicInfo() {
        return {
            id: this.id,
            name: this.name,
            players: Array.from(this.players.values()),
            maxPlayers: this.maxPlayers,
            rules: this.rules,
            status: this.status,
            createdAt: this.createdAt,
            hostId: this.hostId,
            isPrivate: this.isPrivate,
        };
    }
}
// ===== ROOM MANAGER CLASS =====
class RoomManager {
    constructor() {
        this.rooms = new Map();
        this.playerRooms = new Map();
        this.socketPlayerMap = new Map();
        this.roomDeletionTimeouts = new Map();
    }
    createRoom(name, rules, socket, playerId, telegramUser) {
        const roomId = (0, uuid_1.v4)();
        const room = new Room(roomId, name, rules, playerId);
        this.rooms.set(roomId, room);
        this.socketPlayerMap.set(socket, playerId);
        const hostPlayer = {
            id: playerId,
            name: `${telegramUser.first_name}${telegramUser.last_name ? ` ${telegramUser.last_name}` : ''}`,
            hand: [],
            isReady: false,
            isConnected: true,
            lastSeen: Date.now(),
            telegramId: telegramUser.id,
            username: telegramUser.username,
        };
        room.addPlayer(hostPlayer, socket);
        this.playerRooms.set(playerId, roomId);
        socket.send(JSON.stringify({
            type: 'room_created',
            room: room.toPublicInfo(),
        }));
        this.broadcastRoomsList();
        return roomId;
    }
    joinRoom(roomId, socket, playerId, telegramUser) {
        const room = this.rooms.get(roomId);
        if (!room) {
            this.sendError(socket, 'Комната не найдена');
            return;
        }
        if (room.status !== 'waiting') {
            this.sendError(socket, 'Игра уже началась');
            return;
        }
        // Проверяем переподключение
        const existingPlayer = room.players.get(playerId);
        if (existingPlayer) {
            room.reconnectPlayer(playerId, socket);
            this.socketPlayerMap.set(socket, playerId);
            socket.send(JSON.stringify({
                type: 'room_joined',
                room: room.toPublicInfo()
            }));
            room.broadcast({
                type: 'player_reconnected',
                playerId,
                room: room.toPublicInfo()
            });
            this.broadcastRoomsList();
            return;
        }
        // Новый игрок
        const player = {
            id: playerId,
            name: `${telegramUser.first_name}${telegramUser.last_name ? ` ${telegramUser.last_name}` : ''}`,
            hand: [],
            isReady: false,
            isConnected: true,
            lastSeen: Date.now(),
            telegramId: telegramUser.id,
            username: telegramUser.username,
        };
        if (!room.addPlayer(player, socket)) {
            this.sendError(socket, 'Комната заполнена');
            return;
        }
        this.playerRooms.set(playerId, roomId);
        this.socketPlayerMap.set(socket, playerId);
        socket.send(JSON.stringify({
            type: 'room_joined',
            room: room.toPublicInfo()
        }));
        room.broadcast({
            type: 'player_joined_room',
            room: room.toPublicInfo()
        });
        this.broadcastRoomsList();
    }
    leaveRoom(socket, playerId) {
        const roomId = this.playerRooms.get(playerId);
        if (!roomId)
            return;
        const room = this.rooms.get(roomId);
        if (!room)
            return;
        room.removePlayer(playerId);
        this.playerRooms.delete(playerId);
        this.socketPlayerMap.delete(socket);
        socket.send(JSON.stringify({ type: 'room_left' }));
        if (room.players.size === 0) {
            this.scheduleRoomDeletion(roomId, EMPTY_ROOM_TIMEOUT);
        }
        else {
            room.broadcast({
                type: 'player_left_room',
                room: room.toPublicInfo()
            });
        }
        this.broadcastRoomsList();
    }
    setPlayerReady(socket, playerId) {
        const roomId = this.playerRooms.get(playerId);
        if (!roomId)
            return;
        const room = this.rooms.get(roomId);
        if (!room)
            return;
        const player = room.players.get(playerId);
        if (!player)
            return;
        player.isReady = !player.isReady;
        const connectedPlayers = room.getConnectedPlayers();
        const readyPlayers = connectedPlayers.filter(p => p.isReady);
        const autoStartInfo = {
            readyCount: readyPlayers.length,
            totalCount: connectedPlayers.length,
            allReady: readyPlayers.length === connectedPlayers.length,
            canStartGame: connectedPlayers.length >= 2 && readyPlayers.length === connectedPlayers.length,
            needMorePlayers: connectedPlayers.length < 2,
            isAutoStarting: false,
            countdown: 0,
        };
        room.broadcast({
            type: 'player_ready_changed',
            room: room.toPublicInfo()
        });
        room.broadcast({
            type: 'auto_start_info',
            autoStartInfo
        });
        // Автоматический старт
        if (autoStartInfo.canStartGame) {
            this.autoStartGame(room, autoStartInfo);
        }
    }
    autoStartGame(room, autoStartInfo) {
        // Отправляем countdown
        autoStartInfo.isAutoStarting = true;
        autoStartInfo.countdown = Math.ceil(AUTO_START_DELAY / 1000);
        room.broadcast({
            type: 'auto_start_countdown',
            autoStartInfo
        });
        setTimeout(() => {
            // Проверяем что все еще готовы
            const connectedPlayers = room.getConnectedPlayers();
            const readyPlayers = connectedPlayers.filter(p => p.isReady);
            if (connectedPlayers.length >= 2 &&
                readyPlayers.length === connectedPlayers.length &&
                room.status === 'waiting') {
                try {
                    room.status = 'playing';
                    const gameState = (0, startGame_1.startGame)({
                        roomId: room.id,
                        rules: room.rules,
                        players: connectedPlayers
                    });
                    room.broadcast({
                        type: 'game_started',
                        gameState
                    });
                    this.broadcastRoomsList();
                }
                catch (error) {
                    if (process.env.NODE_ENV === 'development') {
                        console.error('Error starting game:', error);
                    }
                    room.status = 'waiting';
                    room.broadcast({
                        type: 'error',
                        error: 'Ошибка запуска игры'
                    });
                }
            }
        }, AUTO_START_DELAY);
    }
    handleGameAction(socket, playerId, action) {
        // TODO: Реализовать обработку игровых действий
        this.sendError(socket, 'Игровые действия пока не реализованы');
    }
    handleDisconnection(socket) {
        const playerId = this.socketPlayerMap.get(socket);
        if (!playerId)
            return;
        const roomId = this.playerRooms.get(playerId);
        if (!roomId)
            return;
        const room = this.rooms.get(roomId);
        if (!room)
            return;
        room.disconnectPlayer(playerId);
        this.socketPlayerMap.delete(socket);
        room.broadcast({
            type: 'player_disconnected',
            playerId
        });
        const allDisconnected = room.getConnectedPlayers().length === 0;
        if (allDisconnected && !this.roomDeletionTimeouts.has(roomId)) {
            this.scheduleRoomDeletion(roomId, ALL_DISCONNECTED_TIMEOUT);
        }
    }
    handleHeartbeat(socket, playerId) {
        const roomId = this.playerRooms.get(playerId);
        if (roomId) {
            const room = this.rooms.get(roomId);
            if (room) {
                const player = room.players.get(playerId);
                if (player) {
                    player.lastSeen = Date.now();
                    player.isConnected = true;
                }
            }
        }
        socket.send(JSON.stringify({
            type: 'heartbeat_response',
            timestamp: Date.now()
        }));
    }
    sendRoomsList(socket) {
        const roomsList = Array.from(this.rooms.values())
            .filter(room => room.status === 'waiting' && !room.isPrivate)
            .map(room => room.toPublicInfo());
        socket.send(JSON.stringify({
            type: 'rooms_list',
            rooms: roomsList
        }));
    }
    broadcastRoomsList() {
        const roomsList = Array.from(this.rooms.values())
            .filter(room => room.status === 'waiting' && !room.isPrivate)
            .map(room => room.toPublicInfo());
        const message = JSON.stringify({
            type: 'rooms_list',
            rooms: roomsList
        });
        this.socketPlayerMap.forEach((playerId, socket) => {
            if (socket.readyState === ws_1.WebSocket.OPEN) {
                try {
                    socket.send(message);
                }
                catch (error) {
                    // Игнорируем ошибки отправки
                }
            }
        });
    }
    scheduleRoomDeletion(roomId, timeout) {
        if (this.roomDeletionTimeouts.has(roomId)) {
            clearTimeout(this.roomDeletionTimeouts.get(roomId));
        }
        const timeoutId = setTimeout(() => {
            const room = this.rooms.get(roomId);
            if (room && (room.players.size === 0 || room.getConnectedPlayers().length === 0)) {
                this.rooms.delete(roomId);
                room.players.forEach((player) => {
                    this.playerRooms.delete(player.id);
                });
                this.broadcastRoomsList();
            }
            this.roomDeletionTimeouts.delete(roomId);
        }, timeout);
        this.roomDeletionTimeouts.set(roomId, timeoutId);
    }
    sendError(socket, error) {
        socket.send(JSON.stringify({
            type: 'error',
            error
        }));
    }
    getStats() {
        return {
            totalRooms: this.rooms.size,
            waitingRooms: Array.from(this.rooms.values()).filter(r => r.status === 'waiting').length,
            playingRooms: Array.from(this.rooms.values()).filter(r => r.status === 'playing').length,
            connectedPlayers: this.socketPlayerMap.size,
        };
    }
    // Методы для совместимости с messageHandler
    startGame(socket, playerId) {
        this.sendError(socket, 'Игра запускается автоматически когда все игроки готовы');
    }
    // ✅ ДОБАВЛЕННЫЙ МЕТОД handleMessage
    handleMessage(socket, message) {
        try {
            console.log('Handling message:', message.type);
            switch (message.type) {
                case 'create_room':
                    // логика уже есть в других методах
                    break;
                case 'join_room':
                    // логика уже есть в других методах
                    break;
                case 'leave_room':
                    // логика уже есть в других методах
                    break;
                default:
                    console.log('Unknown message type:', message.type);
            }
        }
        catch (error) {
            console.error('Error handling message:', error);
        }
    }
}
exports.RoomManager = RoomManager;
//# sourceMappingURL=RoomManager.js.map