// src/utils/TelegramAuth.ts - ПОЛНОСТЬЮ РЕФАКТОРИРОВАННАЯ ВЕРСИЯ

import { Player } from '../shared/types';

// ===== ТИПЫ =====
interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
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
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp;
    };
  }
}

// ===== КОНСТАНТЫ =====
const AUTH_DATE_VALIDITY = 24 * 60 * 60; // 24 часа в секундах
const MOCK_USER_ID = 123456789;

export class TelegramAuth {
  /**
   * Получает данные пользователя Telegram
   */
  static getTelegramUser(): Player | null {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Getting Telegram user...');
    }

    try {
      const user = window.Telegram?.WebApp?.initDataUnsafe?.user;
      
      if (user && this.isValidUser(user)) {
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ Telegram user found:', user.first_name);
        }
        
        return this.convertToPlayer(user);
      }

      if (process.env.NODE_ENV === 'development') {
        console.log('❌ No valid Telegram user found');
      }
      
      return null;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error getting Telegram user:', error);
      }
      return null;
    }
  }

  /**
   * Получает initData для валидации на сервере
   */
  static getTelegramInitData(): string {
    try {
      const initData = window.Telegram?.WebApp?.initData || '';
      
      if (process.env.NODE_ENV === 'development') {
        console.log('📄 Init data available:', initData.length > 0);
      }
      
      return initData;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error getting init data:', error);
      }
      return '';
    }
  }

  /**
   * Проверяет, запущено ли приложение в Telegram
   */
  static isInTelegram(): boolean {
    const isInTelegram = Boolean(window.Telegram?.WebApp);
    
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Is in Telegram:', isInTelegram);
    }
    
    return isInTelegram;
  }

  /**
   * Инициализирует Telegram WebApp
   */
  static initTelegramApp(): void {
    if (process.env.NODE_ENV === 'development') {
      console.log('🚀 Initializing Telegram App...');
    }

    try {
      if (window.Telegram?.WebApp) {
        const tg = window.Telegram.WebApp;
        
        // Основная инициализация
        tg.ready();
        tg.expand();
        
        // Настройки для игры
        tg.enableClosingConfirmation();
        tg.disableVerticalSwipes();
        
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ Telegram WebApp initialized successfully');
        }
      } else if (process.env.NODE_ENV === 'development') {
        console.log('❌ Telegram WebApp not available');
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error initializing Telegram App:', error);
      }
    }
  }

  /**
   * Валидирует актуальность auth_date (клиентская проверка)
   */
  static isAuthDateValid(): boolean {
    try {
      const authDate = window.Telegram?.WebApp?.initDataUnsafe?.auth_date;
      
      if (!authDate) return false;
      
      const now = Math.floor(Date.now() / 1000);
      const isValid = (now - authDate) < AUTH_DATE_VALIDITY;
      
      if (process.env.NODE_ENV === 'development') {
        console.log('📅 Auth date valid:', isValid);
      }
      
      return isValid;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error validating auth date:', error);
      }
      return false;
    }
  }

  /**
   * Проверяет наличие hash для валидации
   */
  static hasValidHash(): boolean {
    try {
      const hash = window.Telegram?.WebApp?.initDataUnsafe?.hash;
      const hasHash = Boolean(hash && hash.length > 0);
      
      if (process.env.NODE_ENV === 'development') {
        console.log('🔐 Has valid hash:', hasHash);
      }
      
      return hasHash;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error checking hash:', error);
      }
      return false;
    }
  }

  /**
   * Возвращает mock пользователя для разработки
   */
  static getMockUser(): Player {
    if (process.env.NODE_ENV === 'development') {
      console.log('🧪 Using mock user for development');
    }
    
    return {
      id: MOCK_USER_ID.toString(),
      name: 'Test User',
      isReady: false,
      isConnected: true,
      lastSeen: Date.now(),
    };
  }

  // ===== ПРИВАТНЫЕ МЕТОДЫ =====

  /**
   * Валидирует структуру пользователя
   */
  private static isValidUser(user: TelegramUser): boolean {
    return Boolean(
      user &&
      typeof user.id === 'number' &&
      typeof user.first_name === 'string' &&
      user.first_name.length > 0
    );
  }

  /**
   * Конвертирует TelegramUser в Player
   */
  private static convertToPlayer(user: TelegramUser): Player {
    const displayName = user.last_name 
      ? `${user.first_name} ${user.last_name}`
      : user.first_name;

    return {
      id: user.id.toString(),
      name: displayName,
      isReady: false,
      isConnected: true,
      lastSeen: Date.now(),
    };
  }

  /**
   * Валидирует данные на сервере (должно быть реализовано на бэкенде)
   */
  static async validateOnServer(initData: string, botToken: string): Promise<boolean> {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/validate-telegram`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ initData, botToken }),
      });

      return response.ok;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Server validation failed:', error);
      }
      return false;
    }
  }
}
