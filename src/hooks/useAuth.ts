// src/hooks/useAuth.ts
import { useState, useEffect, useCallback } from 'react';
import { TelegramAuth } from '../utils/TelegramAuth';
import { Player } from '../shared/types';

export const useAuth = () => {
  const [telegramUser, setTelegramUser] = useState<Player | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initAuth = async () => {
      try {
        TelegramAuth.initTelegramApp();
        
        if (!TelegramAuth.isInTelegram() && process.env.NODE_ENV === 'development') {
          const mockUser = TelegramAuth.getMockUser();
          setTelegramUser(mockUser);
          setIsAuthenticated(true);
          return;
        }

        const user = TelegramAuth.getTelegramUser();
        if (user) {
          setTelegramUser(user);
          setIsAuthenticated(true);
        } else {
          setError('Не удалось получить данные пользователя из Telegram');
        }
      } catch (err) {
        setError('Ошибка инициализации аутентификации');
      }
    };

    initAuth();
  }, []);

  const authenticate = useCallback(async (): Promise<boolean> => {
    if (!telegramUser) return false;

    try {
      const initData = TelegramAuth.getTelegramInitData();
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/telegram`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData, user: telegramUser }),
      });

      if (response.ok) {
        const { token, player } = await response.json();
        setAuthToken(token);
        setCurrentPlayer(player);
        return true;
      } else {
        setError('Ошибка аутентификации');
        return false;
      }
    } catch (err) {
      setError('Ошибка подключения к серверу');
      return false;
    }
  }, [telegramUser]);

  return {
    telegramUser,
    isAuthenticated,
    authToken,
    currentPlayer,
    error,
    authenticate,
    setAuthToken,
    setCurrentPlayer,
  };
};
