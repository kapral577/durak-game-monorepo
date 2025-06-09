import { TelegramUser, Player, AuthSuccessResponse, AuthErrorResponse } from '../types/AuthTypes';
import { validate, parse } from '@telegram-apps/init-data-node';
import jwt from 'jsonwebtoken';

export class TelegramAuth {
  private static readonly JWT_SECRET = process.env.JWT_SECRET || 'development-jwt-secret';
  private static readonly BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

  /**
   * НОВЫЙ МЕТОД: Официальная валидация Telegram initData
   */
  static validateTelegramInitData(initData: string): boolean {
    if (!this.BOT_TOKEN) {
      console.error('TELEGRAM_BOT_TOKEN not configured');
      return false;
    }

    try {
      validate(initData, this.BOT_TOKEN, { expiresIn: 3600 }); // 1 час
      return true;
    } catch (error) {
      console.error('Telegram validation failed:', error);
      return false;
    }
  }

  /**
   * НОВЫЙ МЕТОД: Извлечение и валидация пользователя из initData
   */
  static extractAndValidateUser(initData: string): TelegramUser | null {
    // Сначала валидируем подпись
    if (!this.validateTelegramInitData(initData)) {
      return null;
    }

    try {
      // Используем официальный парсер
      const parsed = parse(initData);
      
      if (!parsed.user) {
        console.error('No user data in initData');
        return null;
      }

      // Возвращаем пользователя в формате ваших типов
      return {
        id: parsed.user.id,
        first_name: parsed.user.firstName,
        last_name: parsed.user.lastName,
        username: parsed.user.username,
        photo_url: parsed.user.photoUrl,
        language_code: parsed.user.languageCode
      } as TelegramUser;
    } catch (error) {
      console.error('User extraction failed:', error);
      return null;
    }
  }

  /**
   * НОВЫЙ МЕТОД: Полная аутентификация через initData
   */
  static authenticateFromInitData(initData: string): { user: TelegramUser; token: string } | null {
    const user = this.extractAndValidateUser(initData);
    
    if (!user) {
      return null;
    }

    try {
      const token = this.generateAuthToken(user);
      return { user, token };
    } catch (error) {
      console.error('Authentication failed:', error);
      return null;
    }
  }

  /**
   * Ваш существующий метод - БЕЗ ИЗМЕНЕНИЙ
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
   * Ваш существующий метод - БЕЗ ИЗМЕНЕНИЙ
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
   * Ваш существующий метод - БЕЗ ИЗМЕНЕНИЙ
   */
  static getTelegramIdFromToken(token: string): number | null {
    const payload = this.validateAuthToken(token);
    return payload?.telegramId || null;
  }

  /**
   * Ваш существующий метод - БЕЗ ИЗМЕНЕНИЙ
   */
  static isValidToken(token: string): boolean {
    return this.validateAuthToken(token) !== null;
  }
}