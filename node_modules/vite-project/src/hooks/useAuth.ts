// src/hooks/useAuth.ts - ХУК ДЛЯ АУТЕНТИФИКАЦИИ

import { useState, useCallback, useEffect } from 'react';
import { TelegramUser, Player } from '@shared/types';
import { TelegramAuth } from '../utils/TelegramAuth';

// ===== ИНТЕРФЕЙСЫ =====

/**
 * Ответ сервера аутентификации
 */
interface AuthResponse {
  success: boolean;
  token: string;
  user: Player;
  sessionId?: string;
  expiresAt?: number;
}

/**
 * Возвращаемые данные хука useAuth
 */
export interface UseAuthReturn {
  telegramUser: TelegramUser | null;
  isAuthenticated: boolean;
  authToken: string | null;
  currentPlayer: Player | null;
  error: string | null;
  isLoading: boolean;
  authenticate: () => Promise<boolean>;
  setAuthToken: (token: string | null) => void;
  setCurrentPlayer: (player: Player | null) => void;
  logout: () => void;
  validateToken: (token: string) => Promise<boolean>;
}

// ===== КОНСТАНТЫ =====

const AUTH_CONFIG = {
  MAX_RETRIES: 3,
  RETRY_DELAY_BASE: 1000,
  TOKEN_VALIDATION_TIMEOUT: 5000
} as const;

const API_ENDPOINTS = {
  AUTH_TELEGRAM: '/auth/telegram',
  VALIDATE_TOKEN: '/auth/validate',
  LOGOUT: '/auth/logout'
} as const;

const AUTH_ERRORS = {
  NO_USER: 'Не удалось получить данные пользователя из Telegram',
  AUTH_FAILED: 'Ошибка аутентификации',
  CONNECTION_FAILED: 'Ошибка подключения к серверу',
  INIT_FAILED: 'Ошибка инициализации аутентификации',
  TOKEN_INVALID: 'Токен недействителен',
  SERVER_ERROR: 'Ошибка сервера',
  NETWORK_ERROR: 'Ошибка сети',
  TIMEOUT: 'Превышено время ожидания'
} as const;

const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_DATA: 'user_data',
  SESSION_ID: 'session_id'
} as const;

// ===== УТИЛИТАРНЫЕ ФУНКЦИИ =====

/**
 * Валидация структуры ответа аутентификации
 */
const validateAuthResponse = (data: any): data is AuthResponse => {
  return data && 
   data.success === true && 
    typeof data.token === 'string' && 
    data.token.length > 0 &&
    data.user && 
    typeof data.player.id === 'string' &&
    typeof data.player.name === 'string';
};

/**
 * Безопасное сохранение в localStorage
 */
const saveToStorage = (key: string, value: string): void => {
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    console.warn(`Failed to save ${key} to localStorage:`, error);
  }
};

/**
 * Безопасное получение из localStorage
 */
const getFromStorage = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    console.warn(`Failed to get ${key} from localStorage:`, error);
    return null;
  }
};

/**
 * Безопасное удаление из localStorage
 */
const removeFromStorage = (key: string): void => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.warn(`Failed to remove ${key} from localStorage:`, error);
  }
};

// ===== ОСНОВНОЙ ХУК =====

/**
 * Хук для управления аутентификацией пользователя
 */
