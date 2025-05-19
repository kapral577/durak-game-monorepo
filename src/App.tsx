import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainMenu from './pages/MainMenu';
import GameSetupPage from './pages/GameSetupPage';
import TablesPage from './pages/TablesPage';
import FriendsPage from './pages/FriendsPage';
import GameRoomPage from './pages/GameRoomPage';
import GamePlayPage from './pages/GamePlayPage';
import { GameEngineProvider } from './context/GameEngineProvider';
import { GameSettingsProvider } from './context/GameSettingsContext';

const App: React.FC = () => {
  return (
    <GameEngineProvider>
      <GameSettingsProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<MainMenu />} />
            <Route path="/setup" element={<GameSetupPage />} />
            <Route path="/tables" element={<TablesPage />} />
            <Route path="/friends" element={<FriendsPage />} />
            <Route path="/room/:roomId" element={<GameRoomPage />} />
            <Route path="/play" element={<GamePlayPage />} />
          </Routes>
        </BrowserRouter>
      </GameSettingsProvider>
    </GameEngineProvider>
  );
};

export default App;