// src/App.tsx - ФРОНТЕНД - ИСПРАВЛЕНО
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';

// Провайдеры
import { GameProvider } from './context/GameProvider';
import { GameSettingsProvider } from './context/GameSettingsProvider';

// Компоненты
import BottomNavbar from './components/BottomNavbar';
import ErrorBoundary from './components/ErrorBoundary';
import ConnectionStatus from './components/ConnectionStatus';

// Страницы
import MainMenu from './pages/MainMenu';                    // ваш существующий файл
import GameSettingsPage from './pages/GameSettingsPage';   // ваш новый файл
import RoomListPage from './pages/RoomListPage';           // ваш новый файл  
import GameRoomPage from './pages/GameRoomPage';           // ваш существующий файл
import GamePlayPage from './pages/GamePlayPage';           // ваш существующий файл
import FriendsPage from './pages/FriendsPage';             // ваш существующий файл (если нужен)

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <GameSettingsProvider>
        <GameProvider>
          <div className="App min-vh-100 d-flex flex-column">
            {/* Индикатор соединения */}
            <ConnectionStatus />
            
            {/* Основной контент */}
            <Container fluid className="flex-grow-1 p-0">
              <Routes>
                {/* Главное меню */}
                <Route path="/" element={<MainMenu />} />
                
                {/* Настройки и создание игры */}
                <Route path="/settings" element={<GameSettingsPage />} />
                
                {/* Список комнат */}
                <Route path="/rooms" element={<RoomListPage />} />
                
                {/* Комната ожидания */}
                <Route path="/room/:roomId" element={<GameRoomPage />} />
                
                {/* Игровая страница */}
                <Route path="/game/:roomId" element={<GamePlayPage />} />
                
                {/* Друзья (если нужно) */}
                <Route path="/friends" element={<FriendsPage />} />
                
                {/* Fallback на главную */}
                <Route path="*" element={<MainMenu />} />
              </Routes>
            </Container>

            {/* Нижняя навигация */}
            <BottomNavbar />
          </div>
        </GameProvider>
      </GameSettingsProvider>
    </ErrorBoundary>
  );
};

export default App;
