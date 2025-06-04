// src/App.tsx - РЕФАКТОРИРОВАННАЯ ВЕРСИЯ ДЛЯ TELEGRAM MINI APP

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Container } from 'react-bootstrap';

// Провайдеры
import { GameProvider } from './context/GameProvider';
import { GameSettingsProvider } from './context/GameSettingsProvider';

// Компоненты
import BottomNavbar from './components/BottomNavbar';
import ErrorBoundary from './components/ErrorBoundary';
import ConnectionStatus from './components/ConnectionStatus';

// Страницы
import MainMenu from './pages/MainMenu';
import GameSettingsPage from './pages/GameSettingsPage';
import RoomListPage from './pages/RoomListPage';
import GameRoomPage from './pages/GameRoomPage';
import GamePlayPage from './pages/GamePlayPage';
import FriendsPage from './pages/FriendsPage';

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <GameProvider>
        <GameSettingsProvider>
          <Container fluid className="app-container p-0">
            {/* Индикатор соединения */}
            <ConnectionStatus />
            
            {/* Основной контент */}
            <Routes>
              {/* Главная страница */}
              <Route path="/" element={<MainMenu />} />
              
              {/* Создание игры */}
              <Route path="/settings" element={<GameSettingsPage />} />
              
              {/* Список комнат */}
              <Route path="/rooms" element={<RoomListPage />} />
              
              {/* Комната ожидания */}
              <Route path="/room/:id" element={<GameRoomPage />} />
              
              {/* Игровой процесс */}
              <Route path="/game" element={<GamePlayPage />} />
              
              {/* Приглашение друзей */}
              <Route path="/friends" element={<FriendsPage />} />
              
              {/* Редирект на главную для неизвестных маршрутов */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            
            {/* Нижняя навигация */}
            <BottomNavbar />
          </Container>
        </GameSettingsProvider>
      </GameProvider>
    </ErrorBoundary>
  );
};

export default App;
