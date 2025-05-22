import React, { createContext, useContext, useState } from 'react';
import { GameState } from '../types/GameState';

interface GameEngineContextType {
  gameState: GameState | null;
  setGameState: (state: GameState) => void;
}

const GameEngineContext = createContext<GameEngineContextType | null>(null);
export { GameEngineContext };

export const GameEngineProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [gameState, setGameState] = useState<GameState | null>(null); // ✅ напрямую

  return (
    <GameEngineContext.Provider value={{ gameState, setGameState }}>
      {children}
    </GameEngineContext.Provider>
  );
};

export const useGame = (): GameEngineContextType => {
  const context = useContext(GameEngineContext);
  if (!context) {
    throw new Error('useGame must be used within a GameEngineProvider');
  }
  return context;
};