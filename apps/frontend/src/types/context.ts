// src/types/context.ts - ТИПЫ ДЛЯ ФРОНТЕНД КОНТЕКСТОВ

import { 
  GameMode, 
  ThrowingMode, 
  CardCount, 
  PlayerCount,
  VALIDATION_RULES,
  ValidationResult 
} from '@shared/types';

/**
 * Режимы игры в дурака
 */
export enum GameModeEnum {
  /** Классический дурак */
  Classic = 'classic',
  /** Переводной дурак */
  Transferable = 'transferable'
}

/**
 * Режимы подкидывания карт
 */
export enum ThrowingModeEnum {
  /** Стандартный режим */
  Standard = 'standard',
  /** Умный режим подкидывания */
  Smart = 'smart'
}

/**
 * Правила игры
 */
export interface GameRules {
  gameMode: GameMode;
  throwingMode: ThrowingMode;
  cardCount: CardCount;
  maxPlayers: PlayerCount;
}

/**
 * Настройки игры для создания комнаты
 */
export interface UseGameSettings {
  // Состояние
  playerCount: PlayerCount;
  gameMode: GameMode;
  throwingMode: ThrowingMode;
  cardCount: CardCount;
  maxPlayers: PlayerCount;
  
  // Методы изменения
  setPlayerCount: (count: PlayerCount) => void;
  setGameMode: (mode: GameMode) => void;
  setThrowingMode: (mode: ThrowingMode) => void;
  setCardCount: (count: CardCount) => void;
  setMaxPlayers: (count: PlayerCount) => void;
  
  // Дополнительные методы
  resetToDefaults: () => void;
  validateSettings: () => ValidationResult;
  isValid: boolean;
  getCompatibilityWarnings: () => string[];
}

/**
 * Расширенный интерфейс настроек с дополнительными методами
 */
export interface UseGameSettingsExtended extends UseGameSettings {
  // Утилитарные методы
  exportSettings: () => GameRules;
  importSettings: (rules: GameRules) => void;
  
  // Валидация
  validatePlayerCount: (count: number) => boolean;
  validateCardCount: (count: number) => boolean;
  validateMaxPlayers: (count: number) => boolean;
  
  // Совместимость
  getRecommendedSettings: () => Partial<GameRules>;
  isSettingsCombinationValid: (rules: Partial<GameRules>) => boolean;
}

// ===== КОНСТАНТЫ ПО УМОЛЧАНИЮ =====

/**
 * Настройки игры по умолчанию
 */
export const DEFAULT_GAME_RULES: GameRules = {
  gameMode: GameModeEnum.Classic,
  throwingMode: ThrowingModeEnum.Standard,
  cardCount: 36,
  maxPlayers: 4
} as const;

/**
 * Настройки контекста по умолчанию
 */
export const DEFAULT_GAME_SETTINGS: Omit<UseGameSettings, 
  'setPlayerCount' | 'setGameMode' | 'setThrowingMode' | 'setCardCount' | 'setMaxPlayers' |
  'resetToDefaults' | 'validateSettings' | 'isValid' | 'getCompatibilityWarnings'
> = {
  playerCount: 2,
  gameMode: GameModeEnum.Classic,
  throwingMode: ThrowingModeEnum.Standard,
  cardCount: 36,
  maxPlayers: 4
} as const;

// ===== ВАЛИДАЦИОННЫЕ ФУНКЦИИ =====

/**
 * Валидация правил игры
 */
