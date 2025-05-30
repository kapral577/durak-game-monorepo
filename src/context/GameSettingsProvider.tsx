// src/context/GameSettingsProvider.tsx - ИСПРАВЛЕНЫ ТОЛЬКО СИНТАКСИЧЕСКИЕ ОШИБКИ
import React, { createContext, useContext, useState } from 'react';
import { UseGameSettings, GameMode, ThrowingMode } from '../types/context';

// ✅ ИСПРАВЛЕНА типизация контекста
const GameSettingsContext = createContext<UseGameSettings | undefined>(undefined);

export const GameSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [playerCount, setPlayerCount] = useState(2);
  const [gameMode, setGameMode] = useState<GameMode>('classic'); // ✅ ДОБАВЛЕНА типизация
  const [throwingMode, setThrowingMode] = useState<ThrowingMode>('standard'); // ✅ ДОБАВЛЕНА типизация
  const [cardCount, setCardCount] = useState(36);

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

  // ✅ ИСПРАВЛЕН return - добавлен Provider
  return (
    <GameSettingsContext.Provider value={value}>
      {children}
    </GameSettingsContext.Provider>
  );
};

export const useGameSettings = (): UseGameSettings => {
  const context = useContext(GameSettingsContext);
  if (!context) {
    throw new Error('useGameSettings must be used within GameSettingsProvider');
  }
  return context;
}; // ✅ ИСПРАВЛЕНА закрывающая скобка
