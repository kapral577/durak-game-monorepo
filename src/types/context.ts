export type GameMode = 'classic' | 'transferable';
export type ThrowingMode = 'standard' | 'smart';

export interface GameRules {
  gameMode: GameMode;
  throwingMode: ThrowingMode;
  cardCount: number;
}

export interface UseGameSettings {
  playerCount: number;
  gameMode: GameMode;
  throwingMode: ThrowingMode;
  cardCount: number;

  setPlayerCount: (count: number) => void;
  setGameMode: (mode: GameMode) => void;
  setThrowingMode: (mode: ThrowingMode) => void;
  setCardCount: (count: number) => void;
}
