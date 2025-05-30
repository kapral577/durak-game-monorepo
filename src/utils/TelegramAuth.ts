// src/utils/TelegramAuth.ts - ФРОНТЕНД - ИСПРАВЛЕНЫ ТОЛЬКО СИНТАКСИЧЕСКИЕ ОШИБКИ
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
} // ✅ ДОБАВЛЕНА недостающая скобка

declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp;
    };
  }
} // ✅ ДОБАВЛЕНА недостающая скобка

export class TelegramAuth {
  static getTelegramUser(): TelegramUser | null {
    console.log('🔍 Getting Telegram user...'); // ✅ ДОБАВЛЕН debug
    
    if (window.Telegram?.WebApp?.initDataUnsafe?.user) {
      const user = window.Telegram.WebApp.initDataUnsafe.user;
      console.log('✅ Telegram user found:', user);
      return user;
    }

    console.log('❌ No Telegram user found');
    return null;
  } // ✅ ДОБАВЛЕНА недостающая скобка

  static getTelegramInitData(): string {
    const initData = window.Telegram?.WebApp?.initData || '';
    console.log('📄 Init data length:', initData.length);
    return initData;
  } // ✅ ДОБАВЛЕНА недостающая скобка

  static isInTelegram(): boolean {
    const isInTelegram = Boolean(window.Telegram?.WebApp);
    console.log('🔍 Is in Telegram:', isInTelegram);
    return isInTelegram;
  } // ✅ ДОБАВЛЕНА недостающая скобка

  static initTelegramApp(): void {
    console.log('🚀 Initializing Telegram App...');
    
    if (window.Telegram?.WebApp) {
      console.log('✅ Telegram WebApp detected, calling ready() and expand()');
      window.Telegram.WebApp.ready();
      window.Telegram.WebApp.expand();
      console.log('✅ Telegram WebApp initialized successfully');
    } else {
      console.log('❌ Telegram WebApp not available');
    }
  } // ✅ ДОБАВЛЕНА недостающая скобка

  // Для разработки - фейковый пользователь
  static getMockUser(): TelegramUser {
    console.log('🧪 Using mock user for development');
    
    return {
      id: 123456789,
      first_name: 'Test',
      last_name: 'User',
      username: 'testuser',
      language_code: 'ru',
    };
  } // ✅ ДОБАВЛЕНА недостающая скобка
} // ✅ ДОБАВЛЕНА недостающая скобка
