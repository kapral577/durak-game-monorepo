// src/utils/TelegramAuth.ts - ФРОНТЕНД - НОВЫЙ
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
  };
  ready: () => void;
  expand: () => void;
  close: () => void;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp;
    };
  }
}

export class TelegramAuth {
  static getTelegramUser(): TelegramUser | null {
    if (window.Telegram?.WebApp?.initDataUnsafe?.user) {
      return window.Telegram.WebApp.initDataUnsafe.user;
    }
    return null;
  }

  static getTelegramInitData(): string {
    return window.Telegram?.WebApp?.initData || '';
  }

  static isInTelegram(): boolean {
    return !!window.Telegram?.WebApp;
  }

  static initTelegramApp(): void {
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.ready();
      window.Telegram.WebApp.expand();
    }
  }

  // Для разработки - фейковый пользователь
  static getMockUser(): TelegramUser {
    return {
      id: 123456789,
      first_name: 'Test',
      last_name: 'User',
      username: 'testuser',
      language_code: 'ru',
    };
  }
}
