import React from 'react';
import { Alert, Spinner } from 'react-bootstrap';
import { useGame } from '../context/GameProvider';

const ConnectionStatus: React.FC = () => {
  const { connectionStatus, error, clearError, connect } = useGame();

  if (connectionStatus === 'connected' && !error) {
    return null; // Не показываем ничего, если всё в порядке
  }

  const getVariant = () => {
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
  };

  const getMessage = () => {
    if (error) return error;
    
    switch (connectionStatus) {
      case 'connecting':
        return 'Подключение к серверу...';
      case 'error':
        return 'Ошибка соединения с сервером';
      case 'disconnected':
        return 'Нет соединения с сервером';
      default:
        return '';
    }
  };

  const handleRetry = () => {
    clearError();
    connect();
  };

  return (
    <Alert variant={getVariant()} className="mb-0 rounded-0">
      <div className="d-flex align-items-center justify-content-between">
        <div className="d-flex align-items-center">
          {connectionStatus === 'connecting' && (
            <Spinner animation="border" size="sm" className="me-2" />
          )}
          <span>{getMessage()}</span>
        </div>
        {(connectionStatus === 'error' || connectionStatus === 'disconnected') && (
          <button
            className="btn btn-link btn-sm p-0 text-decoration-none"
            onClick={handleRetry}
          >
            Переподключиться
          </button>
        )}
      </div>
    </Alert>
  );
};

export default ConnectionStatus;