// src/context/GameSettingsProvider.tsx - ИСПРАВЛЕНЫ ВСЕ ОШИБКИ
import React, { createContext, useContext, useState } from 'react';
import { UseGameSettings, GameMode, ThrowingMode } from '../types/context';

// ✅ ИСПРАВЛЕНА типизация контекста
const GameSettingsContext = createContext<UseGameSettings | undefined>(undefined);

export const GameSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [playerCount, setPlayerCount] = useState(2);
  const [gameMode, setGameMode] = useState<GameMode>('classic'); // ✅ ДОБАВЛЕНА типизация
  const [throwingMode, setThrowingMode] = useState<ThrowingMode>('standard'); // ✅ ДОБАВЛЕНА типизация
  const [cardCount, setCardCount] = useState(36);
  const [maxPlayers, setMaxPlayers] = useState(4); // ✅ ДОБАВЛЕНО maxPlayers

  const value: UseGameSettings = {
    playerCount,
    gameMode,
    throwingMode,
    cardCount,
    maxPlayers, // ✅ ДОБАВЛЕНО в value
    setPlayerCount,
    setGameMode,
    setThrowingMode,
    setCardCount,
    setMaxPlayers, // ✅ ДОБАВЛЕНО в value
  };

  // ✅ ИСПРАВЛЕН return - правильная JSX структура
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
