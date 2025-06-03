// src/pages/LoginPage.tsx
import { useState } from 'react';
import { Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

const LoginPage = () => {
  const [isConnecting, setIsConnecting] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    setIsConnecting(true);
    
    try {
      // 1. Получаем данные от Telegram
      const tg = window.Telegram.WebApp;
      const initData = tg.initData;
      const user = tg.initDataUnsafe.user;
      
      if (!initData) {
        throw new Error('Telegram data not available');
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
      
      gameSocket.onopen = () => {
        console.log('Connected to game server');
        localStorage.setItem('gameToken', token);
        localStorage.setItem('sessionId', sessionId);
        navigate('/main-menu');
      };

      gameSocket.onerror = () => {
        throw new Error('Game server connection failed');
      };

    } catch (error) {
      console.error('Login failed:', error);
      alert('Не удалось подключиться к серверу. Попробуйте снова.');
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="login-container">
      <div className="decorative-blur top-center"></div>
      <div className="decorative-blur bottom-right"></div>
      
      <Button 
        variant="primary" 
        size="lg"
        onClick={handleLogin}
        disabled={isConnecting}
      >
        {isConnecting ? 'Подключение...' : 'Login'}
      </Button>
      
      {isConnecting && (
        <small className="text-muted mt-3">
          Подключение к игровому серверу...
        </small>
      )}
    </div>
  );
};
