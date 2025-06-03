// src/context/GameSettingsProvider.tsx - ПОЛНОСТЬЮ ИСПРАВЛЕННАЯ ВЕРСИЯ

import React, { createContext, useContext, useState, useMemo } from 'react';
import { UseGameSettings, GameMode, ThrowingMode } from '../types/context';

// ===== КОНСТАНТЫ ПО УМОЛЧАНИЮ =====
const DEFAULT_SETTINGS = {
  playerCount: 2,
  gameMode: GameMode.Classic,
  throwingMode: ThrowingMode.Standard,
  cardCount: 36,
  maxPlayers: 4,
} as const;

// ===== КОНТЕКСТ =====
const GameSettingsContext = createContext<UseGameSettings | null>(null);

// ===== ПРОВАЙДЕР =====
export const GameSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [playerCount, setPlayerCount] = useState<number>(DEFAULT_SETTINGS.playerCount);
  const [gameMode, setGameMode] = useState<GameMode>(DEFAULT_SETTINGS.gameMode);
  const [throwingMode, setThrowingMode] = useState<ThrowingMode>(DEFAULT_SETTINGS.throwingMode);
  const [cardCount, setCardCount] = useState<number>(DEFAULT_SETTINGS.cardCount);
  const [maxPlayers, setMaxPlayers] = useState<number>(DEFAULT_SETTINGS.maxPlayers);

  // Валидация значений
  const handleSetPlayerCount = (count: number) => {
    if (count >= 2 && count <= maxPlayers) {
      setPlayerCount(count);
    }
  };

  const handleSetMaxPlayers = (count: number) => {
    if (count >= 2 && count <= 6) {
      setMaxPlayers(count);
      // Если текущее количество игроков больше нового максимума
      if (playerCount > count) {
        setPlayerCount(count);
      }
    }
  };

  const handleSetCardCount = (count: number) => {
    if (count === 24 || count === 36 || count === 52) {
      setCardCount(count);
    }
  };

  // Мемоизированное значение контекста
  const value: UseGameSettings = useMemo(() => ({
    playerCount,
    gameMode,
    throwingMode,
    cardCount,
    maxPlayers,
    setPlayerCount: handleSetPlayerCount,
    setGameMode,
    setThrowingMode,
    setCardCount: handleSetCardCount,
    setMaxPlayers: handleSetMaxPlayers,
  }), [playerCount, gameMode, throwingMode, cardCount, maxPlayers]);

  return (
    <GameSettingsContext.Provider value={value}>
      {children}
    </GameSettingsContext.Provider>
  );
};

// ===== ХУК =====
export const useGameSettings = (): UseGameSettings => {
  const context = useContext(GameSettingsContext);
  if (!context) {
    throw new Error('useGameSettings must be used within GameSettingsProvider');
  }
  return context;
};
