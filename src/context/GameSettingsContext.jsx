import React, { createContext, useContext, useState } from 'react';

const GameSettingsContext = createContext();

export const GameSettingsProvider = ({ children }) => {
  const [playerCount, setPlayerCount] = useState(2);
  const [gameMode, setGameMode] = useState('');
  const [throwingMode, setThrowingMode] = useState('');
  const [cardCount, setCardCount] = useState('');

  return (
    <GameSettingsContext.Provider
      value={{ playerCount, setPlayerCount, gameMode, setGameMode, throwingMode, setThrowingMode, cardCount, setCardCount }}
    >
      {children}
    </GameSettingsContext.Provider>
  );
};

export const useGameSettings = () => useContext(GameSettingsContext);