export const useAuth = (): UseAuthReturn => {
  // Состояния
  const [telegramUser, setTelegramUser] = useState<TelegramUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authToken, setAuthTokenState] = useState<string | null>(null);
  const [currentPlayer, setCurrentPlayerState] = useState<Player | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // ===== МЕТОДЫ УПРАВЛЕНИЯ СОСТОЯНИЕМ =====

  /**
   * Установка токена аутентификации
   */
  const setAuthToken = useCallback((token: string | null) => {
    setAuthTokenState(token);
    if (token) {
      saveToStorage(STORAGE_KEYS.AUTH_TOKEN, token);
      setIsAuthenticated(true);
    } else {
      removeFromStorage(STORAGE_KEYS.AUTH_TOKEN);
      setIsAuthenticated(false);
    }
  }, []);

  /**
   * Установка текущего игрока
   */
  const setCurrentPlayer = useCallback((player: Player | null) => {
    setCurrentPlayerState(player);
    if (player) {
      saveToStorage(STORAGE_KEYS.USER_DATA, JSON.stringify(player));
    } else {
      removeFromStorage(STORAGE_KEYS.USER_DATA);
    }
  }, []);

  /**
   * Выход из системы
   */
  const logout = useCallback(async () => {
    try {
      // Попытка уведомить сервер о выходе
      if (authToken) {
        const apiUrl = import.meta.env.VITE_API_URL;
        if (apiUrl) {
          await fetch(`${apiUrl}${API_ENDPOINTS.LOGOUT}`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${authToken}`,
              'Content-Type': 'application/json'
            }
          });
        }
      }
    } catch (error) {
      console.warn('Error during logout request:', error);
    } finally {
      // Очистка состояния независимо от результата запроса
      setAuthToken(null);
      setCurrentPlayer(null);
      setIsAuthenticated(false);
      setError(null);
      
      // Очистка localStorage
      removeFromStorage(STORAGE_KEYS.AUTH_TOKEN);
      removeFromStorage(STORAGE_KEYS.USER_DATA);
      removeFromStorage(STORAGE_KEYS.SESSION_ID);
    }
  }, [authToken, setAuthToken, setCurrentPlayer]);

  // ===== ВАЛИДАЦИЯ ТОКЕНА =====

  /**
   * Валидация токена на сервере
   */
  const validateToken = useCallback(async (token: string): Promise<boolean> => {
    if (!token) return false;

    try {
      const apiUrl = import.meta.env.VITE_API_URL;
      if (!apiUrl) {
        console.error('VITE_API_URL not configured');
        return false;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), AUTH_CONFIG.TOKEN_VALIDATION_TIMEOUT);

      const response = await fetch(`${apiUrl}${API_ENDPOINTS.VALIDATE_TOKEN}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        return Boolean(data.valid);
      }

      return false;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.warn('Token validation timeout');
      } else {
        console.warn('Token validation error:', error);
      }
      return false;
    }
  }, []);

  // ===== АУТЕНТИФИКАЦИЯ =====

  /**
   * Аутентификация с повторными попытками
   */
  const authenticateWithRetry = useCallback(async (
    initData: string, 
    user: TelegramUser, 
    retryCount = 0
  ): Promise<AuthResponse> => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL;
      if (!apiUrl) {
        throw new Error('VITE_API_URL not configured');
      }

      const response = await fetch(`${apiUrl}${API_ENDPOINTS.AUTH_TELEGRAM}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          initData, 
          userId: user.id, 
          username: user.username || user.first_name 
        })
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
      }

      const authData = await response.json();

      if (!validateAuthResponse(authData)) {
        throw new Error('Invalid server response format');
      }

      return authData;
    } catch (error) {
      if (retryCount < AUTH_CONFIG.MAX_RETRIES) {
        const delay = AUTH_CONFIG.RETRY_DELAY_BASE * Math.pow(2, retryCount);
        await new Promise(resolve => setTimeout(resolve, delay));
        return authenticateWithRetry(initData, user, retryCount + 1);
      }
      throw error;
    }
  }, []);

  /**
   * Основная функция аутентификации
   */
  const authenticate = useCallback(async (): Promise<boolean> => {
    if (!telegramUser) {
      setError(AUTH_ERRORS.NO_USER);
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Получение initData из Telegram WebApp
      const initData = TelegramAuth.isTelegramWebAppAvailable() 
        ? window.Telegram?.WebApp?.initData || ''
        : '';

      // Аутентификация на сервере
      const authData = await authenticateWithRetry(initData, telegramUser);

      // Сохранение данных
      setAuthToken(authData.token);
      setCurrentPlayer(authData.user);
      
      if (authData.sessionId) {
        saveToStorage(STORAGE_KEYS.SESSION_ID, authData.sessionId);
      }

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : AUTH_ERRORS.AUTH_FAILED;
      console.error('Authentication error:', err);
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [telegramUser, authenticateWithRetry, setAuthToken, setCurrentPlayer]);

  // ===== ИНИЦИАЛИЗАЦИЯ =====

  /**
   * Инициализация при монтировании компонента
   */
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Получение пользователя из Telegram
        const user = TelegramAuth.getTelegramUser();
        if (user) {
          setTelegramUser(user);
        }

        // Восстановление токена из localStorage
        const savedToken = getFromStorage(STORAGE_KEYS.AUTH_TOKEN);
        if (savedToken) {
          // Валидация сохраненного токена
          const isValid = await validateToken(savedToken);
          if (isValid) {
            setAuthToken(savedToken);
            
            // Восстановление данных пользователя
            const savedUserData = getFromStorage(STORAGE_KEYS.USER_DATA);
            if (savedUserData) {
              try {
                const userData = JSON.parse(savedUserData);
                setCurrentPlayer(userData);
              } catch (error) {
                console.warn('Failed to parse saved user data:', error);
                removeFromStorage(STORAGE_KEYS.USER_DATA);
              }
            }
          } else {
            // Токен недействителен, очищаем
            removeFromStorage(STORAGE_KEYS.AUTH_TOKEN);
            removeFromStorage(STORAGE_KEYS.USER_DATA);
          }
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : AUTH_ERRORS.INIT_FAILED;
        console.error('Auth initialization error:', err);
        setError(errorMessage);
      }
    };

    initializeAuth();
  }, [validateToken, setAuthToken, setCurrentPlayer]);

  // ===== АВТОСОХРАНЕНИЕ ТОКЕНА =====

  /**
   * Автосохранение токена при изменении
   */
  useEffect(() => {
    if (authToken) {
      saveToStorage(STORAGE_KEYS.AUTH_TOKEN, authToken);
    } else {
      removeFromStorage(STORAGE_KEYS.AUTH_TOKEN);
    }
  }, [authToken]);

  // ===== ВОЗВРАТ ДАННЫХ =====

  return {
    telegramUser,
    isAuthenticated,
    authToken,
    currentPlayer,
    error,
    isLoading,
    authenticate,
    setAuthToken,
    setCurrentPlayer,
    logout,
    validateToken
  };
};

// ===== ЭКСПОРТ ДОПОЛНИТЕЛЬНЫХ ТИПОВ =====
export type { AuthResponse };
export { AUTH_CONFIG, AUTH_ERRORS, API_ENDPOINTS, STORAGE_KEYS };
