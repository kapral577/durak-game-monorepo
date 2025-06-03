// src/App.tsx - ИСПРАВЛЕНО с Login логикой

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Container } from 'react-bootstrap';

// ❌ УДАЛЕНО: import 'bootstrap/dist/css/bootstrap.min.css';
// Стили загружаются через main.tsx → custom-bootstrap.scss

// Провайдеры
import { GameProvider } from './context/GameProvider';
import { GameSettingsProvider } from './context/GameSettingsProvider';

// Компоненты
import BottomNavbar from './components/BottomNavbar';
import ErrorBoundary from './components/ErrorBoundary';
import ConnectionStatus from './components/ConnectionStatus';

// Страницы
import LoginPage from './pages/LoginPage';           // ✅ ДОБАВЛЕНО
import MainMenu from './pages/MainMenu';
import GameSettingsPage from './pages/GameSettingsPage';
import RoomListPage from './pages/RoomListPage';
import GameRoomPage from './pages/GameRoomPage';
import GamePlayPage from './pages/GamePlayPage';
import FriendsPage from './pages/FriendsPage';

// ✅ ДОБАВЛЕНО: Компонент для защиты маршрутов
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuthenticated = localStorage.getItem('gameToken');
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <GameProvider>
        <GameSettingsProvider>
          <Container fluid className="p-0">
            {/* Индикатор соединения */}
            <ConnectionStatus />

            {/* Основной контент */}
            <Routes>
              {/* ✅ ДОБАВЛЕНО: Login экран - ПЕРВЫЙ */}
              <Route path="/login" element={<LoginPage />} />
              
              {/* ✅ ИЗМЕНЕНО: Все остальные маршруты защищены */}
              <Route path="/main-menu" element={
                <ProtectedRoute>
                  <MainMenu />
                </ProtectedRoute>
              } />
              
              <Route path="/game-settings" element={
                <ProtectedRoute>
                  <GameSettingsPage />
                </ProtectedRoute>
              } />
              
              <Route path="/rooms" element={
                <ProtectedRoute>
                  <RoomListPage />
                </ProtectedRoute>
              } />
              
              <Route path="/room/:roomId" element={
                <ProtectedRoute>
                  <GameRoomPage />
                </ProtectedRoute>
              } />
              
              <Route path="/game/:gameId" element={
                <ProtectedRoute>
                  <GamePlayPage />
                </ProtectedRoute>
              } />
              
              <Route path="/friends" element={
                <ProtectedRoute>
                  <FriendsPage />
                </ProtectedRoute>
              } />

              {/* ✅ ИЗМЕНЕНО: Редирект на login по умолчанию */}
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>

            {/* ✅ ИЗМЕНЕНО: Навигация только для аутентифицированных */}
            <ProtectedRoute>
              <BottomNavbar />
            </ProtectedRoute>
          </Container>
        </GameSettingsProvider>
      </GameProvider>
    </ErrorBoundary>
  );
};

export default App;
