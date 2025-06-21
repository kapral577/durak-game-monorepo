// src/hooks/useWebSocket.ts - ХУК ДЛЯ WEBSOCKET СОЕДИНЕНИЯ

import { useState, useRef, useCallback, useEffect } from 'react';
import { 
  WebSocketMessage, 
  TelegramUser, 
  ConnectionStatus,
  WEBSOCKET_CONFIG 
} from '@shared/types';

// ===== ИНТЕРФЕЙСЫ =====

/**
 * Возвращаемые данные хука useWebSocket
 */
export interface UseWebSocketReturn {
  socket: WebSocket | null;
  isConnected: boolean;
  connectionStatus: ConnectionStatus;
  error: string | null;
  reconnectAttempts: number;
  sendMessage: (message: WebSocketMessage) => boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  clearError: () => void;
}

/**
 * Конфигурация WebSocket соединения
 */
interface WebSocketConfig {
  url: string;
  protocols?: string[];
  reconnectDelay: number;
  maxReconnectAttempts: number;
  heartbeatInterval: number;
  connectionTimeout: number;
}

/**
 * Контекст ошибки WebSocket
 */
interface WebSocketErrorContext {
  timestamp: Date;
  url: string;
  readyState: number;
  lastError: string | null;
  reconnectAttempts: number;
}

// ===== КОНСТАНТЫ =====

const WS_CONFIG: WebSocketConfig = {
  url: import.meta.env.VITE_WS_URL || 'wss://durak-game-monorepo.onrender.com',
  reconnectDelay: WEBSOCKET_CONFIG.RECONNECT_DELAY,
  maxReconnectAttempts: WEBSOCKET_CONFIG.MAX_RECONNECT_ATTEMPTS,
  heartbeatInterval: WEBSOCKET_CONFIG.HEARTBEAT_INTERVAL,
  connectionTimeout: WEBSOCKET_CONFIG.CONNECTION_TIMEOUT
};

const WS_READY_STATES = {
  CONNECTING: 0,
  OPEN: 1,
  CLOSING: 2,
  CLOSED: 3
} as const;

const WS_CLOSE_CODES = {
  NORMAL: 1000,
  GOING_AWAY: 1001,
  PROTOCOL_ERROR: 1002,
  UNSUPPORTED_DATA: 1003,
  NO_STATUS: 1005,
  ABNORMAL: 1006,
  INVALID_FRAME: 1007,
  POLICY_VIOLATION: 1008,
  MESSAGE_TOO_BIG: 1009,
  EXTENSION_REQUIRED: 1010,
  INTERNAL_ERROR: 1011,
  SERVICE_RESTART: 1012,
  TRY_AGAIN_LATER: 1013,
  BAD_GATEWAY: 1014,
  TLS_HANDSHAKE: 1015
} as const;

const ERROR_MESSAGES = {
  CONNECTION_FAILED: 'Не удалось подключиться к серверу',
  CONNECTION_TIMEOUT: 'Превышено время ожидания подключения',
  WEBSOCKET_ERROR: 'Ошибка WebSocket соединения',
  SEND_FAILED: 'Ошибка отправки сообщения',
  NO_CONNECTION: 'Нет соединения с сервером',
  INVALID_MESSAGE: 'Неверный формат сообщения',
  AUTH_REQUIRED: 'Необходима аутентификация',
  MAX_RECONNECT_ATTEMPTS: 'Превышено максимальное количество попыток переподключения',
  INVALID_URL: 'Неверный URL WebSocket сервера'
} as const;

// ===== УТИЛИТАРНЫЕ ФУНКЦИИ =====

/**
 * Получение безопасного WebSocket URL
 */
const getWebSocketUrl = (authToken?: string): string => {
  const baseUrl = WS_CONFIG.url;
  
  if (!baseUrl) {
    throw new Error('WebSocket URL not configured');
  }
  
  try {
    const url = new URL(baseUrl);
    if (authToken) {
      url.searchParams.set('token', authToken);
    }
    return url.toString();
  } catch (error) {
    throw new Error('Invalid WebSocket URL configuration');
  }
};

/**
 * Валидация сообщения перед отправкой
 */
const validateMessage = (message: any): message is WebSocketMessage => {
  return message && 
    typeof message === 'object' && 
    typeof message.type === 'string' &&
    message.type.length > 0;
};

/**
 * Получение описания кода закрытия
 */
