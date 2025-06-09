// src/utils/TelegramAuth.ts - УТИЛИТЫ ДЛЯ РАБОТЫ С TELEGRAM WEBAPP ФРОНТЕНД

import { Player, TelegramUser } from '@shared/types';
import { AuthSuccessResponse, AuthErrorResponse } from '../types/AuthTypes';

// ===== ТИПИЗАЦИЯ TELEGRAM WEBAPP API =====

declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp;
    };
  }
}

interface TelegramWebApp {
  initData: string;
  initDataUnsafe: {
    user?: TelegramUser;
    auth_date: number;
    hash: string;
    query_id?: string;
  };
  ready: () => void;
  expand: () => void;
  close: () => void;
  enableClosingConfirmation: () => void;
  disableVerticalSwipes: () => void;
  colorScheme: 'light' | 'dark';
  isVersionAtLeast: (version: string) => boolean;
  openTelegramLink: (url: string) => void;
}

// ===== КОНСТАНТЫ =====

const AUTH_CONSTANTS = {
  MAX_AUTH_AGE_HOURS: 24,
  MAX_RETRIES: 3,
  RETRY_DELAY_BASE: 1000,
  MOCK_USER_ID: 999999999
} as const;

// ✅ ИСПРАВЛЕН ENDPOINT
const API_ENDPOINTS = {
  TELEGRAM_AUTH: '/auth/telegram'  // ← Изменено с validate-telegram
} as const;

const ERROR_MESSAGES = {
  NO_TELEGRAM_WEBAPP: 'Приложение должно быть запущено в Telegram',
  NO_USER_DATA: 'Не удалось получить данные пользователя из Telegram',
  AUTH_DATE_EXPIRED: 'Данные аутентификации устарели',
  SERVER_VALIDATION_FAILED: 'Ошибка валидации на сервере',
  NETWORK_ERROR: 'Ошибка сети',
  MISSING_CONFIG: 'Отсутствует конфигурация API',
  INVALID_RESPONSE: 'Неверный формат ответа сервера'
} as const;

// ===== ОСНОВНОЙ КЛАСС =====

export class TelegramAuth {
  
  /**
   * Проверка доступности Telegram WebApp
   */
  static isTelegramWebAppAvailable(): boolean {
    return typeof window !== 'undefined' && 
           window.Telegram?.WebApp !== undefined;
  }

  /**
   * Получение пользователя из Telegram WebApp
   */
  static getTelegramUser(): TelegramUser | null {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Getting Telegram user...');
    }

    if (!this.isTelegramWebAppAvailable()) {
      if (process.env.NODE_ENV === 'development') {
        console.log('⚠️ Telegram WebApp not available, using mock user');
        return this.getMockUser();
      }
      return null;
    }

    const user = window.Telegram!.WebApp.initDataUnsafe.user;
    
