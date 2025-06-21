// src/pages/LoginPage.tsx - СТРАНИЦА ВХОДА В ИГРУ

import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Spinner, Alert } from 'react-bootstrap';
import { useAuth } from '../hooks/useAuth';
import { TelegramAuth } from '../utils/TelegramAuth';

// ===== ТИПЫ =====

interface AuthSuccessResponse {
  success: true;
  token: string;
  sessionId: string;
}

interface AuthErrorResponse {
  success: false;
  message: string;
  error?: string;
}

type AuthResponse = AuthSuccessResponse | AuthErrorResponse;

// ===== КОНСТАНТЫ =====

const AUTH_CONFIG = {
  MAX_RETRIES: 3,
  RETRY_DELAY_BASE: 1000,
  REQUEST_TIMEOUT: 10000
} as const;

const ERROR_MESSAGES = {
  NO_TELEGRAM_DATA: 'Не удалось получить данные из Telegram',
  AUTH_FAILED: 'Ошибка аутентификации',
  NETWORK_ERROR: 'Ошибка сети',
  SERVER_ERROR: 'Ошибка сервера',
  TIMEOUT: 'Превышено время ожидания'
} as const;

// ===== УТИЛИТЫ =====

const sleep = (ms: number): Promise<void> => 
  new Promise(resolve => setTimeout(resolve, ms));

const validateAuthResponse = (data: any): data is AuthSuccessResponse => {
  return data && 
    data.success === true &&
    typeof data.token === 'string' && 
    data.token.length > 0;
};

// ===== ОСНОВНОЙ КОМПОНЕНТ =====