const getCloseCodeDescription = (code: number): string => {
  switch (code) {
    case WS_CLOSE_CODES.NORMAL:
      return 'Нормальное закрытие';
    case WS_CLOSE_CODES.GOING_AWAY:
      return 'Страница закрывается';
    case WS_CLOSE_CODES.PROTOCOL_ERROR:
      return 'Ошибка протокола';
    case WS_CLOSE_CODES.ABNORMAL:
      return 'Аварийное отключение';
    case WS_CLOSE_CODES.INTERNAL_ERROR:
      return 'Внутренняя ошибка сервера';
    default:
      return `Неизвестная ошибка (код: ${code})`;
  }
};

// ===== ОСНОВНОЙ ХУК =====

/**
 * Хук для управления WebSocket соединением
 */
export const useWebSocket = (
  authToken?: string, 
  telegramUser?: TelegramUser | null,
  onMessage?: (message: any) => void
): UseWebSocketReturn => {
  // Состояния
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [error, setError] = useState<string | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState<number>(0);

  // Рефы для таймеров и состояния
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectRef = useRef<NodeJS.Timeout | null>(null);
  const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isManualDisconnect = useRef<boolean>(false);

  // ===== УПРАВЛЕНИЕ HEARTBEAT =====

  /**
   * Запуск системы heartbeat
   */
  const startHeartbeat = useCallback((ws: WebSocket) => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
    }

    heartbeatRef.current = setInterval(() => {
      if (ws.readyState === WS_READY_STATES.OPEN) {
        try {
          ws.send(JSON.stringify({ type: 'heartbeat' }));
          
          // Установка таймаута для ответа на heartbeat
          if (heartbeatTimeoutRef.current) {
            clearTimeout(heartbeatTimeoutRef.current);
          }
          
          /*
heartbeatTimeoutRef.current = setTimeout(() => {
console.warn('Heartbeat timeout, reconnecting...');
ws.close(WS_CLOSE_CODES.ABNORMAL, 'Heartbeat timeout');
}, 10000);
*/

        } catch (error) {
          console.error('Error sending heartbeat:', error);
        }
      }
    }, WS_CONFIG.heartbeatInterval);
  }, []);

  /**
   * Остановка системы heartbeat
   */
  const stopHeartbeat = useCallback(() => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }
    
    if (heartbeatTimeoutRef.current) {
      clearTimeout(heartbeatTimeoutRef.current);
      heartbeatTimeoutRef.current = null;
    }
  }, []);

  // ===== ОЧИСТКА ОШИБОК =====

  /**
   * Очистка ошибки
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // ===== ОТПРАВКА СООБЩЕНИЙ =====

  /**
   * Отправка сообщения через WebSocket
   */
  const sendMessage = useCallback((message: WebSocketMessage): boolean => {
    if (!socket || socket.readyState !== WS_READY_STATES.OPEN) {
      setError(ERROR_MESSAGES.NO_CONNECTION);
      return false;
    }

    if (!validateMessage(message)) {
      setError(ERROR_MESSAGES.INVALID_MESSAGE);
      return false;
    }

    try {
      socket.send(JSON.stringify(message));
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : ERROR_MESSAGES.SEND_FAILED;
      console.error('Error sending message:', err);
      setError(`${ERROR_MESSAGES.SEND_FAILED}: ${errorMessage}`);
      return false;
    }
  }, [socket]);

  // ===== ПОДКЛЮЧЕНИЕ =====

  /**
   * Установка WebSocket соединения
   */
  const connect = useCallback(async (): Promise<void> => {
    // Предотвращение множественных подключений
    if (connectionStatus === 'connecting') {
      return;
    }

    // Закрытие существующего соединения
    if (socket) {
      socket.close(WS_CLOSE_CODES.NORMAL);
    }

    setConnectionStatus('connecting');
    setError(null);
    isManualDisconnect.current = false;

    try {
      const wsUrl = getWebSocketUrl(authToken);
      const newSocket = new WebSocket(wsUrl);

      // Таймаут подключения
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
      }

      connectionTimeoutRef.current = setTimeout(() => {
        if (newSocket.readyState === WS_READY_STATES.CONNECTING) {
          newSocket.close();
          setError(ERROR_MESSAGES.CONNECTION_TIMEOUT);
          setConnectionStatus('error');
        }
      }, WS_CONFIG.connectionTimeout);

      // ===== ОБРАБОТЧИКИ СОБЫТИЙ =====

      newSocket.onopen = () => {
        console.log('WebSocket connected');
        
        if (connectionTimeoutRef.current) {
          clearTimeout(connectionTimeoutRef.current);
          connectionTimeoutRef.current = null;
        }

        setSocket(newSocket);
        setIsConnected(true);
        setConnectionStatus('connected');
        setReconnectAttempts(0);
        
        // Запуск heartbeat
        startHeartbeat(newSocket);

        // Аутентификация
        if (authToken && telegramUser) {
          const authMessage: WebSocketMessage = {
            type: 'authenticate',
            token: authToken,
            telegramUser
          };
          
          try {
            newSocket.send(JSON.stringify(authMessage));
          } catch (error) {
            console.error('Error sending auth message:', error);
            setError(ERROR_MESSAGES.AUTH_REQUIRED);
          }
        }
      };

      newSocket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          // Обработка heartbeat ответов
          if (message.type === 'heartbeat_response') {
            if (heartbeatTimeoutRef.current) {
              clearTimeout(heartbeatTimeoutRef.current);
              heartbeatTimeoutRef.current = null;
            }
            return;
          }
          
          // Сброс счетчика переподключений при успешном сообщении
          setReconnectAttempts(0);
          
          // Передача сообщения наружу
          if (onMessage) {
            onMessage(message);
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
          setError('Ошибка обработки сообщения от сервера');
        }
      };

      newSocket.onerror = (event) => {
        console.error('WebSocket error:', event);
        setError(ERROR_MESSAGES.WEBSOCKET_ERROR);
        setConnectionStatus('error');
        
        if (connectionTimeoutRef.current) {
          clearTimeout(connectionTimeoutRef.current);
          connectionTimeoutRef.current = null;
        }
      };

      newSocket.onclose = (event) => {
        console.log('WebSocket closed:', getCloseCodeDescription(event.code));
        
        // Очистка ресурсов
        setSocket(null);
        setIsConnected(false);
        stopHeartbeat();
        
        if (connectionTimeoutRef.current) {
          clearTimeout(connectionTimeoutRef.current);
          connectionTimeoutRef.current = null;
        }

        // Логика переподключения
        if (!isManualDisconnect.current && 
            event.code !== WS_CLOSE_CODES.NORMAL && 
            reconnectAttempts < WS_CONFIG.maxReconnectAttempts) {
          
          setConnectionStatus('connecting');
          setReconnectAttempts(prev => prev + 1);
          
          // Exponential backoff для переподключения
          const delay = WS_CONFIG.reconnectDelay * Math.pow(2, reconnectAttempts);
          
          reconnectRef.current = setTimeout(() => {
            connect();
          }, delay);
        } else {
          setConnectionStatus('disconnected');
          
          if (reconnectAttempts >= WS_CONFIG.maxReconnectAttempts) {
            setError(ERROR_MESSAGES.MAX_RECONNECT_ATTEMPTS);
          }
        }
      };

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : ERROR_MESSAGES.CONNECTION_FAILED;
      console.error('WebSocket connection error:', err);
      setError(errorMessage);
      setConnectionStatus('error');
    }
  }, [authToken, telegramUser, connectionStatus, reconnectAttempts, startHeartbeat, stopHeartbeat, onMessage]);

  // ===== ОТКЛЮЧЕНИЕ =====

  /**
   * Закрытие WebSocket соединения
   */
  const disconnect = useCallback(() => {
    isManualDisconnect.current = true;
    
    // Очистка таймеров
    if (reconnectRef.current) {
      clearTimeout(reconnectRef.current);
      reconnectRef.current = null;
    }
    
    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current);
      connectionTimeoutRef.current = null;
    }
    
    stopHeartbeat();
    
    // Закрытие соединения
    if (socket && socket.readyState !== WS_READY_STATES.CLOSED) {
      socket.close(WS_CLOSE_CODES.NORMAL);
    }
    
    // Сброс состояния
    setSocket(null);
    setIsConnected(false);
    setConnectionStatus('disconnected');
    setReconnectAttempts(0);
    setError(null);
  }, [socket, stopHeartbeat]);

  // ===== CLEANUP ПРИ РАЗМОНТИРОВАНИИ =====
  
/*
useEffect(() => {
  return () => {
    disconnect();
  };
}, [disconnect]);
*/

  // ===== ВОЗВРАТ ДАННЫХ =====

  return {
    socket,
    isConnected,
    connectionStatus,
    error,
    reconnectAttempts,
    sendMessage,
    connect,
    disconnect,
    clearError
  };
};

// ===== ЭКСПОРТ ДОПОЛНИТЕЛЬНЫХ ТИПОВ И КОНСТАНТ =====
export type { WebSocketConfig, WebSocketErrorContext };
export { WS_CONFIG, WS_CLOSE_CODES, ERROR_MESSAGES };
