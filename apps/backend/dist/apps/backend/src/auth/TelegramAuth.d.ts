import { TelegramUser } from '../types/AuthTypes';
export declare class TelegramAuth {
    private static readonly JWT_SECRET;
    private static readonly BOT_TOKEN;
    /**
     * ИСПРАВЛЕННЫЙ МЕТОД: Официальная валидация Telegram initData
     */
    static validateTelegramInitData(initData: string): boolean;
    /**
     * УЛУЧШЕННЫЙ МЕТОД: Извлечение и валидация пользователя из initData
     */
    static extractAndValidateUser(initData: string): TelegramUser | null;
    static authenticateFromInitData(initData: string): {
        user: TelegramUser;
        token: string;
    } | null;
    static generateAuthToken(telegramUser: TelegramUser): string;
    static validateAuthToken(token: string): any;
    static getTelegramIdFromToken(token: string): number | null;
    static isValidToken(token: string): boolean;
}
//# sourceMappingURL=TelegramAuth.d.ts.map