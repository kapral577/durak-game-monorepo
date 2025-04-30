// src/App.jsx
import React from 'react';
import { Routes, Route } from 'react-router-dom'; // без BrowserRouter здесь
import MainMenu from './pages/MainMenu';
import GameSetupPage from './pages/GameSetupPage';
import TablesPage from './pages/TablesPage';
import FriendsPage from './pages/FriendsPage';
import GameRoomPage from './pages/GameRoomPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<MainMenu />} />
      <Route path="/setup" element={<GameSetupPage />} />
      <Route path="/tables" element={<TablesPage />} />
      <Route path="/friends" element={<FriendsPage />} />
      <Route path="/room" element={<GameRoomPage />} />
    </Routes>
  );
}

export default App;
