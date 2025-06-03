import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Alert, Button, Container } from 'react-bootstrap';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    if (process.env.NODE_ENV === 'development') {
      console.error('[ErrorBoundary] Caught error:', error, errorInfo);
    }
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReload = (): void => {
    window.location.reload();
  };

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Container className="mt-5">
          <Alert variant="danger">
            <Alert.Heading>Произошла ошибка</Alert.Heading>
            <p>Что-то пошло не так. Пожалуйста, перезагрузите страницу или попробуйте позже.</p>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details style={{ whiteSpace: 'pre-wrap' }}>
                <summary>Детали ошибки (только для разработки)</summary>
                <pre>{this.state.error.toString()}</pre>
                <pre>{this.state.errorInfo?.componentStack}</pre>
              </details>
            )}
            
            <div className="d-flex justify-content-between mt-3">
              <Button variant="primary" onClick={this.handleReset}>
                Попробовать снова
              </Button>
              <Button variant="secondary" onClick={this.handleReload}>
                Перезагрузить страницу
              </Button>
            </div>
          </Alert>
        </Container>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
