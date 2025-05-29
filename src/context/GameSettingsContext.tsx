// src/context/GameSettingsContext.tsx
import React, { createContext, useContext, useState } from 'react';
import { UseGameSettings, GameMode, ThrowingMode } from '../types/context';

const GameSettingsContext = createContext<UseGameSettings | undefined>(undefined);

export const GameSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [playerCount, setPlayerCount] = useState<number>(2);
  const [gameMode, setGameMode] = useState<GameMode>('classic');
  const [throwingMode, setThrowingMode] = useState<ThrowingMode>('standard');
  const [cardCount, setCardCount] = useState<number>(36);

  const value: UseGameSettings = {
    playerCount,
    gameMode,
    throwingMode,
    cardCount,
    setPlayerCount,
    setGameMode,
    setThrowingMode,
    setCardCount,
  };

  return <GameSettingsContext.Provider value={value}>{children}</GameSettingsContext.Provider>;
};

export const useGameSettings = (): UseGameSettings => {
  const context = useContext(GameSettingsContext);
  if (!context) {
    throw new Error('useGameSettings must be used within GameSettingsProvider');
  }
  return context;
};
