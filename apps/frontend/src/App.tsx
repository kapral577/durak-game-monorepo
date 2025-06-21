// src/App.tsx - КОРНЕВОЙ КОМПОНЕНТ ПРИЛОЖЕНИЯ

import React, { useEffect, useState, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Container, Spinner, Alert } from 'react-bootstrap';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { GameSettingsProvider } from './context/GameSettingsProvider';
import { GameProvider } from './context/GameProvider';
import { AuthProvider } from './hooks/useAuth';
import { useGame } from './context/GameProvider';
import ErrorBoundary from './components/ErrorBoundary';
import ConnectionStatus from './components/ConnectionStatus';
import BottomNavbar from './components/BottomNavbar';
import type { GameMode, ThrowingMode, CardCount, PlayerCount } from '@shared/types';
// ===== ТИПЫ TELEGRAM =====
declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        ready(): void;
        expand(): void;
        enableClosingConfirmation(): void;
        disableVerticalSwipes(): void;
        colorScheme?: 'light' | 'dark';
      };
    };
  }
}

// ===== LAZY LOADING СТРАНИЦ =====

const MainMenu = lazy(() => import('./pages/MainMenu'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const GameSettingsPage = lazy(() => import('./pages/GameSettingsPage'));
const RoomListPage = lazy(() => import('./pages/RoomListPage'));
const GameRoomPage = lazy(() => import('./pages/GameRoomPage'));
const GamePlayPage = lazy(() => import('./pages/GamePlayPage'));
const FriendsPage = lazy(() => import('./pages/FriendsPage'));

// ===== ИНТЕРФЕЙСЫ =====

/**
 * Props для App
 */
export interface AppProps {
  // Если нужны props в будущем
}

// ===== КОНСТАНТЫ =====

const APP_CONFIG = {
  TELEGRAM_INIT_DELAY: 500,
  PAGE_LOAD_TIMEOUT: 10000
} as const;

const META_CONFIG = {
  TITLE: 'Дурак Онлайн - Telegram Mini App',
  DESCRIPTION: 'Играйте в дурака с друзьями в Telegram',
  THEME_COLOR: '#1a1a2e',
  VIEWPORT: 'width=device-width, initial-scale=1.0, user-scalable=no'
} as const;

const CSS_CLASSES = {
  APP_CONTAINER: 'app-container',
  MAIN_CONTENT: 'main-content',
  PAGE_LOADER: 'page-loader',
  ERROR_PAGE: 'error-page'
} as const;

// ===== КОМПОНЕНТЫ =====

/**
 * Компонент загрузки страницы
 */
const PageLoader: React.FC = () => (
  <Container className={`${CSS_CLASSES.PAGE_LOADER} d-flex justify-content-center align-items-center min-vh-100`}>
    <div className="text-center">
      <Spinner animation="border" className="mb-3" />
      <p>Загрузка...</p>
    </div>
  </Container>
);

/**
 * Компонент страницы ошибки
 */
const ErrorPage: React.FC = () => (
  <Container className={`${CSS_CLASSES.ERROR_PAGE} text-center mt-5`}>
    <h2>Страница не найдена</h2>
    <p>Запрашиваемая страница не существует</p>
    <button 
      className="btn btn-primary"
      onClick={() => window.location.href = '/'}
      aria-label="Перейти на главную страницу"
    >
      На главную
    </button>
  </Container>
);

/**
 * Компонент защищенного маршрута
 */

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, telegramUser } = useGame();
  
  console.log('🛡️ ProtectedRoute check:', {
    isAuthenticated,
    hasTelegramUser: !!telegramUser,
    currentPath: window.location.pathname,
    timestamp: Date.now()
  });

  // ТОЛЬКО проверка аутентификации - это главное!
  if (!isAuthenticated || !telegramUser) {
    console.log('🚫 ProtectedRoute BLOCKING - redirecting to /login');
    return <Navigate to="/login" replace />;
  }

  // Авторизованный пользователь ВСЕГДА попадает в контент
  return <>{children}</>;
};
  

