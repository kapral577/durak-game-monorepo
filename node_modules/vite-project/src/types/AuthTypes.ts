// apps/frontend/src/types/AuthTypes.ts - ТИПЫ ДЛЯ АУТЕНТИФИКАЦИИ

/**
 * Пользователь Telegram из WebApp
 */
export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  language_code?: string;
}

/**
 * Игрок в системе
 */
export interface Player {
  id: string;
  name: string;
  telegramId: number;
  username?: string;
  avatar?: string;
  isReady: boolean;
}

/**
 * Успешный ответ аутентификации
 */
export interface AuthSuccessResponse {
  success: true;
  token: string;
  sessionId: string;
  user: Player;
  expiresAt?: number;
}

/**
 * Ошибка аутентификации
 */
export interface AuthErrorResponse {
  success: false;
  error: string;
  code?: number;
}

/**
 * Общий тип ответа аутентификации
 */
export type AuthResponse = AuthSuccessResponse | AuthErrorResponse;

/**
 * Type guards для проверки типов ответов
 */
export function isAuthSuccessResponse(response: AuthResponse): response is AuthSuccessResponse {
  return response.success === true;
}

export function isAuthErrorResponse(response: AuthResponse): response is AuthErrorResponse {
  return response.success === false;
}

/**
 * Конфигурация для аутентификации
 */
export interface AuthConfig {
  apiUrl: string;
  timeout: number;
  retryAttempts: number;
}

/**
 * Состояние аутентификации
 */
export interface AuthState {
  isAuthenticated: boolean;
  user: Player | null;
  token: string | null;
  sessionId: string | null;
  loading: boolean;
  error: string | null;
}
