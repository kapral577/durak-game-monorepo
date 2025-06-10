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
export interface AuthSuccessResponse {
    success: true;
    token: string;
    sessionId: string;
    user: Player;
    expiresAt?: number;
}
export interface AuthErrorResponse {
    success: false;
    error: string;
    code?: number;
}
export type AuthResponse = AuthSuccessResponse | AuthErrorResponse;
//# sourceMappingURL=AuthTypes.d.ts.map