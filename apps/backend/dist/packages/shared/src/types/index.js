"use strict";
// shared/types/index.ts - ЕДИНЫЙ ИСТОЧНИК ИСТИНЫ ДЛЯ ВСЕГО ПРОЕКТА
Object.defineProperty(exports, "__esModule", { value: true });
exports.GAME_PHASES = exports.ROOM_STATUSES = exports.THROWING_MODES = exports.GAME_MODES = exports.CARD_RANKS = exports.CARD_SUITS = void 0;
// ===== КОНСТАНТЫ =====
exports.CARD_SUITS = ['♠', '♥', '♦', '♣'];
exports.CARD_RANKS = ['6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
exports.GAME_MODES = ['classic', 'transferable'];
exports.THROWING_MODES = ['standard', 'smart'];
exports.ROOM_STATUSES = ['waiting', 'playing', 'finished'];
exports.GAME_PHASES = ['attack', 'defend', 'discard', 'finished'];
//# sourceMappingURL=index.js.map