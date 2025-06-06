// src/utils/TelegramAuth.ts - УТИЛИТЫ ДЛЯ РАБОТЫ С TELEGRAM WEBAPP

import { Player, TelegramUser, TelegramInitData } from '@shared/types';

// ===== ТИПИЗАЦИЯ TELEGRAM WEBAPP API =====

declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp;
    };
  }
}

/**
 * Интерфейс пользователя Telegram
 */
interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
}

/**
 * Интерфейс Telegram WebApp
 */
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

/**
 * Результат валидации аутентификации
 */
interface AuthValidationResult {
  isValid: boolean;
  user?: TelegramUser;
  error?: string;
}

/**
 * Ответ сервера валидации
 */
interface ServerValidationResponse {
  valid: boolean;
  user?: Player;
  error?: string;
}

// ===== КОНСТАНТЫ =====

const AUTH_CONSTANTS = {
  MAX_AUTH_AGE_HOURS: 24,
  CACHE_DURATION_MS: 5 * 60 * 1000, // 5 минут
  MAX_RETRIES: 3,
  RETRY_DELAY_BASE: 1000,
  MOCK_USER_ID_PREFIX: 'test-'
} as const;

const API_ENDPOINTS = {
  VALIDATE_TELEGRAM: '/auth/validate-telegram',
  LOGIN: '/auth/login'
} as const;

const ERROR_MESSAGES = {
  NO_TELEGRAM_WEBAPP: 'Приложение должно быть запущено в Telegram',
  NO_USER_DATA: 'Не удалось получить данные пользователя из Telegram',
  AUTH_DATE_EXPIRED: 'Данные аутентификации устарели',
  INVALID_HASH: 'Неверная подпись данных',
  SERVER_VALIDATION_FAILED: 'Ошибка валидации на сервере',
  NETWORK_ERROR: 'Ошибка сети',
  MISSING_CONFIG: 'Отсутствует конфигурация API',
  INVALID_RESPONSE: 'Неверный формат ответа сервера'
} as const;

// ===== ОСНОВНОЙ КЛАСС =====

/**
 * Утилитарный класс для работы с Telegram WebApp аутентификацией
 */
