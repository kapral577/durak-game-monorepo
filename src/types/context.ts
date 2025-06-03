// src/types/context.ts - ИСПРАВЛЕНЫ ВСЕ ОШИБКИ

export enum GameMode {
  Classic = 'classic',
  Transferable = 'transferable'
}

export enum ThrowingMode {
  Standard = 'standard',
  Smart = 'smart'
}

export interface GameRules {
  gameMode: GameMode;
  throwingMode: ThrowingMode;
  cardCount: number;
  maxPlayers: number; // ✅ ДОБАВЛЕНО maxPlayers
} // ✅ ДОБАВЛЕНА закрывающая скобка

export interface UseGameSettings {
  playerCount: number;
  gameMode: GameMode;
  throwingMode: ThrowingMode;
  cardCount: number;
  maxPlayers: number; // ✅ ДОБАВЛЕНО maxPlayers
  setPlayerCount: (count: number) => void;
  setGameMode: (mode: GameMode) => void;
  setThrowingMode: (mode: ThrowingMode) => void;
  setCardCount: (count: number) => void;
  setMaxPlayers: (count: number) => void; // ✅ ДОБАВЛЕНО setMaxPlayers
} // ✅ ДОБАВЛЕНА закрывающая скобка
