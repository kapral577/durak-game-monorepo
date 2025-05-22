import React, { createContext, useContext } from 'react';
import { GameState } from '../types/GameState';
import { useGameEngine } from '../hooks/useGameEngine';

interface GameEngineContextType {
  gameState: GameState | null;
  setGameState: (state: GameState) => void;
}

const GameEngineContext = createContext<GameEngineContextType | null>(null);

export const GameEngineProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { gameState, setGameState } = useGameEngine();

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