export class TelegramAuth {
  // Кэш для результатов валидации
  private static validationCache = new Map<string, { 
    result: boolean; 
    timestamp: number; 
    user?: TelegramUser 
  }>();

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
      console.log('✅ Got Telegram user:', user);
    }

    return user;
  }

  /**
   * Валидация пользователя и auth_date
   */
  static validateUser(user: TelegramUser): AuthValidationResult {
    if (!user) {
      return {
        isValid: false,
        error: ERROR_MESSAGES.NO_USER_DATA
      };
    }

    if (!user.id || !user.first_name) {
      return {
        isValid: false,
        error: 'Неполные данные пользователя'
      };
    }

    // Проверка auth_date только для реальных пользователей
    if (!user.id.toString().startsWith(AUTH_CONSTANTS.MOCK_USER_ID_PREFIX)) {
      const authDate = window.Telegram?.WebApp?.initDataUnsafe?.auth_date;
      
      if (authDate) {
        const authTime = authDate * 1000; // Конвертация в миллисекунды
        const currentTime = Date.now();
        const maxAge = AUTH_CONSTANTS.MAX_AUTH_AGE_HOURS * 60 * 60 * 1000;
        
        if (currentTime - authTime > maxAge) {
          return {
            isValid: false,
            error: ERROR_MESSAGES.AUTH_DATE_EXPIRED
          };
        }
      }
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ User validation passed');
    }

    return {
      isValid: true,
      user
    };
  }

  /**
   * Серверная валидация с кэшированием
   */
  static async validateOnServerCached(initData: string, botToken: string): Promise<boolean> {
    const cacheKey = `${initData}_${botToken}`;
    const cached = this.validationCache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < AUTH_CONSTANTS.CACHE_DURATION_MS) {
      if (process.env.NODE_ENV === 'development') {
        console.log('📋 Using cached validation result');
      }
      return cached.result;
    }
    
    const result = await this.validateOnServerWithRetry(initData, botToken);
    this.validationCache.set(cacheKey, { 
      result, 
      timestamp: Date.now() 
    });
    
    return result;
  }

  /**
   * Серверная валидация с повторными попытками
   */
  static async validateOnServerWithRetry(
    initData: string, 
    botToken: string, 
    retryCount = 0
  ): Promise<boolean> {
    try {
      return await this.validateOnServer(initData, botToken);
    } catch (error) {
      if (retryCount < AUTH_CONSTANTS.MAX_RETRIES) {
        if (process.env.NODE_ENV === 'development') {
          console.log(`🔄 Retrying validation (${retryCount + 1}/${AUTH_CONSTANTS.MAX_RETRIES})`);
        }
        
        const delay = AUTH_CONSTANTS.RETRY_DELAY_BASE * Math.pow(2, retryCount);
        await new Promise(resolve => setTimeout(resolve, delay));
        
        return this.validateOnServerWithRetry(initData, botToken, retryCount + 1);
      }
      
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ Server validation failed after retries:', error);
      }
      
      return false;
    }
  }

  /**
   * Серверная валидация
   */
  static async validateOnServer(initData: string, botToken: string): Promise<boolean> {
    if (!initData || !botToken) {
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ Missing initData or botToken for validation');
      }
      return false;
    }

    try {
      const apiUrl = import.meta.env.VITE_API_URL;
      if (!apiUrl) {
        throw new Error(ERROR_MESSAGES.MISSING_CONFIG);
      }

      const response = await fetch(`${apiUrl}${API_ENDPOINTS.VALIDATE_TELEGRAM}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ initData, botToken }),
      });

      if (!response.ok) {
        throw new Error(`Server validation failed: ${response.status} ${response.statusText}`);
      }

      const result: ServerValidationResponse = await response.json();
      
      if (typeof result.valid !== 'boolean') {
        throw new Error(ERROR_MESSAGES.INVALID_RESPONSE);
      }

      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Server validation result:', result.valid);
      }

      return result.valid;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ Server validation error:', error);
      }
      throw error;
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
   * Получение mock пользователя для разработки
   */
  private static getMockUser(): TelegramUser {
    return {
      id: parseInt(`${AUTH_CONSTANTS.MOCK_USER_ID_PREFIX}${Date.now()}`),
      first_name: 'Test User',
      last_name: 'Developer',
      username: 'test_user',
      language_code: 'ru'
    };
  }

  /**
   * Валидация переменных окружения
   */
  static validateEnvironment(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!import.meta.env.VITE_API_URL) {
      errors.push('VITE_API_URL is not configured');
    }
    
    if (!import.meta.env.VITE_BOT_TOKEN && process.env.NODE_ENV === 'production') {
      errors.push('VITE_BOT_TOKEN is required in production');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Получение языка пользователя
   */
  static getLanguageCode(): string {
    return window.Telegram?.WebApp?.initDataUnsafe?.user?.language_code || 'en';
  }

  /**
   * Получение фото пользователя
   */
  static getUserPhoto(): string | null {
    return window.Telegram?.WebApp?.initDataUnsafe?.user?.photo_url || null;
  }

  /**
   * Получение query_id
   */
  static getQueryId(): string | null {
    return window.Telegram?.WebApp?.initDataUnsafe?.query_id || null;
  }

  /**
   * Закрытие Telegram приложения
   */
  static closeTelegramApp(): void {
    try {
      window.Telegram?.WebApp?.close();
      if (process.env.NODE_ENV === 'development') {
        console.log('📱 Telegram app closed');
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error closing Telegram app:', error);
      }
    }
  }

  /**
   * Очистка кэша валидации
   */
  static clearValidationCache(): void {
    this.validationCache.clear();
    if (process.env.NODE_ENV === 'development') {
      console.log('🗑️ Validation cache cleared');
    }
  }

  /**
   * Получение статистики кэша
   */
  static getCacheStats(): { size: number; entries: number } {
    return {
      size: this.validationCache.size,
      entries: Array.from(this.validationCache.values()).length
    };
  }
}

// ===== ЭКСПОРТ ДОПОЛНИТЕЛЬНЫХ ТИПОВ =====
export type { 
  TelegramUser,
  TelegramWebApp,
  AuthValidationResult,
  ServerValidationResponse 
};

export { AUTH_CONSTANTS, ERROR_MESSAGES, API_ENDPOINTS };
