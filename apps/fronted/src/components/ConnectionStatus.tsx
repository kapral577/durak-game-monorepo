import React, { useCallback } from 'react';
import { Alert, Spinner, Button } from 'react-bootstrap';
import { useGame } from '../context/GameProvider';

// Константы для сообщений
const MESSAGES = {
  CONNECTING: 'Подключение к серверу...',
  ERROR: 'Ошибка соединения с сервером',
  DISCONNECTED: 'Нет соединения с сервером',
} as const;

const ConnectionStatus: React.FC = () => {
  const { connectionStatus, error, clearError, connect } = useGame();

  // Мемоизированная функция получения варианта Alert
  const getVariant = useCallback(() => {
    switch (connectionStatus) {
      case 'connecting':
        return 'info';
      case 'error':
        return 'danger';
      case 'disconnected':
        return 'warning';
      default:
        return 'info';
    }
  }, [connectionStatus]);

  // Мемоизированная функция получения сообщения
  const getMessage = useCallback(() => {
    if (error) return error;
    
    switch (connectionStatus) {
      case 'connecting':
        return MESSAGES.CONNECTING;
      case 'error':
        return MESSAGES.ERROR;
      case 'disconnected':
        return MESSAGES.DISCONNECTED;
      default:
        return '';
    }
  }, [connectionStatus, error]);

  // Мемоизированный обработчик переподключения
  const handleRetry = useCallback(() => {
    clearError();
    connect();
  }, [clearError, connect]);

  // Не показываем компонент если все в порядке
  if (connectionStatus === 'connected' && !error) {
    return null;
  }

  return (
    <Alert variant={getVariant()} className="mb-3">
      <div className="d-flex align-items-center justify-content-between">
        <div className="d-flex align-items-center">
          {connectionStatus === 'connecting' && (
            <Spinner 
              animation="border" 
              size="sm" 
              className="me-2"
              role="status"
              aria-label="Подключение..."
            />
          )}
          <span>{getMessage()}</span>
        </div>
        
        {(connectionStatus === 'error' || connectionStatus === 'disconnected') && (
          <Button 
            variant="outline-primary" 
            size="sm" 
            onClick={handleRetry}
            disabled={connectionStatus === 'connecting'}
          >
            Переподключиться
          </Button>
        )}
      </div>
    </Alert>
  );
};

export default ConnectionStatus;
