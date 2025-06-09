// durak-server/auth/TelegramAuth.ts - УЛУЧШЕННАЯ ВЕРСИЯ БЭКЕНД

import crypto from 'crypto';
import jwt from 'jsonwebtoken';

import { TelegramUser, Player, AuthSuccessResponse, AuthErrorResponse } from '../types/AuthTypes';

// ===== КОНСТАНТЫ =====

const AUTH_CONFIG = {
  VALIDITY_HOURS: 24,
  VALIDITY_SECONDS: 24 * 60 * 60,
  JWT_ALGORITHM: 'HS256',
  MAX_ATTEMPTS_PER_IP: 10,
  RATE_LIMIT_WINDOW_MS: 60 * 60 * 1000, // 1 час
  MAX_USER_DATA_LENGTH: 1024,
  TELEGRAM_MAX_NAME_LENGTH: 64
} as const;

interface AuthTokenPayload {
  telegramId: number;
  username?: string;
  timestamp: number;
  exp: number;
  iat: number;
}

interface ValidationAttempt {
  count: number;
  firstAttempt: number;
  lastAttempt: number;
}

export class TelegramAuth {
  static generateAuthToken(user: TelegramUser): string {
  }
  static validateAuthToken(token: string): any {
  }

  // Rate limiting для предотвращения атак
  private static validationAttempts = new Map<string, ValidationAttempt>();

// Базовая валидация входных данных
 if (!initData || typeof initData !== 'string' || initData.length > AUTH_CONFIG.MAX_USER_DATA_LENGTH) {
    return null;
 }

