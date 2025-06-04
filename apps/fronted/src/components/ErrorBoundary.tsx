// src/components/ErrorBoundary.tsx - ГРАНИЦА ОШИБОК ДЛЯ REACT

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Alert, Button, Container, Card } from 'react-bootstrap';

// ===== ИНТЕРФЕЙСЫ =====

/**
 * Props для ErrorBoundary
 */
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

/**
 * Состояние ErrorBoundary
 */
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
  retryCount: number;
}

/**
 * Контекст ошибки для логирования
 */
interface ErrorContext {
  timestamp: string;
  userAgent: string;
  url: string;
  userId?: string;
  error: string;
  stack?: string;
  componentStack: string;
  errorId: string;
  retryCount: number;
}

// ===== КОНСТАНТЫ =====

const MAX_RETRY_COUNT = 3;

const ERROR_MESSAGES = {
  GENERIC: 'Что-то пошло не так. Пожалуйста, перезагрузите страницу или попробуйте позже.',
  DEV_DETAILS: 'Детали ошибки (только для разработки)',
  RETRY_LIMIT: 'Превышено максимальное количество попыток. Перезагрузите страницу.',
  UNKNOWN_ERROR: 'Неизвестная ошибка'
} as const;

const BUTTON_LABELS = {
  RETRY: 'Попробовать снова',
  RELOAD: 'Перезагрузить страницу',
  REPORT: 'Сообщить об ошибке'
} as const;

// ===== УТИЛИТАРНЫЕ ФУНКЦИИ =====

/**
 * Генерация уникального ID ошибки
 */
const generateErrorId = (): string => {
  return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Получение ID пользователя (если доступно)
 */
const getUserId = (): string | undefined => {
  try {
    // Попытка получить ID из localStorage или других источников
    const userData = localStorage.getItem('user_data');
    if (userData) {
      const parsed = JSON.parse(userData);
      return parsed.id || parsed.telegramId?.toString();
    }
  } catch (error) {
    console.warn('Failed to get user ID:', error);
  }
  return undefined;
};

/**
 * Логирование ошибки в сервис мониторинга
 */
const logErrorToService = async (errorContext: ErrorContext): Promise<void> => {
  try {
    // В production можно отправлять в Sentry, LogRocket и т.д.
    if (process.env.NODE_ENV === 'production') {
      const apiUrl = import.meta.env.VITE_API_URL;
      if (apiUrl) {
        await fetch(`${apiUrl}/errors/report`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(errorContext),
        });
      }
    }
    
    // Локальное логирование для development
    console.group('🚨 Error Boundary Caught Error');
    console.error('Error ID:', errorContext.errorId);
    console.error('Error:', errorContext.error);
    console.error('Stack:', errorContext.stack);
    console.error('Component Stack:', errorContext.componentStack);
    console.error('Full Context:', errorContext);
    console.groupEnd();
  } catch (logError) {
    console.error('Failed to log error to service:', logError);
  }
};

// ===== КОМПОНЕНТ FALLBACK UI =====

/**
 * Компонент для отображения ошибки
 */
