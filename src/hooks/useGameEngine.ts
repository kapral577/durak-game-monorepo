import { useContext } from 'react';
import { GameEngineContext } from '../context/GameEngineProvider';

export const useGameEngine = () => {
  const context = useContext(GameEngineContext);
  if (!context) {
    throw new Error('useGameEngine must be used within a GameEngineProvider');
  }
  return context;
};