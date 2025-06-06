// src/components/ConnectionStatus.tsx - ИНДИКАТОР СОСТОЯНИЯ ПОДКЛЮЧЕНИЯ

import React, { useCallback, useMemo } from 'react';
import { Alert, Button, Spinner } from 'react-bootstrap';
import { ConnectionStatus as ConnectionStatusType } from '@shared/types';
import { useGame } from '../context/GameProvider';

// ===== ИНТЕРФЕЙСЫ =====

/**
 * Props для ConnectionStatus
 */
export interface ConnectionStatusProps {
  // Компонент использует данные из контекста, props не нужны
}

// ===== КОНСТАНТЫ =====

const CONNECTION_STATUS = {
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  ERROR: 'error',
  DISCONNECTED: 'disconnected'
} as const;

const ALERT_VARIANTS = {
  INFO: 'info',
  SUCCESS: 'success',
  DANGER: 'danger',
  WARNING: 'warning'
} as const;

const STATUS_MESSAGES = {
  [CONNECTION_STATUS.CONNECTING]: 'Подключение к серверу...',
  [CONNECTION_STATUS.CONNECTED]: 'Подключено к серверу',
  [CONNECTION_STATUS.ERROR]: 'Ошибка подключения к серверу',
  [CONNECTION_STATUS.DISCONNECTED]: 'Нет подключения к серверу'
} as const;

const BUTTON_LABELS = {
  RETRY: 'Переподключиться',
  CONNECTING: 'Подключение...'
} as const;

const AUTO_HIDE_DELAY = 3000; // 3 секунды для автоскрытия успешного подключения

// ===== УТИЛИТАРНЫЕ ФУНКЦИИ =====

/**
 * Получение варианта Alert на основе статуса подключения
 */
const getAlertVariant = (status: ConnectionStatusType): string => {
  switch (status) {
    case CONNECTION_STATUS.CONNECTING:
      return ALERT_VARIANTS.INFO;
    case CONNECTION_STATUS.CONNECTED:
      return ALERT_VARIANTS.SUCCESS;
    case CONNECTION_STATUS.ERROR:
      return ALERT_VARIANTS.DANGER;
    case CONNECTION_STATUS.DISCONNECTED:
      return ALERT_VARIANTS.WARNING;
    default:
      return ALERT_VARIANTS.INFO;
  }
};

/**
 * Получение сообщения на основе статуса подключения
 */
const getStatusMessage = (status: ConnectionStatusType, error?: string | null): string => {
  if (status === CONNECTION_STATUS.ERROR && error) {
    return `Ошибка подключения: ${error}`;
  }
  
  return STATUS_MESSAGES[status] || STATUS_MESSAGES[CONNECTION_STATUS.DISCONNECTED];
};

/**
 * Проверка, можно ли выполнить переподключение
 */
const canRetry = (status: ConnectionStatusType): boolean => {
  return status === CONNECTION_STATUS.ERROR || status === CONNECTION_STATUS.DISCONNECTED;
};

/**
 * Проверка, нужно ли показывать индикатор
 */
const shouldShowStatus = (status: ConnectionStatusType): boolean => {
  // Не показываем для успешного подключения (автоскрытие)
  return status !== CONNECTION_STATUS.CONNECTED;
};

// ===== ОСНОВНОЙ КОМПОНЕНТ =====

/**
 * Компонент для отображения состояния подключения к серверу
 */
