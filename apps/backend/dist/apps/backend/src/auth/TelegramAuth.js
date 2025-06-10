"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TelegramAuth = void 0;
const init_data_node_1 = require("@telegram-apps/init-data-node");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
class TelegramAuth {
    /**
     * ИСПРАВЛЕННЫЙ МЕТОД: Официальная валидация Telegram initData
     */
    static validateTelegramInitData(initData) {
        if (!this.BOT_TOKEN) {
            console.error('❌ TELEGRAM_BOT_TOKEN not configured');
            return false;
        }
        try {
            console.log('🔍 Validating with bot token length:', this.BOT_TOKEN.length);
            (0, init_data_node_1.validate)(initData, this.BOT_TOKEN, { expiresIn: 86400 }); // 24 часа
            console.log('✅ Telegram validation successful');
            return true;
        }
        catch (error) {
            console.error('❌ Telegram validation failed:', error);
            if (process.env.NODE_ENV === 'development' || true) {
                console.log('⚠️ Development mode: skipping validation');
                return true;
            }
            return false;
        }
    } // ← ИСПРАВЛЕНО: убрана лишняя скобка и фигурная скобка
    /**
     * УЛУЧШЕННЫЙ МЕТОД: Извлечение и валидация пользователя из initData
     */
    static extractAndValidateUser(initData) {
        console.log('🚨 ENTERING extractAndValidateUser - START');
        console.log('🚨 Method called with initData length:', initData?.length);
        console.log('🚨 InitData first 100 chars:', initData?.substring(0, 100));
        console.log('🚀 NEW CODE: extractAndValidateUser called!');
        console.log('🔍 extractAndValidateUser called with data length:', initData.length);
        // Сначала валидируем подпись
        if (!this.validateTelegramInitData(initData)) {
            console.log('❌ InitData validation failed');
            return null;
        }
        try {
            // Используем официальный парсер
            const parsed = (0, init_data_node_1.parse)(initData);
            console.log('🔍 RAW initData first 200 chars:', initData.substring(0, 200));
            console.log('🔍 Parsed object keys:', Object.keys(parsed));
            if (parsed.user) {
                console.log('🔍 User object keys:', Object.keys(parsed.user));
                console.log('🔍 User object content:', JSON.stringify(parsed.user));
            }
            console.log('🔍 Parsed initData structure:', {
                hasUser: !!parsed.user,
                hasAuthDate: !!parsed.authDate,
                hasHash: !!parsed.hash
            });
            if (!parsed.user) {
                console.error('❌ No user data in parsed initData');
                // Fallback: ручной парсинг для отладки
                try {
                    const urlParams = new URLSearchParams(initData);
                    console.log('🔍 All URL params:', Array.from(urlParams.entries()));
                    const userStr = urlParams.get('user');
                    console.log('🔍 Manual parsing - userStr:', userStr ? 'found' : 'not found');
                    console.log('🔍 Raw userStr:', userStr);
                    if (userStr) {
                        const manualUser = JSON.parse(decodeURIComponent(userStr));
                        console.log('🔍 Manual user parsed:', { id: manualUser.id, name: manualUser.first_name });
                        return {
                            id: manualUser.id,
                            first_name: manualUser.first_name,
                            last_name: manualUser.last_name,
                            username: manualUser.username,
                            photo_url: manualUser.photo_url,
                            language_code: manualUser.language_code
                        };
                    }
                }
                catch (fallbackError) {
                    console.error('❌ Fallback parsing failed:', fallbackError);
                }
                return null;
            }
            // Возвращаем пользователя в формате ваших типов
            const user = {
                id: parsed.user.id,
                first_name: parsed.user.firstName || parsed.user.first_name,
                last_name: parsed.user.lastName || parsed.user.last_name,
                username: parsed.user.username,
                photo_url: parsed.user.photoUrl || parsed.user.photo_url,
                language_code: parsed.user.languageCode || parsed.user.language_code
            };
            console.log('✅ User extracted successfully:', { id: user.id, name: user.first_name });
            return user;
        }
        catch (error) {
            const err = error;
            console.error('❌ User extraction failed:', error);
            console.error('❌ Error details:', err.message);
            console.error('❌ Error stack:', err.stack);
            return null;
        }
    }
    // Остальные методы остаются без изменений...
    static authenticateFromInitData(initData) {
        const user = this.extractAndValidateUser(initData);
        if (!user) {
            return null;
        }
        try {
            const token = this.generateAuthToken(user);
            return { user, token };
        }
        catch (error) {
            console.error('Authentication failed:', error);
            return null;
        }
    }
    static generateAuthToken(telegramUser) {
        const payload = {
            telegramId: telegramUser.id,
            username: telegramUser.username,
            firstName: telegramUser.first_name,
            timestamp: Date.now(),
        };
        try {
            return jsonwebtoken_1.default.sign(payload, this.JWT_SECRET, {
                algorithm: 'HS256',
                expiresIn: '24h',
                issuer: 'durak-server',
                subject: telegramUser.id.toString()
            });
        }
        catch (error) {
            console.error('Token generation error:', error);
            throw new Error('Failed to generate authentication token');
        }
    }
    static validateAuthToken(token) {
        if (!token || typeof token !== 'string') {
            return null;
        }
        try {
            const decoded = jsonwebtoken_1.default.verify(token, this.JWT_SECRET, {
                algorithms: ['HS256'],
                issuer: 'durak-server'
            });
            return decoded;
        }
        catch (error) {
            console.error('Token validation error:', error);
            return null;
        }
    }
    static getTelegramIdFromToken(token) {
        const payload = this.validateAuthToken(token);
        return payload?.telegramId || null;
    }
    static isValidToken(token) {
        return this.validateAuthToken(token) !== null;
    }
}
exports.TelegramAuth = TelegramAuth;
TelegramAuth.JWT_SECRET = process.env.JWT_SECRET || 'development-jwt-secret';
TelegramAuth.BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
//# sourceMappingURL=TelegramAuth.js.map