    if (!user) {
      if (process.env.NODE_ENV === 'development') {
        console.log('⚠️ No user in initDataUnsafe, using mock user');
        return this.getMockUser();
      }
      return null;
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Got Telegram user:', { 
        id: user.id, 
        first_name: user.first_name,
        username: user.username 
      });
    }

    return user;
  }

  /**
   * Получение initData из Telegram WebApp
   */
  static getTelegramInitData(): string {
    if (!this.isTelegramWebAppAvailable()) {
      if (process.env.NODE_ENV === 'development') {
        // Мок данные для разработки
        return 'user=%7B%22id%22%3A999999999%2C%22first_name%22%3A%22Test%22%2C%22last_name%22%3A%22User%22%2C%22username%22%3A%22testuser%22%2C%22language_code%22%3A%22ru%22%7D&auth_date=' + Math.floor(Date.now() / 1000);
      }
      return '';
    }

    return window.Telegram?.WebApp?.initData || '';
  }

  /**
   * ✅ ОБНОВЛЕННАЯ серверная валидация под новый endpoint
   */
  static async validateOnServer(initData: string): Promise<boolean> {
    if (!initData) {
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ Missing initData for validation');
      }
      return false;
    }

    try {
      const apiUrl = import.meta.env.VITE_API_URL;
      if (!apiUrl) {
        throw new Error(ERROR_MESSAGES.MISSING_CONFIG);
      }

      console.log('🔍 API URL:', apiUrl);
      // ✅ ИЗМЕНЕН ENDPOINT
      console.log('🔍 Full URL:', `${apiUrl}${API_ENDPOINTS.TELEGRAM_AUTH}`);
      console.log('🔍 InitData length:', initData?.length);

      // ✅ НОВЫЙ ENDPOINT
      const response = await fetch(`${apiUrl}${API_ENDPOINTS.TELEGRAM_AUTH}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ initData }),
      });

      if (!response.ok) {
        throw new Error(`Server validation failed: ${response.status} ${response.statusText}`);
      }

      // ✅ ИСПОЛЬЗУЕМ ПРАВИЛЬНЫЕ ТИПЫ
      const result: AuthSuccessResponse | AuthErrorResponse = await response.json();
      
      if (result.success === false) {
        throw new Error(result.error || 'Server validation failed');
      }

      // Проверка обязательных полей для успешного ответа
      if (result.success && (!result.token || !result.sessionId)) {
        throw new Error('Missing required auth data (token or sessionId)');
      }

      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Server validation successful:', { 
          hasToken: !!result.token, 
          hasSessionId: !!result.sessionId,
          hasUser: !!result.user 
        });
      }

      return result.success;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ Server validation error:', error);
      }
      throw error;
    }
  }

  /**
   * Валидация с повторными попытками
   */
  static async validateOnServerWithRetry(
    initData: string, 
    retryCount = 0
  ): Promise<boolean> {
    try {
      return await this.validateOnServer(initData);
    } catch (error) {
      if (retryCount < AUTH_CONSTANTS.MAX_RETRIES) {
        if (process.env.NODE_ENV === 'development') {
          console.log(`🔄 Retrying validation (${retryCount + 1}/${AUTH_CONSTANTS.MAX_RETRIES})`);
        }
        
        const delay = AUTH_CONSTANTS.RETRY_DELAY_BASE * Math.pow(2, retryCount);
        await new Promise(resolve => setTimeout(resolve, delay));
        
        return this.validateOnServerWithRetry(initData, retryCount + 1);
      }
      
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ Server validation failed after retries:', error);
      }
      
      return false;
    }
  }

  /**
   * Инициализация Telegram WebApp
   */
  static initializeTelegramWebApp(): void {
    if (!this.isTelegramWebAppAvailable()) {
      if (process.env.NODE_ENV === 'development') {
        console.log('⚠️ Telegram WebApp not available, skipping initialization');
      }
      return;
    }

    try {
      const tg = window.Telegram!.WebApp;
      
      tg.ready();
      tg.expand();
      tg.enableClosingConfirmation();
      tg.disableVerticalSwipes();
      
      // Настройка темы
      if (tg.colorScheme === 'dark') {
        document.body.classList.add('dark-theme');
      }

      if (process.env.NODE_ENV === 'development') {
        console.log('📱 Telegram WebApp initialized successfully');
        console.log('🎨 Color scheme:', tg.colorScheme);
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ Error initializing Telegram WebApp:', error);
      }
    }
  }

  /**
   * Работа с токенами
   */
  static saveTokens(token: string, sessionId: string): void {
    localStorage.setItem('gameToken', token);
    localStorage.setItem('sessionId', sessionId);
  }

  static getStoredToken(): string | null {
    return localStorage.getItem('gameToken');
  }

  static getStoredSessionId(): string | null {
    return localStorage.getItem('sessionId');
  }

  static clearTokens(): void {
    localStorage.removeItem('gameToken');
    localStorage.removeItem('sessionId');
  }

  static isAuthenticated(): boolean {
    const token = this.getStoredToken();
    const sessionId = this.getStoredSessionId();
    return !!(token && sessionId);
  }

  /**
   * Получение mock пользователя для разработки
   */
  private static getMockUser(): TelegramUser {
    return {
      id: AUTH_CONSTANTS.MOCK_USER_ID,
      first_name: 'Test User',
      last_name: 'Developer',
      username: 'test_user',
      language_code: 'ru'
    };
  }

  /**
   * Проверка, является ли пользователь mock пользователем
   */
  static isMockUser(userId: number): boolean {
    return userId === AUTH_CONSTANTS.MOCK_USER_ID;
  }
}

// ===== ЭКСПОРТ =====
export type { TelegramWebApp };
export { AUTH_CONSTANTS, ERROR_MESSAGES, API_ENDPOINTS };
