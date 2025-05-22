import React, { createContext, useContext } from 'react';
import { GameEngineContext } from '../context/GameEngineProvider';
import { GameState } from '../types/GameState';

interface GameEngineContextType {
  gameState: GameState | null;
  setGameState: (state: GameState) => void;
}

const GameEngineContext = createContext<GameEngineContextType | null>(null);

export const GameEngineProvider = ({ children }: { children: React.ReactNode }) => {
  const { gameState, setGameState } = useGameEngine();

  return (
    <GameEngineContext.Provider value={{ gameState, setGameState }}>
      {children}
    </GameEngineContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameEngineContext);
  if (!context) {
    throw new Error('useGame must be used within a GameEngineProvider');
  }
  return context;
};