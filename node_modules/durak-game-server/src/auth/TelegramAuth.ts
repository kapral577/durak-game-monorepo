import { TelegramUser, Player, AuthSuccessResponse, AuthErrorResponse } from '../types/AuthTypes';
import jwt from 'jsonwebtoken';

export class TelegramAuth {
  private static readonly JWT_SECRET = process.env.JWT_SECRET || 'development-jwt-secret';

  /**
   * Генерирует JWT токен для аутентифицированного пользователя Telegram
   */
  static generateAuthToken(telegramUser: TelegramUser): string {
    const payload = {
      telegramId: telegramUser.id,
      username: telegramUser.username,
      firstName: telegramUser.first_name,
      timestamp: Date.now(),
    };

    try {
      return jwt.sign(payload, this.JWT_SECRET, {
        algorithm: 'HS256',
        expiresIn: '24h',
        issuer: 'durak-server',
        subject: telegramUser.id.toString()
      });
    } catch (error) {
      console.error('Token generation error:', error);
      throw new Error('Failed to generate authentication token');
    }
  }

  /**
   * Валидирует JWT токен и возвращает payload
   */
  static validateAuthToken(token: string): any {
    if (!token || typeof token !== 'string') {
      return null;
    }

    try {
      const decoded = jwt.verify(token, this.JWT_SECRET, {
        algorithms: ['HS256'],
        issuer: 'durak-server'
      });

      return decoded;
    } catch (error) {
      console.error('Token validation error:', error);
      return null;
    }
  }

  /**
   * Извлекает Telegram ID из валидного токена
   */
  static getTelegramIdFromToken(token: string): number | null {
    const payload = this.validateAuthToken(token);
    return payload?.telegramId || null;
  }

  /**
   * Проверяет валидность токена (boolean результат)
   */
  static isValidToken(token: string): boolean {
    return this.validateAuthToken(token) !== null;
  }
}