export const ConnectionStatus: React.FC<ConnectionStatusProps> = React.memo(() => {
  // Получение данных из контекста
  const { 
    connectionStatus, 
    error, 
    isConnected,
    connect,
    clearError,
    reconnectAttempts 
  } = useGame();

  // ===== МЕМОИЗИРОВАННЫЕ ВЫЧИСЛЕНИЯ =====

  /**
   * Мемоизированный вариант Alert
   */
  const alertVariant = useMemo(() => {
    return getAlertVariant(connectionStatus);
  }, [connectionStatus]);

  /**
   * Мемоизированное сообщение статуса
   */
  const statusMessage = useMemo(() => {
    return getStatusMessage(connectionStatus, error);
  }, [connectionStatus, error]);

  /**
   * Мемоизированная проверка возможности переподключения
   */
  const canRetryConnection = useMemo(() => {
    return canRetry(connectionStatus);
  }, [connectionStatus]);

  /**
   * Мемоизированная проверка необходимости показа статуса
   */
  const shouldShow = useMemo(() => {
    return shouldShowStatus(connectionStatus);
  }, [connectionStatus]);

  // ===== ОБРАБОТЧИКИ СОБЫТИЙ =====

  /**
   * Обработчик переподключения
   */
  const handleRetry = useCallback(async () => {
    try {
      clearError();
      await connect();
    } catch (err) {
      console.error('Retry connection failed:', err);
    }
  }, [clearError, connect]);

  /**
   * Обработчик закрытия Alert
   */
  const handleDismiss = useCallback(() => {
    if (connectionStatus !== CONNECTION_STATUS.CONNECTING) {
      clearError();
    }
  }, [connectionStatus, clearError]);

  // ===== АВТОСКРЫТИЕ ДЛЯ УСПЕШНОГО ПОДКЛЮЧЕНИЯ =====

  React.useEffect(() => {
    if (connectionStatus === CONNECTION_STATUS.CONNECTED) {
      const timer = setTimeout(() => {
        // Автоматически скрываем успешное подключение
        clearError();
      }, AUTO_HIDE_DELAY);

      return () => clearTimeout(timer);
    }
  }, [connectionStatus, clearError]);

  // ===== EARLY RETURN ДЛЯ УСПЕШНОГО ПОДКЛЮЧЕНИЯ =====

  if (!shouldShow && isConnected) {
    return null;
  }

  // ===== РЕНДЕР =====

  return (
    <Alert 
      variant={alertVariant}
      dismissible={connectionStatus !== CONNECTION_STATUS.CONNECTING}
      onClose={handleDismiss}
      className="mb-3"
      role="alert"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="d-flex align-items-center justify-content-between">
        <div className="d-flex align-items-center">
          {/* Спиннер для состояния подключения */}
          {connectionStatus === CONNECTION_STATUS.CONNECTING && (
            <Spinner 
              animation="border" 
              size="sm" 
              className="me-2"
              role="status"
              aria-label="Подключение к серверу"
            />
          )}
          
          {/* Сообщение о статусе */}
          <span>
            {statusMessage}
            {reconnectAttempts > 0 && (
              <small className="text-muted ms-2">
                (попытка {reconnectAttempts})
              </small>
            )}
          </span>
        </div>

        {/* Кнопка переподключения */}
        {canRetryConnection && (
          <Button 
            variant="outline-primary" 
            size="sm"
            onClick={handleRetry}
            disabled={connectionStatus === CONNECTION_STATUS.CONNECTING}
            aria-label="Попробовать переподключиться к серверу"
            className="ms-3"
          >
            {connectionStatus === CONNECTION_STATUS.CONNECTING 
              ? BUTTON_LABELS.CONNECTING 
              : BUTTON_LABELS.RETRY
            }
          </Button>
        )}
      </div>

      {/* Дополнительная информация для разработки */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-2 pt-2 border-top">
          <small className="text-muted">
            <strong>Debug Info:</strong>
            <br />
            Status: {connectionStatus}
            <br />
            Connected: {isConnected ? 'Yes' : 'No'}
            <br />
            Reconnect Attempts: {reconnectAttempts}
            {error && (
              <>
                <br />
                Error: {error}
              </>
            )}
          </small>
        </div>
      )}
    </Alert>
  );
});

// Установка displayName для лучшей отладки
ConnectionStatus.displayName = 'ConnectionStatus';

// ===== ЭКСПОРТ =====
export default ConnectionStatus;
export type { ConnectionStatusProps };
export { 
  CONNECTION_STATUS, 
  ALERT_VARIANTS, 
  STATUS_MESSAGES, 
  BUTTON_LABELS,
  getAlertVariant,
  getStatusMessage,
  canRetry,
  shouldShowStatus
};
