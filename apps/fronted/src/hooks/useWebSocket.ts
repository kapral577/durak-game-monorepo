// src/hooks/useWebSocket.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { WebSocketMessage, Player } from '../shared/types';

const HEARTBEAT_INTERVAL = 30000;
const RECONNECT_DELAY = 3000;

export const useWebSocket = (authToken: string | null, telegramUser: Player | null) => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [error, setError] = useState<string | null>(null);
  
  const heartbeatRef = useRef<NodeJS.Timeout>();
  const reconnectRef = useRef<NodeJS.Timeout>();

  const clearError = useCallback(() => setError(null), []);

  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (socket?.readyState === WebSocket.OPEN) {
      try {
        socket.send(JSON.stringify(message));
      } catch (err) {
        setError('Ошибка отправки сообщения');
      }
    }
  }, [socket]);

  const disconnect = useCallback(() => {
    if (socket) {
      socket.close(1000, 'User disconnect');
    }
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
    }
    if (reconnectRef.current) {
      clearTimeout(reconnectRef.current);
    }
  }, [socket]);

  const connect = useCallback(async () => {
    if (!authToken || !telegramUser) {
      setError('Необходима аутентификация');
      return;
    }

    if (socket?.readyState === WebSocket.OPEN) return;

    setConnectionStatus('connecting');
    setError(null);

    try {
      const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:3001';
      const newSocket = new WebSocket(wsUrl);

      newSocket.onopen = () => {
        setConnectionStatus('connected');
        setIsConnected(true);
        setSocket(newSocket);
        
        // Аутентификация
        sendMessage({
          type: 'authenticate',
          token: authToken,
          telegramUser
        } as WebSocketMessage);

        // Запуск heartbeat
        heartbeatRef.current = setInterval(() => {
          if (newSocket.readyState === WebSocket.OPEN) {
            newSocket.send(JSON.stringify({ type: 'heartbeat' }));
          }
        }, HEARTBEAT_INTERVAL);
      };

      newSocket.onclose = (event) => {
        setConnectionStatus('disconnected');
        setIsConnected(false);
        setSocket(null);
        
        if (heartbeatRef.current) {
          clearInterval(heartbeatRef.current);
        }

        // Автоматическое переподключение
        if (event.code !== 1000) {
          reconnectRef.current = setTimeout(() => {
            connect();
          }, RECONNECT_DELAY);
        }
      };

      newSocket.onerror = () => {
        setConnectionStatus('error');
        setError('Ошибка WebSocket соединения');
      };

    } catch (err) {
      setConnectionStatus('error');
      setError('Не удалось подключиться к серверу');
    }
  }, [authToken, telegramUser, socket]);

  // Cleanup при размонтировании
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    socket,
    isConnected,
    connectionStatus,
    error,
    sendMessage,
    connect,
    disconnect,
    clearError,
  };
};