export const validateGameRules = (rules: Partial<GameRules>): ValidationResult => {
  const errors: string[] = [];
  
  // Валидация количества карт
  if (rules.cardCount && ![24, 36, 52].includes(rules.cardCount)) {
    errors.push(`Недопустимое количество карт: ${rules.cardCount}. Разрешено: 24, 36, 52`);
  }
  
  // Валидация максимального количества игроков
  if (rules.maxPlayers && (rules.maxPlayers < 2 || rules.maxPlayers > 6)) {
    errors.push(`Недопустимое количество игроков: ${rules.maxPlayers}. Разрешено: 2-6`);
  }
  
  // Валидация совместимости карт и игроков
  if (rules.cardCount === 24 && rules.maxPlayers && rules.maxPlayers > 3) {
    errors.push('При 24 картах максимум 3 игрока');
  }
  
  if (rules.cardCount === 36 && rules.maxPlayers && rules.maxPlayers > 4) {
    errors.push('При 36 картах максимум 4 игрока');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Проверка совместимости настроек
 */
export const getCompatibilityWarnings = (rules: GameRules): string[] => {
  const warnings: string[] = [];
  
  if (rules.cardCount === 24 && rules.maxPlayers > 2) {
    warnings.push('С 24 картами рекомендуется играть вдвоем');
  }
  
  if (rules.gameMode === 'transferable' && rules.throwingMode === 'smart') {
    warnings.push('Переводной дурак со умным подкидыванием может быть сложным для новичков');
  }
  
  if (rules.maxPlayers === 6 && rules.cardCount === 36) {
    warnings.push('При 6 игроках с 36 картами игра может быть очень быстрой');
  }
  
  return warnings;
};

// ===== ТИПЫ ДЛЯ ОПИСАНИЙ =====

/**
 * Описания режимов игры для UI
 */
export interface GameModeDescriptions {
  [GameModeEnum.Classic]: string;
  [GameModeEnum.Transferable]: string;
}

/**
 * Описания режимов подкидывания для UI
 */
export interface ThrowingModeDescriptions {
  [ThrowingModeEnum.Standard]: string;
  [ThrowingModeEnum.Smart]: string;
}

/**
 * Текстовые описания для UI
 */
export const GAME_MODE_DESCRIPTIONS: GameModeDescriptions = {
  [GameModeEnum.Classic]: 'Классический дурак - стандартные правила игры',
  [GameModeEnum.Transferable]: 'Переводной дурак - можно переводить атаку на следующего игрока'
};

export const THROWING_MODE_DESCRIPTIONS: ThrowingModeDescriptions = {
  [ThrowingModeEnum.Standard]: 'Стандартное подкидывание - по одной карте',
  [ThrowingModeEnum.Smart]: 'Умное подкидывание - автоматический выбор лучших карт'
};

// ===== УТИЛИТАРНЫЕ ТИПЫ =====

/**
 * Тип для размеров карт
 */
export type CardSize = 'small' | 'medium' | 'large';

/**
 * Тип для цветов мастей
 */
export type SuitColor = 'text-danger' | 'text-dark';

/**
 * Тип для статусов соединения
 */
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

// ===== КОНФИГУРАЦИОННЫЕ КОНСТАНТЫ =====

/**
 * Константы для UI компонентов
 */
export const UI_CONFIG = {
  CARD_SIZES: {
    small: { width: '35px', height: '50px', fontSize: '0.7rem' },
    medium: { width: '60px', height: '85px', fontSize: '0.9rem' },
    large: { width: '80px', height: '110px', fontSize: '1.1rem' }
  },
  COLORS: {
    RED_SUITS: ['♥', '♦'],
    BLACK_SUITS: ['♠', '♣']
  },
  ANIMATIONS: {
    DURATION: '0.3s',
    EASING: 'ease',
    LIFT_DISTANCE: '-0.125rem'
  }
} as const;

/**
 * Константы для игровой логики
 */
export const GAME_CONSTANTS = {
  MAX_CARDS_IN_HAND: 6,
  MIN_CARDS_TO_START: 6,
  TURN_TIMEOUT_MS: 60000,
  HEARTBEAT_INTERVAL_MS: 30000
} as const;

// ===== ЭКСПОРТ ВСЕХ ТИПОВ =====
export type {
  GameRules as GameRulesType,
  UseGameSettings as UseGameSettingsType,
  UseGameSettingsExtended as UseGameSettingsExtendedType
};
