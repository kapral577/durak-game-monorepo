// src/main.tsx - РЕФАКТОРИРОВАННАЯ ВЕРСИЯ ДЛЯ TELEGRAM MINI APP

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

// ✅ ПЕРВЫМ: базовые стили Telegram
import './index.css';

// ✅ ПОСЛЕДНИМ: кастомный Bootstrap (приоритет)
import './styles/custom-bootstrap.scss';

import App from './App.tsx';

// ===== ИНИЦИАЛИЗАЦИЯ TELEGRAM WEBAPP =====
const initializeTelegramWebApp = (): void => {
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
      
      // Настройка темы (опционально)
      if (tg.themeParams) {
        tg.setHeaderColor(tg.themeParams.bg_color || '#2a2a2a');
        tg.setBackgroundColor(tg.themeParams.bg_color || '#2a2a2a');
      }
      
      if (process.env.NODE_ENV === 'development') {
        console.log('Telegram WebApp initialized successfully');
        console.log('Version:', tg.version);
        console.log('Platform:', tg.platform);
      }
    } else if (process.env.NODE_ENV === 'development') {
      console.warn('Telegram WebApp API not available - running in browser mode');
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Failed to initialize Telegram WebApp:', error);
    }
  }
};

// ===== ПРОВЕРКА ROOT ЭЛЕМЕНТА =====
const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found. Make sure index.html contains <div id="root"></div>');
}

// ===== ИНИЦИАЛИЗАЦИЯ =====
initializeTelegramWebApp();

// ===== РЕНДЕР ПРИЛОЖЕНИЯ =====
const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);

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
        themeParams: {
          bg_color?: string;
          text_color?: string;
          hint_color?: string;
          link_color?: string;
          button_color?: string;
          button_text_color?: string;
        };
        initDataUnsafe: {
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
