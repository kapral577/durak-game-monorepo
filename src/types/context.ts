// src/types/context.ts - ИСПРАВЛЕНЫ ВСЕ ОШИБКИ
export type GameMode = 'classic' | 'transferable';

export type ThrowingMode = 'standard' | 'smart';

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
}
