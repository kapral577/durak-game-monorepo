"use strict";
// durak-server/auth/TelegramAuth.ts - РЕФАКТОРИРОВАННАЯ ВЕРСИЯ
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TelegramAuth = void 0;
const crypto_1 = __importDefault(require("crypto"));
// ===== КОНСТАНТЫ =====
const AUTH_VALIDITY_HOURS = 24;
const AUTH_VALIDITY_SECONDS = AUTH_VALIDITY_HOURS * 60 * 60;
class TelegramAuth {
    /**
     * Валидирует Telegram WebApp initData согласно официальной документации
     */
    static validateInitData(initData) {
        if (!this.BOT_TOKEN) {
            if (process.env.NODE_ENV === 'development') {
                console.warn('TELEGRAM_BOT_TOKEN not configured - using mock validation');
                return this.getMockUser();
            }
            return null;
        }
        try {
            const urlParams = new URLSearchParams(initData);
            const hash = urlParams.get('hash');
            if (!hash) {
                return null;
            }
            urlParams.delete('hash');
            // Создаем строку для проверки согласно Telegram документации
            const dataCheckString = Array.from(urlParams.entries())
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([key, value]) => `${key}=${value}`)
                .join('\n');
            // Проверяем HMAC подпись
            const secretKey = crypto_1.default
                .createHmac('sha256', 'WebAppData')
                .update(this.BOT_TOKEN)
                .digest();
            const expectedHash = crypto_1.default
                .createHmac('sha256', secretKey)
                .update(dataCheckString)
                .digest('hex');
            if (hash !== expectedHash) {
                return null;
            }
            // Проверяем время (данные не старше 24 часов)
            const authDate = parseInt(urlParams.get('auth_date') || '0');
            const currentTime = Math.floor(Date.now() / 1000);
            if (currentTime - authDate > AUTH_VALIDITY_SECONDS) {
                return null;
            }
            // Извлекаем и валидируем данные пользователя
            const userParam = urlParams.get('user');
            if (!userParam) {
                return null;
            }
            const userData = JSON.parse(userParam);
            // Валидируем структуру пользователя
            if (!this.isValidTelegramUser(userData)) {
                return null;
            }
            return userData;
        }
        catch (error) {
            if (process.env.NODE_ENV === 'development') {
                console.error('Telegram auth validation error:', error);
            }
            return null;
        }
    }
    /**
     * Генерирует безопасный auth токен
     */
    static generateAuthToken(telegramUser) {
        const now = Date.now();
        const payload = {
            telegramId: telegramUser.id,
            username: telegramUser.username,
            timestamp: now,
            exp: now + (AUTH_VALIDITY_HOURS * 60 * 60 * 1000), // 24 часа
        };
        // В production используйте proper JWT библиотеку
        const tokenData = JSON.stringify(payload);
        const signature = this.createTokenSignature(tokenData);
        return Buffer.from(`${tokenData}.${signature}`).toString('base64');
    }
    /**
     * Валидирует auth токен
     */
    static validateAuthToken(token) {
        try {
            const decoded = Buffer.from(token, 'base64').toString('utf-8');
            const [tokenData, signature] = decoded.split('.');
            if (!tokenData || !signature) {
                return null;
            }
            // Проверяем подпись
            const expectedSignature = this.createTokenSignature(tokenData);
            if (signature !== expectedSignature) {
                return null;
            }
            const payload = JSON.parse(tokenData);
            // Проверяем срок действия
            if (Date.now() > payload.exp) {
                return null;
            }
            return payload;
        }
        catch (error) {
            return null;
        }
    }
    /**
     * Извлекает Telegram ID из токена
     */
    static getTelegramIdFromToken(token) {
        const payload = this.validateAuthToken(token);
        return payload?.telegramId || null;
    }
    /**
     * Проверяет актуальность auth_date
     */
    static isAuthDateValid(authDate) {
        const currentTime = Math.floor(Date.now() / 1000);
        return (currentTime - authDate) < AUTH_VALIDITY_SECONDS;
    }
    /**
     * Mock пользователь для разработки
     */
    static getMockUser() {
        return {
            id: 123456789,
            first_name: 'Test',
            last_name: 'User',
            username: 'testuser',
            language_code: 'ru',
        };
    }
    /**
     * Валидирует структуру TelegramUser
     */
    static isValidTelegramUser(user) {
        return (user &&
            typeof user.id === 'number' &&
            typeof user.first_name === 'string' &&
            user.first_name.length > 0);
    }
    /**
     * Создает подпись для токена
     */
    static createTokenSignature(data) {
        const secret = this.BOT_TOKEN || 'development-secret';
        return crypto_1.default
            .createHmac('sha256', secret)
            .update(data)
            .digest('hex');
    }
}
exports.TelegramAuth = TelegramAuth;
TelegramAuth.BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
//# sourceMappingURL=TelegramAuth.js.map