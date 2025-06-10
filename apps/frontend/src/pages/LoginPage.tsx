// src/pages/LoginPage.tsx - СТРАНИЦА ВХОДА В ИГРУ

import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Card, Button, Spinner, Alert } from 'react-bootstrap';
import { TelegramAuth } from '../utils/TelegramAuth';

// ✅ ИМПОРТ ЕДИНЫХ ТИПОВ вместо локальных интерфейсов
import { AuthSuccessResponse, AuthErrorResponse, AuthResponse } from '../types/AuthTypes';

// ===== ИНТЕРФЕЙСЫ =====

/**
 * Props для LoginPage
 */
export interface LoginPageProps {
  // Если нужны props в будущем
}

// ❌ УДАЛЕНЫ локальные интерфейсы - используем единые типы

// ===== КОНСТАНТЫ =====

const CONFIG = {
  CONNECTION_TIMEOUT: 10000,
  WEBSOCKET_URL: import.meta.env.VITE_WS_URL || 'wss://durak-game-monorepo.onrender.com:10000',
  API_BASE_URL: import.meta.env.VITE_API_URL || '/api',
  TEST_MODE_PREFIX: 'test-',
  STORAGE_KEYS: {
    GAME_TOKEN: 'gameToken',
    SESSION_ID: 'sessionId'
  }
} as const;

const ERROR_MESSAGES = {
  TELEGRAM_NOT_AVAILABLE: 'Приложение должно быть запущено в Telegram.',
  SERVER_AUTH_FAILED: 'Ошибка аутентификации сервера.',
  CONNECTION_TIMEOUT: 'Превышено время ожидания подключения.',
  WEBSOCKET_FAILED: 'Не удалось подключиться к игровому серверу.',
  GENERIC: 'Не удалось подключиться к серверу.',
  INVALID_RESPONSE: 'Неверный формат ответа сервера',
  NETWORK_ERROR: 'Ошибка сети'
} as const;

const UI_TEXT = {
  PAGE_TITLE: 'Вход в игру',
  LOGIN_BUTTON: 'Войти через Telegram',
  CONNECTING_TEXT: 'Подключение...',
  FALLBACK_MESSAGE: 'Для игры требуется Telegram WebApp',
  RETRY_BUTTON: 'Попробовать снова'
} as const;

// ===== УТИЛИТАРНЫЕ ФУНКЦИИ =====

/**
 * Получение WebSocket URL с токеном
 */
const getWebSocketUrl = (token: string): string => {
  const baseUrl = CONFIG.WEBSOCKET_URL;
  
  if (!baseUrl) {
    throw new Error('WebSocket URL not configured');
  }
  
  try {
    const url = new URL(baseUrl);
    url.searchParams.set('token', token);
    return url.toString();
  } catch (error) {
    throw new Error('Invalid WebSocket URL configuration');
  }
};

/**
 * Получение API URL
 */
const getApiUrl = (endpoint: string): string => {
  const baseUrl = CONFIG.API_BASE_URL;
  return `${baseUrl}${endpoint}`;
};

/**
 * ✅ ОБНОВЛЕННАЯ валидация ответа для единых типов
 */
const validateAuthResponse = (data: any): data is AuthSuccessResponse => {
  return data && 
    data.success === true &&
    typeof data.token === 'string' && 
    typeof data.sessionId === 'string' &&
    data.token.length > 0 &&
    data.sessionId.length > 0 &&
    data.user &&
    typeof data.user.id === 'string' &&
    typeof data.user.name === 'string' &&
    typeof data.user.telegramId === 'number';
};

/**
 * ✅ ОБНОВЛЕННАЯ аутентификация с правильным endpoint
 */
const authenticateWithRetry = async (
  initData: string, 
  user: any, 
  retryCount = 0
): Promise<AuthSuccessResponse> => {
  const MAX_RETRIES = 3;
  
  try {
    console.log('🔐 Sending auth request with initData length:', initData.length);
    
    // ✅ ИЗМЕНЕН endpoint на новый
    const response = await fetch(getApiUrl('/auth/telegram'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ initData })
    });
    
    console.log('📡 Response status:', response.status);
    
    if (!response.ok) {
      throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
    }
    
    const authData: AuthResponse = await response.json();
    
    console.log('📋 Response data structure:', {
      hasSuccess: 'success' in authData,
      successValue: authData.success,
      hasToken: 'token' in authData,
      hasError: 'error' in authData
    });
    
    if (authData.success === false) {
      throw new Error(authData.error || ERROR_MESSAGES.SERVER_AUTH_FAILED);
    }
    
    if (!validateAuthResponse(authData)) {
      console.error('❌ Invalid response format:', authData);
      throw new Error(ERROR_MESSAGES.INVALID_RESPONSE);
    }
    
    return authData as AuthSuccessResponse;
  } catch (error) {
    console.error('🚫 Auth attempt failed:', error);
    if (retryCount < MAX_RETRIES) {
      console.log(`🔄 Retry attempt ${retryCount + 1}/${MAX_RETRIES}`);
      await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
      return authenticateWithRetry(initData, user, retryCount + 1);
    }
    throw error;
  }
};

// ===== ОСНОВНОЙ КОМПОНЕНТ =====

/**
 * Страница входа в игру
 */