/**
 * Основные маршруты приложения
 */
const AppRoutes: React.FC = () => {
  const { isAuthenticated } = useGame();
   console.log('🗺️ AppRoutes check:', {
    isAuthenticated,
    currentPath: window.location.pathname,
    timestamp: Date.now()
  });  

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Публичные маршруты */}
        <Route 
          path="/login" 
          element={
            isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />
          } 
        />
        
        {/* Защищенные маршруты */}
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <MainMenu />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/settings" 
          element={
            <ProtectedRoute>
              <GameSettingsPage />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/rooms" 
          element={
            <ProtectedRoute>
              <RoomListPage />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/room/:roomId" 
          element={
            <ProtectedRoute>
              <GameRoomPage />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/game" 
          element={
            <ProtectedRoute>
              <GamePlayPage />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/friends" 
          element={
            <ProtectedRoute>
              <FriendsPage />
            </ProtectedRoute>
          } 
        />
        
        {/* Страница ошибки для неизвестных маршрутов */}
        <Route path="*" element={<ErrorPage />} />
      </Routes>
    </Suspense>
  );
};

// ===== ОСНОВНОЙ КОМПОНЕНТ =====

/**
 * Корневой компонент приложения
 */
export const App: React.FC<AppProps> = () => {
  // Состояния
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  // ===== ИНИЦИАЛИЗАЦИЯ TELEGRAM WEBAPP =====

  useEffect(() => {
    const initializeTelegramWebApp = async () => {
      try {
        if (window.Telegram?.WebApp) {
          const tg = window.Telegram.WebApp;
          tg.ready();
          tg.expand();
          tg.enableClosingConfirmation();
          tg.disableVerticalSwipes();
          
          // Настройка темы
          if (tg.colorScheme === 'dark') {
            document.body.classList.add('dark-theme');
          }
          
          await new Promise(resolve => setTimeout(resolve, APP_CONFIG.TELEGRAM_INIT_DELAY));
        }
      } catch (error) {
        console.error('Telegram WebApp initialization error:', error);
      } finally {
        setIsInitialized(true);
      }
    };

    initializeTelegramWebApp();
  }, []);

  // ===== ОТСЛЕЖИВАНИЕ ОНЛАЙН СТАТУСА =====

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // ===== EARLY RETURN ДЛЯ ИНИЦИАЛИЗАЦИИ =====

  if (!isInitialized) {
    return <PageLoader />;
  }

  // ===== РЕНДЕР =====

return (
  <HelmetProvider>
    <ErrorBoundary>
      <Helmet>
        <title>{META_CONFIG.TITLE}</title>
        <meta name="description" content={META_CONFIG.DESCRIPTION} />
        <meta name="viewport" content={META_CONFIG.VIEWPORT} />
        <meta name="theme-color" content={META_CONFIG.THEME_COLOR} />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </Helmet>

      <GameSettingsProvider>
        <AuthProvider>
          <Router>
            <GameProvider>
              <div className={CSS_CLASSES.APP_CONTAINER}>
                {/* Уведомление об отсутствии интернета */}
                {!isOnline && (
                  <Alert variant="warning" className="mb-0 text-center">
                    Нет подключения к интернету
                  </Alert>
                )}

                {/* Индикатор соединения */}
                <ConnectionStatus />
                
                {/* Основной контент */}
                <main className={CSS_CLASSES.MAIN_CONTENT}>
                  <AppRoutes />
                </main>
                
                {/* Нижняя навигация */}
                <BottomNavbar />
              </div>
            </GameProvider>
          </Router>
        </AuthProvider>
      </GameSettingsProvider>
    </ErrorBoundary>
  </HelmetProvider>
);

// Установка displayName для лучшей отладки
App.displayName = 'App';

// ===== ЭКСПОРТ =====
}
export default App;
export type { AppProps };
export { APP_CONFIG, META_CONFIG, CSS_CLASSES };