    try {
      const urlParams = new URLSearchParams(initData);
      const hash = urlParams.get('hash');
      if (!hash || hash.length !== 64) { // SHA256 hex = 64 символа
        return null;
      }

      urlParams.delete('hash');
      
      // Создаем строку для проверки согласно Telegram документации
      const dataCheckString = Array.from(urlParams.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => `${key}=${value}`)
        .join('\n');

      // Проверяем HMAC подпись
      const secretKey = crypto
        .createHmac('sha256', 'WebAppData')
        .update(this.BOT_TOKEN)
        .digest();

      const expectedHash = crypto
        .createHmac('sha256', secretKey)
        .update(dataCheckString, 'utf8')
        .digest('hex');

      // Константное время сравнения для защиты от timing атак
      if (!this.constantTimeEquals(hash, expectedHash)) {
        return null;
      }

      // Проверяем время (данные не старше 24 часов)
      const authDate = parseInt(urlParams.get('auth_date') || '0');
      if (!this.isAuthDateValid(authDate)) {
        return null;
      }

      // Извлекаем и валидируем данные пользователя
      const userParam = urlParams.get('user');
      if (!userParam) {
        return null;
      }

      let userData: any;
      try {
        userData = JSON.parse(userParam);
      } catch {
        return null;
      }

      // Валидируем структуру пользователя
      if (!this.isValidTelegramUser(userData)) {
        return null;
      }

      // Логируем успешную аутентификацию
      if (process.env.NODE_ENV === 'production') {
        console.log(`Successful Telegram auth for user ${userData.id}`, {
          userId: userData.id,
          username: userData.username,
          timestamp: new Date().toISOString()
        });
      }

      return userData;
    } catch (error) {
      console.error('Telegram auth validation error:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        clientIP
      });
      return null;
    }
  }

  /**
   * Генерирует JWT токен
   */
  static generateAuthToken(telegramUser: TelegramUser): string {
    const now = Math.floor(Date.now() / 1000);
    const payload: Omit<AuthTokenPayload, 'exp' | 'iat'> = {
      telegramId: telegramUser.id,
      username: telegramUser.username,
      timestamp: now * 1000, // Для совместимости с старым кодом
    };

    try {
      return jwt.sign(payload, this.JWT_SECRET, {
        algorithm: AUTH_CONFIG.JWT_ALGORITHM as jwt.Algorithm,
        expiresIn: `${AUTH_CONFIG.VALIDITY_HOURS}h`,
        issuer: 'durak-server',
        subject: telegramUser.id.toString()
      });
    } catch (error) {
      console.error('Token generation error:', error);
      // Fallback на старый метод
      return this.generateLegacyToken(telegramUser);
    }
  }

  /**
   * Валидирует JWT токен
   */
  static validateAuthToken(token: string): AuthTokenPayload | null {
    if (!token || typeof token !== 'string') {
      return null;
    }

    try {
      // Сначала пробуем JWT
      const decoded = jwt.verify(token, this.JWT_SECRET, {
        algorithms: [AUTH_CONFIG.JWT_ALGORITHM as jwt.Algorithm],
        issuer: 'durak-server'
      }) as AuthTokenPayload;

      return decoded;
    } catch (jwtError) {
      // Fallback на старый формат токенов для обратной совместимости
      try {
        return this.validateLegacyToken(token);
      } catch (legacyError) {
        return null;
      }
    }
  }

  /**
   * Извлекает Telegram ID из токена
   */
  static getTelegramIdFromToken(token: string): number | null {
    const payload = this.validateAuthToken(token);
    return payload?.telegramId || null;
  }

  /**
   * Проверяет актуальность auth_date
   */
  static isAuthDateValid(authDate: number): boolean {
    if (!authDate || authDate <= 0) {
      return false;
    }

    const currentTime = Math.floor(Date.now() / 1000);
    const timeDiff = currentTime - authDate;
    
    // Данные не должны быть из будущего (с учетом возможной разницы в часах)
    if (timeDiff < -300) { // 5 минут запас
      return false;
    }
    
    return timeDiff < AUTH_CONFIG.VALIDITY_SECONDS;
  }

  /**
   * Проверка rate limiting
   */
  private static checkRateLimit(clientIP: string): boolean {
    const now = Date.now();
    const attempt = this.validationAttempts.get(clientIP);

    if (!attempt) {
      this.validationAttempts.set(clientIP, {
        count: 1,
        firstAttempt: now,
        lastAttempt: now
      });
      return true;
    }

    // Сброс счетчика если прошло достаточно времени
    if (now - attempt.firstAttempt > AUTH_CONFIG.RATE_LIMIT_WINDOW_MS) {
      this.validationAttempts.set(clientIP, {
        count: 1,
        firstAttempt: now,
        lastAttempt: now
      });
      return true;
    }

    // Проверка лимита
    if (attempt.count >= AUTH_CONFIG.MAX_ATTEMPTS_PER_IP) {
      return false;
    }

    // Увеличиваем счетчик
    attempt.count++;
    attempt.lastAttempt = now;
    this.validationAttempts.set(clientIP, attempt);

    return true;
  }

  /**
   * Сравнение строк в константном времени
   */
  private static constantTimeEquals(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }

    return result === 0;
  }

  /**
   * Legacy метод генерации токенов (для обратной совместимости)
   */
  private static generateLegacyToken(telegramUser: TelegramUser): string {
    const now = Date.now();
    const payload: AuthTokenPayload = {
      telegramId: telegramUser.id,
      username: telegramUser.username,
      timestamp: now,
      exp: now + (AUTH_CONFIG.VALIDITY_HOURS * 60 * 60 * 1000),
      iat: Math.floor(now / 1000)
    };

    const tokenData = JSON.stringify(payload);
    const signature = this.createTokenSignature(tokenData);
    return Buffer.from(`${tokenData}.${signature}`).toString('base64');
  }

  /**
   * Legacy валидация токенов (для обратной совместимости)
   */
  private static validateLegacyToken(token: string): AuthTokenPayload | null {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const [tokenData, signature] = decoded.split('.');
    
    if (!tokenData || !signature) {
      return null;
    }

    // Проверяем подпись
    const expectedSignature = this.createTokenSignature(tokenData);
    if (!this.constantTimeEquals(signature, expectedSignature)) {
      return null;
    }

    const payload: AuthTokenPayload = JSON.parse(tokenData);
    
    // Проверяем срок действия
    if (Date.now() > payload.exp) {
      return null;
    }

    return payload;
  }

  /**
   * Mock пользователь для разработки
   */
  private static getMockUser(): TelegramUser {
    return {
      id: 123456789,
      first_name: 'Test',
      last_name: 'User',
      username: 'testuser',
      language_code: 'ru',
    };
  }

  /**
   * Улучшенная валидация структуры TelegramUser
   */
  private static isValidTelegramUser(user: any): user is TelegramUser {
    if (!user || typeof user !== 'object') {
      return false;
    }

    // Обязательные поля
    if (typeof user.id !== 'number' || user.id <= 0) {
      return false;
    }

    if (typeof user.first_name !== 'string' || 
        user.first_name.length === 0 || 
        user.first_name.length > AUTH_CONFIG.TELEGRAM_MAX_NAME_LENGTH) {
      return false;
    }

    // Опциональные поля
    if (user.last_name !== undefined && 
        (typeof user.last_name !== 'string' || user.last_name.length > AUTH_CONFIG.TELEGRAM_MAX_NAME_LENGTH)) {
      return false;
    }

    if (user.username !== undefined && 
        (typeof user.username !== 'string' || user.username.length > 32)) { // Лимит username в Telegram
      return false;
    }

    if (user.language_code !== undefined && 
        (typeof user.language_code !== 'string' || user.language_code.length > 10)) {
      return false;
    }

    return true;
  }

  /**
   * Создает подпись для legacy токенов
   */
  private static createTokenSignature(data: string): string {
    const secret = this.BOT_TOKEN || 'development-secret';
    return crypto
      .createHmac('sha256', secret)
      .update(data, 'utf8')
      .digest('hex');
  }

  /**
   * Очистка старых записей rate limiting
   */
  static cleanupRateLimitData(): void {
    const now = Date.now();
    const cutoff = now - AUTH_CONFIG.RATE_LIMIT_WINDOW_MS;

    for (const [ip, attempt] of this.validationAttempts.entries()) {
      if (attempt.firstAttempt < cutoff) {
        this.validationAttempts.delete(ip);
      }
    }

    if (process.env.NODE_ENV === 'development') {
      console.log(`Rate limit cleanup completed. Remaining entries: ${this.validationAttempts.size}`);
    }
  }

  /**
   * Получение статистики rate limiting
   */
  static getRateLimitStats(): { totalIPs: number; blockedIPs: number } {
    const now = Date.now();
    let blockedIPs = 0;

    for (const attempt of this.validationAttempts.values()) {
      if (attempt.count >= AUTH_CONFIG.MAX_ATTEMPTS_PER_IP && 
          (now - attempt.firstAttempt) <= AUTH_CONFIG.RATE_LIMIT_WINDOW_MS) {
        blockedIPs++;
      }
    }

    return {
      totalIPs: this.validationAttempts.size,
      blockedIPs
    };
  }
}

// Периодическая очистка rate limit данных (каждый час)
if (process.env.NODE_ENV === 'production') {
  setInterval(() => {
    TelegramAuth.cleanupRateLimitData();
  }, 60 * 60 * 1000); // 1 час
}

export { AUTH_CONFIG };