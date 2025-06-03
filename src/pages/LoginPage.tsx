// src/pages/LoginPage.tsx - ИСПРАВЛЕНО

import { useState } from 'react';
import { Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

// ✅ ДОБАВЛЕНО: TypeScript типы для Telegram WebApp
declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        initData: string;
        initDataUnsafe: {
          user?: {
            id: number;
            username?: string;
            first_name?: string;
            last_name?: string;
          };
        };
        ready: () => void;
        expand: () => void;
      };
    };
  }
}

const LoginPage = () => {
  const [isConnecting, setIsConnecting] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    setIsConnecting(true);
    
    try {
      // ✅ ИСПРАВЛЕНО: Проверка существования Telegram WebApp
      if (!window.Telegram?.WebApp) {
        throw new Error('Telegram WebApp not available');
      }

      // 1. Получаем данные от Telegram
      const tg = window.Telegram.WebApp;
      const initData = tg.initData;
      const user = tg.initDataUnsafe.user;
      
      if (!initData) {
        // ✅ ДОБАВЛЕНО: Fallback для тестирования вне Telegram
        console.warn('Telegram data not available, using test mode');
        
        // Временные данные для тестирования
        const testToken = 'test-token-' + Date.now();
        const testSessionId = 'test-session-' + Date.now();
        
        localStorage.setItem('gameToken', testToken);
        localStorage.setItem('sessionId', testSessionId);
        navigate('/main-menu');
        return;
      }

      // 2. Аутентификация на сервере
      const authResponse = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          initData,
          userId: user?.id,
          username: user?.username
        })
      });

      if (!authResponse.ok) {
        throw new Error('Server authentication failed');
      }

      const { token, sessionId } = await authResponse.json();

      // 3. Подключение к игровому серверу (WebSocket)
      const gameSocket = new WebSocket(`wss://your-game-server.com?token=${token}`);
      
      // ✅ ДОБАВЛЕНО: Таймаут для подключения
      const connectionTimeout = setTimeout(() => {
        gameSocket.close();
        throw new Error('Connection timeout');
      }, 10000); // 10 секунд

      gameSocket.onopen = () => {
        clearTimeout(connectionTimeout);
        console.log('Connected to game server');
        localStorage.setItem('gameToken', token);
        localStorage.setItem('sessionId', sessionId);
        navigate('/main-menu');
      };

      gameSocket.onerror = (error) => {
        clearTimeout(connectionTimeout);
        console.error('WebSocket error:', error);
        throw new Error('Game server connection failed');
      };

      gameSocket.onclose = () => {
        clearTimeout(connectionTimeout);
      };

    } catch (error) {
      console.error('Login failed:', error);
      
      // ✅ УЛУЧШЕНО: Более информативные сообщения об ошибках
      let errorMessage = 'Не удалось подключиться к серверу.';
      
      if (error instanceof Error) {
        if (error.message.includes('Telegram')) {
          errorMessage = 'Приложение должно быть запущено в Telegram.';
        } else if (error.message.includes('Server')) {
          errorMessage = 'Ошибка аутентификации сервера.';
        } else if (error.message.includes('timeout')) {
          errorMessage = 'Превышено время ожидания подключения.';
        }
      }
      
      alert(errorMessage + ' Попробуйте снова.');
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="login-container">
      {/* Декоративные элементы как в SVG */}
      <div className="decorative-blur top-center"></div>
      <div className="decorative-blur bottom-right"></div>
      <div className="decorative-blur left-side"></div>
      
      <Button 
        variant="primary" 
        size="lg"
        onClick={handleLogin}
        disabled={isConnecting}
        className="shadow-lg"
      >
        {isConnecting ? 'Подключение...' : 'Login'}
      </Button>
      
      {isConnecting && (
        <small className="text-muted mt-3 d-block text-center">
          Подключение к игровому серверу...
        </small>
      )}
      
      {/* ✅ ДОБАВЛЕНО: Подсказка для разработки */}
      {process.env.NODE_ENV === 'development' && (
        <small className="text-muted mt-4 d-block text-center">
          Режим разработки: Login работает без Telegram WebApp
        </small>
      )}
    </div>
  );
};

// ✅ ИСПРАВЛЕНО: Добавлен экспорт по умолчанию!
export default LoginPage;
