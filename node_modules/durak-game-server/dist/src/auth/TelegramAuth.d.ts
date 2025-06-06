import { TelegramUser } from '@shared/types';
interface AuthTokenPayload {
    telegramId: number;
    username?: string;
    timestamp: number;
    exp: number;
}
export declare class TelegramAuth {
    private static BOT_TOKEN;
    /**
     * Валидирует Telegram WebApp initData согласно официальной документации
     */
    static validateInitData(initData: string): TelegramUser | null;
    /**
     * Генерирует безопасный auth токен
     */
    static generateAuthToken(telegramUser: TelegramUser): string;
    /**
     * Валидирует auth токен
     */
    static validateAuthToken(token: string): AuthTokenPayload | null;
    /**
     * Извлекает Telegram ID из токена
     */
    static getTelegramIdFromToken(token: string): number | null;
    /**
     * Проверяет актуальность auth_date
     */
    static isAuthDateValid(authDate: number): boolean;
    /**
     * Mock пользователь для разработки
     */
    private static getMockUser;
    /**
     * Валидирует структуру TelegramUser
     */
    private static isValidTelegramUser;
    /**
     * Создает подпись для токена
     */
    private static createTokenSignature;
}
export {};
//# sourceMappingURL=TelegramAuth.d.ts.map