"use strict";
// durak-server/logic/startGame.ts - РЕФАКТОРИРОВАННАЯ ВЕРСИЯ
Object.defineProperty(exports, "__esModule", { value: true });
exports.startGame = startGame;
const uuid_1 = require("uuid");
function startGame(input) {
    const { roomId, rules, players } = input;
    if (players.length < 2) {
        throw new Error('Need at least 2 players to start game');
    }
    // Создаем колоду
    const deck = createDeck();
    shuffleDeck(deck);
    // Раздаем карты
    const cardCount = rules.cardCount;
    const playersWithCards = players.map(player => ({
        ...player,
        hand: deck.splice(0, cardCount), // ✅ ИСПРАВЛЕНО - Card[], не string[]
        isReady: true
    }));
    // Определяем козырь
    const trump = deck.length > 0 ? deck[deck.length - 1] : null; // ✅ ИСПРАВЛЕНО - Card объект
    const trumpSuit = trump?.suit || '♠';
    // Определяем первого игрока (у кого младший козырь)
    let attackerIndex = 0;
    let lowestTrumpValue = Infinity;
    playersWithCards.forEach((player, index) => {
        // ✅ УБРАНЫ КОСТЫЛЬНЫЕ КОНВЕРТАЦИИ - работаем с Card объектами
        const trumpCards = player.hand.filter((card) => card.suit === trumpSuit);
        if (trumpCards.length > 0) {
            const minTrump = Math.min(...trumpCards.map((card) => getCardValue(card.rank)));
            if (minTrump < lowestTrumpValue) {
                lowestTrumpValue = minTrump;
                attackerIndex = index;
            }
        }
    });
    const defenderIndex = (attackerIndex + 1) % playersWithCards.length;
    const gameState = {
        id: (0, uuid_1.v4)(), // ✅ ДОБАВЛЕНО - уникальный ID игры
        roomId,
        phase: 'attack', // ✅ ИСПРАВЛЕНО - правильная начальная фаза
        players: playersWithCards,
        deck, // ✅ ИСПРАВЛЕНО - Card[], не string[]
        table: [], // ✅ ИСПРАВЛЕНО - TableCard[], не string[]
        trump, // ✅ ИСПРАВЛЕНО - Card объект, не string
        trumpSuit,
        currentPlayerId: playersWithCards[attackerIndex].id, // ✅ ИСПРАВЛЕНО - используем ID
        currentAttackerIndex: attackerIndex,
        currentDefenderIndex: defenderIndex,
        turn: 1,
        gameMode: rules.gameMode, // ✅ ДОБАВЛЕНО из rules
        throwingMode: rules.throwingMode, // ✅ ДОБАВЛЕНО из rules
        maxPlayers: rules.maxPlayers, // ✅ ДОБАВЛЕНО из rules
        createdAt: Date.now(), // ✅ ДОБАВЛЕНО timestamp
        updatedAt: Date.now(), // ✅ ДОБАВЛЕНО timestamp
    };
    if (process.env.NODE_ENV === 'development') {
        console.log(`🎮 Game started in room ${roomId} with ${players.length} players`);
    }
    return gameState;
}
function createDeck() {
    const suits = ['♠', '♥', '♦', '♣'];
    const ranks = ['6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    const deck = [];
    for (const suit of suits) {
        for (const rank of ranks) {
            deck.push({
                id: (0, uuid_1.v4)(), // ✅ ДОБАВЛЕНО - уникальный ID карты
                suit,
                rank
            });
        }
    }
    return deck;
}
function shuffleDeck(deck) {
    // Fisher-Yates shuffle алгоритм
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
}
function getCardValue(rank) {
    const values = {
        '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
        'J': 11, 'Q': 12, 'K': 13, 'A': 14
    };
    return values[rank];
}
//# sourceMappingURL=startGame.js.map