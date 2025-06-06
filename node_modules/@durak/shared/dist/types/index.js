"use strict";
// packages/shared/src/types/index.ts - ЕДИНЫЙ ИСТОЧНИК ИСТИНЫ ДЛЯ ВСЕГО ПРОЕКТА
Object.defineProperty(exports, "__esModule", { value: true });
exports.GAME_CONFIG = exports.WEBSOCKET_CONFIG = exports.VALIDATION_RULES = exports.PLAYER_COUNTS = exports.CARD_COUNTS = exports.GAME_PHASES = exports.ROOM_STATUSES = exports.THROWING_MODES = exports.GAME_MODES = exports.CARD_RANKS = exports.CARD_SUITS = void 0;
// ===== КОНСТАНТЫ =====
exports.CARD_SUITS = ['♠', '♥', '♦', '♣'];
exports.CARD_RANKS = ['6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
exports.GAME_MODES = ['classic', 'transferable'];
exports.THROWING_MODES = ['standard', 'smart'];
exports.ROOM_STATUSES = ['waiting', 'playing', 'finished'];
exports.GAME_PHASES = ['attack', 'defend', 'discard', 'finished'];
exports.CARD_COUNTS = [6, 8, 10];
exports.PLAYER_COUNTS = [2, 3, 4, 5, 6];
// ===== ВАЛИДАЦИОННЫЕ КОНСТАНТЫ =====
exports.VALIDATION_RULES = {
    ROOM_NAME: {
        MIN_LENGTH: 3,
        MAX_LENGTH: 50
    },
    PLAYER_NAME: {
        MIN_LENGTH: 2,
        MAX_LENGTH: 30
    },
    CARD_COUNT: {
        ALLOWED: exports.CARD_COUNTS
    },
    PLAYER_COUNT: {
        MIN: 2,
        MAX: 6,
        ALLOWED: exports.PLAYER_COUNTS
    },
    AUTH_DATE: {
        MAX_AGE_HOURS: 24
    }
};
// ===== КОНФИГУРАЦИОННЫЕ КОНСТАНТЫ =====
exports.WEBSOCKET_CONFIG = {
    HEARTBEAT_INTERVAL: 30000,
    RECONNECT_DELAY: 3000,
    MAX_RECONNECT_ATTEMPTS: 5,
    CONNECTION_TIMEOUT: 10000
};
exports.GAME_CONFIG = {
    AUTO_START_COUNTDOWN: 10,
    TURN_TIMEOUT: 60000,
    MAX_CARDS_IN_ATTACK: 6
};