export const LoginPage: React.FC<LoginPageProps> = () => {
  // Состояния
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Хуки
  const navigate = useNavigate();

  // ===== ИНИЦИАЛИЗАЦИЯ TELEGRAM WEBAPP =====

  useEffect(() => {
    // Инициализация Telegram WebApp
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
    }
  }, []);

  // ===== ОБРАБОТЧИКИ СОБЫТИЙ =====

  /**
   * Основная функция входа
   */
  const handleLogin = useCallback(async () => {
    setIsConnecting(true);
    setError(null);
    
    let gameSocket: WebSocket | null = null;
    let connectionTimeout: NodeJS.Timeout | null = null;
    
    try {
      // Проверка доступности Telegram WebApp
      if (!TelegramAuth.isTelegramWebAppAvailable() && process.env.NODE_ENV === 'production') {
        throw new Error(ERROR_MESSAGES.TELEGRAM_NOT_AVAILABLE);
      }

      // Получение пользователя
      const user = TelegramAuth.getTelegramUser();
      if (!user) {
        throw new Error(ERROR_MESSAGES.SERVER_AUTH_FAILED);
      }

      // Получение initData из Telegram WebApp
      const initData = TelegramAuth.isTelegramWebAppAvailable() 
        ? window.Telegram?.WebApp?.initData || ''
        : '';

      console.log('🎯 Starting authentication process...');

      // ✅ ОБНОВЛЕННАЯ аутентификация на сервере
      const { token, sessionId, user: playerData } = await authenticateWithRetry(initData, user);

      console.log('✅ Authentication successful:', { sessionId, hasToken: !!token });

      // Сохранение токенов
      localStorage.setItem(CONFIG.STORAGE_KEYS.GAME_TOKEN, token);
      localStorage.setItem(CONFIG.STORAGE_KEYS.SESSION_ID, sessionId);

      // Подключение к WebSocket серверу
      gameSocket = new WebSocket(getWebSocketUrl(token));
      
      connectionTimeout = setTimeout(() => {
        gameSocket?.close();
        throw new Error(ERROR_MESSAGES.CONNECTION_TIMEOUT);
      }, CONFIG.CONNECTION_TIMEOUT);

      gameSocket.onopen = () => {
        if (connectionTimeout) {
          clearTimeout(connectionTimeout);
        }
        console.log('🎮 WebSocket connected successfully');
        // Успешное подключение - переход на главную
        navigate('/');
      };

      gameSocket.onerror = () => {
        throw new Error(ERROR_MESSAGES.WEBSOCKET_FAILED);
      };

      gameSocket.onclose = (event) => {
        if (event.code !== 1000) { // Не нормальное закрытие
          throw new Error(ERROR_MESSAGES.WEBSOCKET_FAILED);
        }
      };

    } catch (err) {
      // Cleanup при ошибке
      if (connectionTimeout) {
        clearTimeout(connectionTimeout);
      }
      if (gameSocket) {
        gameSocket.close();
      }
      
      const errorMessage = err instanceof Error ? err.message : ERROR_MESSAGES.GENERIC;
      console.error('❌ Login error:', err);
      setError(errorMessage);
    } finally {
      setIsConnecting(false);
    }
  }, [navigate]);

  /**
   * Обработчик повторной попытки
   */
  const handleRetry = useCallback(() => {
    setError(null);
    handleLogin();
  }, [handleLogin]);

  // ===== РЕНДЕР =====

  return (
    <Container 
      className="d-flex justify-content-center align-items-center min-vh-100"
      role="main"
      aria-label="Страница входа в игру"
    >
      <Card style={{ width: '400px' }}>
        <Card.Body className="text-center">
          <h2 className="mb-4" id="login-title">
            {UI_TEXT.PAGE_TITLE}
          </h2>

          {/* Отображение ошибки */}
          {error && (
            <Alert 
              variant="danger" 
              className="mb-3"
              role="alert"
              aria-live="assertive"
            >
              {error}
            </Alert>
          )}

          {/* Кнопка входа */}
          <Button 
            variant="primary" 
            size="lg" 
            onClick={handleLogin}
            disabled={isConnecting}
            className="w-100 mb-3"
            aria-describedby="login-title"
            aria-label={isConnecting ? "Подключение к серверу" : "Войти через Telegram"}
          >
            {isConnecting ? (
              <>
                <Spinner 
                  size="sm" 
                  className="me-2"
                  role="status"
                  aria-hidden="true"
                />
                {UI_TEXT.CONNECTING_TEXT}
              </>
            ) : (
              UI_TEXT.LOGIN_BUTTON
            )}
          </Button>

          {/* Кнопка повтора при ошибке */}
          {error && !isConnecting && (
            <Button 
              variant="outline-secondary" 
              onClick={handleRetry}
              className="w-100"
              aria-label="Попробовать войти снова"
            >
              {UI_TEXT.RETRY_BUTTON}
            </Button>
          )}

          {/* Fallback сообщение для не-Telegram окружения */}
          {!TelegramAuth.isTelegramWebAppAvailable() && process.env.NODE_ENV === 'production' && (
            <Alert variant="warning" className="mt-3">
              {UI_TEXT.FALLBACK_MESSAGE}
            </Alert>
          )}

          {/* Debug информация для разработки */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-3 pt-3 border-top">
              <small className="text-muted">
                <strong>Debug Info:</strong>
                <br />
                Telegram Available: {TelegramAuth.isTelegramWebAppAvailable() ? 'Yes' : 'No'}
                <br />
                Environment: {process.env.NODE_ENV}
                <br />
                WebSocket URL: {CONFIG.WEBSOCKET_URL}
                <br />
                API URL: {CONFIG.API_BASE_URL}
              </small>
            </div>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

// Установка displayName для лучшей отладки
LoginPage.displayName = 'LoginPage';

// ===== ЭКСПОРТ =====
export default LoginPage;
export type { LoginPageProps };
export { CONFIG, ERROR_MESSAGES, UI_TEXT };
