import { Request, Response } from 'express';
import { TelegramAuth } from '../auth/TelegramAuth';
import { AuthSuccessResponse, AuthErrorResponse, Player } from '../types/AuthTypes';
import crypto from 'crypto';

export const authenticateTelegram = async (req: Request, res: Response) => {
  try {
    const { initData } = req.body;

    if (!initData) {
      return res.status(400).json({
        success: false,
        error: 'initData is required'
      } as AuthErrorResponse);
    }

    // Используем новый метод официальной валидации
    const authResult = TelegramAuth.authenticateFromInitData(initData);
    
    if (!authResult) {
      return res.status(401).json({
        success: false,
        error: 'Invalid Telegram signature or user data'
      } as AuthErrorResponse);
    }

    const { user, token } = authResult;
    const sessionId = crypto.randomUUID();

    // Создаем объект игрока в вашем формате
    const player: Player = {
      id: sessionId,
      name: user.first_name,
      telegramId: user.id,
      username: user.username,
      avatar: user.photo_url,
      isReady: false
    };

    const response: AuthSuccessResponse = {
      success: true,
      token,
      sessionId,
      user: player,
      expiresAt: Date.now() + 24 * 60 * 60 * 1000 // 24 часа
    };

    res.json(response);
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as AuthErrorResponse);
  }
};