const ErrorFallback: React.FC<{
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
  retryCount: number;
  onRetry: () => void;
  onReload: () => void;
  onReport: () => void;
}> = ({ error, errorInfo, errorId, retryCount, onRetry, onReload, onReport }) => {
  const canRetry = retryCount < MAX_RETRY_COUNT;
  const errorMessage = error?.message || ERROR_MESSAGES.UNKNOWN_ERROR;

  return (
    <Container className="d-flex justify-content-center align-items-center min-vh-100">
      <Card style={{ maxWidth: '600px', width: '100%' }}>
        <Card.Body className="text-center p-4">
          <div className="mb-4">
            <h2 className="text-danger mb-3">⚠️ Произошла ошибка</h2>
            <Alert 
              variant="danger" 
              role="alert"
              aria-live="assertive"
            >
              {ERROR_MESSAGES.GENERIC}
            </Alert>
          </div>

          {errorId && (
            <Alert variant="info" className="mb-3">
              <small>
                <strong>ID ошибки:</strong> {errorId}
                <br />
                <small className="text-muted">
                  Сохраните этот ID для обращения в поддержку
                </small>
              </small>
            </Alert>
          )}

          <div className="d-flex flex-column flex-sm-row gap-2 justify-content-center mb-4">
            {canRetry && (
              <Button 
                variant="primary" 
                onClick={onRetry}
                aria-label="Попробовать восстановить работу приложения"
              >
                {BUTTON_LABELS.RETRY}
              </Button>
            )}
            
            <Button 
              variant="outline-primary" 
              onClick={onReload}
              aria-label="Перезагрузить страницу полностью"
            >
              {BUTTON_LABELS.RELOAD}
            </Button>
            
            <Button 
              variant="outline-secondary" 
              onClick={onReport}
              aria-label="Отправить отчет об ошибке разработчикам"
            >
              {BUTTON_LABELS.REPORT}
            </Button>
          </div>

          {!canRetry && (
            <Alert variant="warning" className="mb-3">
              {ERROR_MESSAGES.RETRY_LIMIT}
            </Alert>
          )}

          {process.env.NODE_ENV === 'development' && error && (
            <details className="mt-4">
              <summary className="btn btn-outline-secondary btn-sm mb-3">
                {ERROR_MESSAGES.DEV_DETAILS}
              </summary>
              <div className="text-start">
                <Alert variant="secondary" className="p-3">
                  <h6>Error Message:</h6>
                  <pre className="small mb-3">{errorMessage}</pre>
                  
                  {error.stack && (
                    <>
                      <h6>Stack Trace:</h6>
                      <pre className="small mb-3" style={{ fontSize: '0.75rem' }}>
                        {error.stack}
                      </pre>
                    </>
                  )}
                  
                  {errorInfo?.componentStack && (
                    <>
                      <h6>Component Stack:</h6>
                      <pre className="small" style={{ fontSize: '0.75rem' }}>
                        {errorInfo.componentStack}
                      </pre>
                    </>
                  )}
                  
                  <div className="mt-3 pt-3 border-top">
                    <small className="text-muted">
                      <strong>Retry Count:</strong> {retryCount} / {MAX_RETRY_COUNT}
                      <br />
                      <strong>Timestamp:</strong> {new Date().toISOString()}
                    </small>
                  </div>
                </Alert>
              </div>
            </details>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

// ===== ОСНОВНОЙ КОМПОНЕНТ =====

/**
 * Граница ошибок для перехвата и обработки ошибок React
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: 0
    };
  }

  /**
   * Обновление состояния при возникновении ошибки
   */
  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
      errorId: generateErrorId()
    };
  }

  /**
   * Обработка ошибки и логирование
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Обновление состояния с информацией об ошибке
    this.setState({
      errorInfo,
      retryCount: this.state.retryCount + 1
    });

    // Создание контекста ошибки
    const errorContext: ErrorContext = {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: getUserId(),
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorId: this.state.errorId || generateErrorId(),
      retryCount: this.state.retryCount
    };

    // Логирование ошибки
    logErrorToService(errorContext);

    // Вызов пользовательского обработчика
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  /**
   * Попытка восстановления работы
   */
  handleRetry = (): void => {
    if (this.state.retryCount < MAX_RETRY_COUNT) {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        errorId: null
      });
    }
  };

  /**
   * Перезагрузка страницы
   */
  handleReload = (): void => {
    window.location.reload();
  };

  /**
   * Отправка отчета об ошибке
   */
  handleReport = (): void => {
    if (this.state.errorId) {
      // Копирование ID ошибки в буфер обмена
      navigator.clipboard?.writeText(this.state.errorId).then(() => {
        alert(`ID ошибки скопирован в буфер обмена: ${this.state.errorId}`);
      }).catch(() => {
        alert(`ID ошибки: ${this.state.errorId}\nСкопируйте его вручную для обращения в поддержку.`);
      });
    }
  };

  /**
   * Рендер компонента
   */
  render(): ReactNode {
    if (this.state.hasError) {
      // Использование пользовательского fallback или стандартного
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          errorId={this.state.errorId}
          retryCount={this.state.retryCount}
          onRetry={this.handleRetry}
          onReload={this.handleReload}
          onReport={this.handleReport}
        />
      );
    }

    return this.props.children;
  }
}

// ===== ЭКСПОРТ =====
export default ErrorBoundary;
export type { ErrorBoundaryProps, ErrorBoundaryState, ErrorContext };
export { ERROR_MESSAGES, BUTTON_LABELS, MAX_RETRY_COUNT };
