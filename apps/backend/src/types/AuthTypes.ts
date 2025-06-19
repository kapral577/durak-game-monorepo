// Единые типы для всех ответов аутентификации
export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  language_code?: string;
}

export interface Player {
  id: string;
  name: string;
  telegramId: number;
  username?: string;
  avatar?: string;
  isReady: boolean;
}

// ✅ НОВЫЙ единый формат успешного ответа
export interface AuthSuccessResponse {
  success: true;
  token: string;
  sessionId: string;
  user: Player;
  expiresAt?: number;
}

// ✅ НОВЫЙ единый формат ошибки
export interface AuthErrorResponse {
  success: false;
  error: string;
  code?: number;
}

export type AuthResponse = AuthSuccessResponse | AuthErrorResponse;
export interface WebSocketAuthenticatedMessage {
  type: 'authenticated';
  player: Player;
  token: string; // строго string!
}

export interface WebSocketRoomsListMessage {
  type: 'rooms_list';
  rooms: any[];
}

export type WebSocketMessage = 
  | WebSocketAuthenticatedMessage 
  | WebSocketRoomsListMessage;