export const LoginPage: React.FC = () => {
  // ===== ХУКИ =====
  const navigate = useNavigate();
  const auth = useAuth();

  // ===== СОСТОЯНИЯ =====
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState({
    hasTelegramData: false,
    initDataLength: 0,
    userInfo: null as any
  });

  // ===== ИНИЦИАЛИЗАЦИЯ =====

  useEffect(() => {
    // Инициализация Telegram WebApp
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.ready();
      window.Telegram.WebApp.expand();
      window.Telegram.WebApp.setHeaderColor('#2c3e50');
      
      // Настройка поведения
      window.Telegram.WebApp.enableClosingConfirmation();
      window.Telegram.WebApp.disableVerticalSwipes();
    }

    // Получение пользователя для debug
    const telegramUser = TelegramAuth.getTelegramUser();
    const initData = TelegramAuth.isTelegramWebAppAvailable() 
      ? window.Telegram?.WebApp?.initData || ''
      : '';

    setDebugInfo({
      hasTelegramData: !!telegramUser,
      initDataLength: initData.length,
      userInfo: telegramUser
    });
  }, []);

  // ===== АУТЕНТИФИКАЦИЯ С ПОВТОРАМИ =====

  const authenticateWithRetry = useCallback(async (
    initData: string,
    attempt = 1
  ): Promise<AuthResponse> => {
    try {
      console.log(`🔐 Authentication attempt ${attempt}/${AUTH_CONFIG.MAX_RETRIES}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), AUTH_CONFIG.REQUEST_TIMEOUT);

      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/auth/telegram`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ initData }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      console.log('📡 Response status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('📋 Response data structure:', {
        hasSuccess: !!data.success,
        successValue: data.success,
        hasToken: !!data.token,
        hasError: !!data.error
      });

      if (!validateAuthResponse(data)) {
        throw new Error(data.message || ERROR_MESSAGES.AUTH_FAILED);
      }

      return data;

    } catch (err) {
      if (err.name === 'AbortError') {
        throw new Error(ERROR_MESSAGES.TIMEOUT);
      }

      if (attempt < AUTH_CONFIG.MAX_RETRIES) {
        console.log(`⏳ Retry ${attempt + 1} after ${AUTH_CONFIG.RETRY_DELAY_BASE * attempt}ms...`);
        await sleep(AUTH_CONFIG.RETRY_DELAY_BASE * attempt);
        return authenticateWithRetry(initData, attempt + 1);
      }

      throw err instanceof Error ? err : new Error(ERROR_MESSAGES.NETWORK_ERROR);
    }
  }, []);

  // ===== ОСНОВНАЯ ФУНКЦИЯ ВХОДА =====

  const handleLogin = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('🎯 Starting authentication process...');

      // Получение данных из Telegram
      const user = TelegramAuth.getTelegramUser();
      if (!user) {
        throw new Error(ERROR_MESSAGES.NO_TELEGRAM_DATA);
      }

      const initData = TelegramAuth.isTelegramWebAppAvailable() 
        ? window.Telegram?.WebApp?.initData || ''
        : '';

      if (!initData) {
        throw new Error('Отсутствуют данные инициализации Telegram');
      }

      console.log('🔐 Sending auth request with initData length:', initData.length);

      // Аутентификация на сервере
      const authData = await authenticateWithRetry(initData);

      console.log('✅ Authentication successful:', { 
        sessionId: authData.sessionId, 
        hasToken: !!authData.token 
      });

      // Обновление AuthProvider состояния
      console.log('🔄 Updating authentication state...');
      await auth.authenticate(authData.token);

      // Переход к главному меню
      console.log('➡️ Navigating to main menu...');
      navigate('/');

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : ERROR_MESSAGES.AUTH_FAILED;
      console.error('❌ Authentication error:', err);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [auth, authenticateWithRetry, navigate]);

  // ===== РЕНДЕР =====

  return (
    <Container 
      fluid 
      className="min-vh-100 d-flex align-items-center justify-content-center bg-gradient"
      role="main"
      aria-label="Страница входа в игру"
    >
      <Row className="w-100 justify-content-center">
        <Col xs={12} sm={10} md={8} lg={6} xl={5} xxl={4}>
          <Card className="shadow-lg border-0 rounded-4">
            <Card.Header className="text-center py-4 bg-primary text-white rounded-top-4">
              <h2 className="mb-0 fw-bold">
                🃏 Дурак Онлайн
              </h2>
              <small className="opacity-75">Добро пожаловать в игру!</small>
            </Card.Header>
            
            <Card.Body className="p-4">
              {error && (
                <Alert 
                  variant="danger" 
                  className="mb-4"
                  role="alert"
                  aria-live="assertive"
                >
                  <Alert.Heading className="h6 mb-2">
                    ⚠️ Ошибка входа
                  </Alert.Heading>
                  <p className="mb-2">{error}</p>
                  <Button 
                    variant="outline-danger" 
                    size="sm" 
                    onClick={() => setError(null)}
                    aria-label="Закрыть уведомление об ошибке"
                  >
                    Закрыть
                  </Button>
                </Alert>
              )}

              <div className="text-center">
                <div className="mb-4">
                  <div className="display-1 mb-3">🎮</div>
                  <h4 className="mb-3">Готовы к игре?</h4>
                  <p className="text-muted mb-4">
                    Для входа в игру нужно авторизоваться через Telegram
                  </p>
                </div>

                <div className="d-grid gap-2">
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={handleLogin}
                    disabled={isLoading}
                    className="py-3 fw-medium rounded-3"
                    aria-describedby="login-button-help"
                  >
                    {isLoading ? (
                      <>
                        <Spinner
                          animation="border"
                          size="sm"
                          className="me-2"
                          role="status"
                          aria-hidden="true"
                        />
                        Вход в игру...
                      </>
                    ) : (
                      <>
                        🚀 Войти в игру
                      </>
                    )}
                  </Button>
                  
                  <small id="login-button-help" className="text-muted">
                    Безопасная авторизация через Telegram
                  </small>
                </div>
              </div>

              {!TelegramAuth.isTelegramWebAppAvailable() && (
                <Alert variant="warning" className="mt-4 mb-0">
                  <Alert.Heading className="h6 mb-2">
                    ℹ️ Информация
                  </Alert.Heading>
                  <p className="mb-0">
                    Для полного функционала откройте приложение в Telegram
                  </p>
                </Alert>
              )}

              {/* Debug информация для разработки */}
              {import.meta.env.DEV && (
                <div className="mt-4 pt-3 border-top">
                  <details>
                    <summary className="text-muted small cursor-pointer">
                      Debug информация
                    </summary>
                    <div className="mt-2 p-2 bg-light rounded small font-monospace">
                      <div>Telegram данные: {debugInfo.hasTelegramData ? '✅' : '❌'}</div>
                      <div>InitData длина: {debugInfo.initDataLength}</div>
                      <div>Пользователь: {debugInfo.userInfo?.first_name || 'Не найден'}</div>
                      <div>Auth состояние: {auth.isAuthenticated ? '✅ Авторизован' : '❌ Не авторизован'}</div>
                    </div>
                  </details>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

// Установка displayName для лучшей отладки
LoginPage.displayName = 'LoginPage';

// ===== ЭКСПОРТ =====
export default LoginPage;