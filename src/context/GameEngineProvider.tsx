// src/context/GameEngineProvider.tsx
import React, { createContext, useContext } from 'react';
import { useGameEngine } from '../hooks/useGameEngine';

// Тип контекста можно вывести автоматически
const GameEngineContext = createContext<ReturnType<typeof useGameEngine> | null>(null);

export const GameEngineProvider = ({ children }: { children: React.ReactNode }) => {
  const game = useGameEngine();

  return (
    <GameEngineContext.Provider value={game}>
      {children}
    </GameEngineContext.Provider>
  );
};

// Хук доступа к контексту
export const useGame = () => {
  const context = useContext(GameEngineContext);
  if (!context) {
    throw new Error('useGame must be used within a GameEngineProvider');
  }
  return context;
};
