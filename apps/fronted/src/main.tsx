// src/main.tsx - УЛУЧШЕННАЯ ВЕРСИЯ

import React from 'react';
import ReactDOM from 'react-dom/client';

// ✅ ПЕРВЫМ: базовые стили Telegram
import './index.css';

// ✅ ПОСЛЕДНИМ: кастомный Bootstrap (приоритет)
import './styles/custom-bootstrap.scss';

import App from './App';

// ===== КОНСТАНТЫ =====
const TELEGRAM_CONFIG = {
  DEFAULT_HEADER_COLOR: '#2a2a2a',
  DEFAULT_BG_COLOR: '#2a2a2a',
  INIT_TIMEOUT: 100
} as const;

// ===== ТИПЫ ДЛЯ TELEGRAM WEBAPP =====
declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        ready: () => void;
        expand: () => void;
        close: () => void;
        enableClosingConfirmation: () => void;
        disableVerticalSwipes: () => void;
        setHeaderColor: (color: string) => void;
        setBackgroundColor: (color: string) => void;
        version: string;
        platform: string;
        themeParams?: {
          bg_color?: string;
          text_color?: string;
          hint_color?: string;
          link_color?: string;
          button_color?: string;
          button_text_color?: string;
        };
        initDataUnsafe?: {
          user?: {
            id: number;
            first_name: string;
            last_name?: string;
            username?: string;
            language_code?: string;
          };
          query_id?: string;
          auth_date?: number;
          hash?: string;
        };
      };
    };
  }
}

// ===== ИНИЦИАЛИЗАЦИЯ TELEGRAM WEBAPP =====
const initializeTelegramWebApp = async (): Promise<void> => {
  try {
    // Проверяем наличие Telegram WebApp API
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      
      // Основная инициализация
      tg.ready();
      tg.expand();
      
      // Настройки для игры
      tg.enableClosingConfirmation();
      tg.disableVerticalSwipes();
      
      // Настройка темы с проверкой методов
      if (tg.themeParams && typeof tg.setHeaderColor === 'function') {
        tg.setHeaderColor(tg.themeParams.bg_color || TELEGRAM_CONFIG.DEFAULT_HEADER_COLOR);
      }
      
      if (tg.themeParams && typeof tg.setBackgroundColor === 'function') {
        tg.setBackgroundColor(tg.themeParams.bg_color || TELEGRAM_CONFIG.DEFAULT_BG_COLOR);
      }
      
      if (process.env.NODE_ENV === 'development') {
        console.log('🚀 Telegram WebApp initialized successfully');
        console.log('📱 Version:', tg.version);
        console.log('💻 Platform:', tg.platform);
        console.log('🎨 Theme:', tg.themeParams);
      }
    } else if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️ Telegram WebApp API not available - running in browser mode');
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Failed to initialize Telegram WebApp:', error);
    }
    // В production не ломаем приложение из-за ошибки Telegram API
  }
};

// ===== ПРОВЕРКА ROOT ЭЛЕМЕНТА =====
const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('❌ Root element not found. Make sure index.html contains <div id="root"></div>');
}

// ===== ИНИЦИАЛИЗАЦИЯ И РЕНДЕР =====
const startApp = async (): Promise<void> => {
  // Инициализация Telegram WebApp
  await initializeTelegramWebApp();
  
  // Небольшая задержка для полной инициализации
  await new Promise(resolve => setTimeout(resolve, TELEGRAM_CONFIG.INIT_TIMEOUT));
  
  // Рендер приложения
  const root = ReactDOM.createRoot(rootElement);
  
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  
  if (process.env.NODE_ENV === 'development') {
    console.log('🎮 Durak Game App started successfully!');
  }
};

// Запуск приложения
startApp().catch(error => {
  console.error('💥 Failed to start app:', error);
  
  // Fallback рендер без Telegram инициализации
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
});
