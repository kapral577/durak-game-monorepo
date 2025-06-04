// src/contexts/GameSettingsProvider.tsx - ПРОВАЙДЕР НАСТРОЕК ИГРЫ

import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { 
  GameMode, 
  ThrowingMode, 
  CardCount, 
  PlayerCount,
  GameRules,
  ValidationResult,
  VALIDATION_RULES 
} from '../../../packages/shared/src/types';
import { 
  UseGameSettings,
  UseGameSettingsExtended,
  DEFAULT_GAME_SETTINGS,
  validateGameRules,
  getCompatibilityWarnings
} from '../types/context';

// ===== ИНТЕРФЕЙСЫ =====

/**
 * Props для GameSettingsProvider
 */
interface GameSettingsProviderProps {
  children: React.ReactNode;
}

// ===== КОНСТАНТЫ =====

const STORAGE_KEY = 'durak-game-settings';

const VALIDATION_CONSTRAINTS = {
  PLAYER_COUNT: {
    MIN: 2,
    MAX: 6
  },
  CARD_COUNT: {
    ALLOWED: [24, 36, 52] as const
  },
  MAX_PLAYERS: {
    MIN: 2,
    MAX: 6
  }
} as const;

const ERROR_MESSAGES = {
  INVALID_PLAYER_COUNT: 'Недопустимое количество игроков',
  INVALID_CARD_COUNT: 'Недопустимое количество карт',
  INVALID_MAX_PLAYERS: 'Недопустимое максимальное количество игроков',
  STORAGE_ERROR: 'Ошибка работы с локальным хранилищем'
} as const;

// ===== УТИЛИТАРНЫЕ ФУНКЦИИ =====

/**
 * Загрузка настроек из localStorage
 */
const loadSettingsFromStorage = (): Partial<typeof DEFAULT_GAME_SETTINGS> => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Валидация загруженных данных
      if (typeof parsed === 'object' && parsed !== null) {
        return parsed;
      }
    }
  } catch (error) {
    console.warn('Failed to load settings from localStorage:', error);
  }
  return {};
};

/**
 * Сохранение настроек в localStorage
 */
const saveSettingsToStorage = (settings: typeof DEFAULT_GAME_SETTINGS): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    console.warn('Failed to save settings to localStorage:', error);
  }
};

/**
 * Валидация количества игроков
 */
const validatePlayerCount = (count: number): boolean => {
  return Number.isInteger(count) && 
    count >= VALIDATION_CONSTRAINTS.PLAYER_COUNT.MIN && 
    count <= VALIDATION_CONSTRAINTS.PLAYER_COUNT.MAX;
};

/**
 * Валидация количества карт
 */
const validateCardCount = (count: number): boolean => {
  return VALIDATION_CONSTRAINTS.CARD_COUNT.ALLOWED.includes(count as any);
};

/**
 * Валидация максимального количества игроков
 */
const validateMaxPlayers = (count: number): boolean => {
  return Number.isInteger(count) && 
    count >= VALIDATION_CONSTRAINTS.MAX_PLAYERS.MIN && 
    count <= VALIDATION_CONSTRAINTS.MAX_PLAYERS.MAX;
};

// ===== СОЗДАНИЕ КОНТЕКСТА =====

const GameSettingsContext = createContext<UseGameSettingsExtended | null>(null);

// ===== ПРОВАЙДЕР =====

/**
 * Провайдер настроек игры
 */
export const GameSettingsProvider: React.FC<GameSettingsProviderProps> = ({ children }) => {
  // Инициализация состояния с данными из localStorage
  const [playerCount, setPlayerCountState] = useState<PlayerCount>(() => {
    const saved = loadSettingsFromStorage();
    return (saved.playerCount && validatePlayerCount(saved.playerCount)) 
      ? saved.playerCount as PlayerCount
      : DEFAULT_GAME_SETTINGS.playerCount;
  });

  const [gameMode, setGameModeState] = useState<GameMode>(() => {
    const saved = loadSettingsFromStorage();
    return saved.gameMode || DEFAULT_GAME_SETTINGS.gameMode;
  });

  const [throwingMode, setThrowingModeState] = useState<ThrowingMode>(() => {
    const saved = loadSettingsFromStorage();
    return saved.throwingMode || DEFAULT_GAME_SETTINGS.throwingMode;
  });

  const [cardCount, setCardCountState] = useState<CardCount>(() => {
    const saved = loadSettingsFromStorage();
    return (saved.cardCount && validateCardCount(saved.cardCount))
      ? saved.cardCount as CardCount
      : DEFAULT_GAME_SETTINGS.cardCount;
  });

  const [maxPlayers, setMaxPlayersState] = useState<PlayerCount>(() => {
    const saved = loadSettingsFromStorage();
    return (saved.maxPlayers && validateMaxPlayers(saved.maxPlayers))
      ? saved.maxPlayers as PlayerCount
      : DEFAULT_GAME_SETTINGS.maxPlayers;
  });

  // ===== ОБРАБОТЧИКИ ИЗМЕНЕНИЙ =====

  /**
   * Установка количества игроков с валидацией
   */
  const setPlayerCount = useCallback((count: PlayerCount) => {
    if (validatePlayerCount(count) && count <= maxPlayers) {
      setPlayerCountState(count);
    } else {
      console.warn(`${ERROR_MESSAGES.INVALID_PLAYER_COUNT}: ${count}. Must be between ${VALIDATION_CONSTRAINTS.PLAYER_COUNT.MIN} and ${maxPlayers}`);
    }
  }, [maxPlayers]);

  /**
   * Установка режима игры
   */
  const setGameMode = useCallback((mode: GameMode) => {
    setGameModeState(mode);
  }, []);

  /**
   * Установка режима подкидывания
   */
  const setThrowingMode = useCallback((mode: ThrowingMode) => {
    setThrowingModeState(mode);
  }, []);

  /**
   * Установка количества карт с валидацией
   */
  const setCardCount = useCallback((count: CardCount) => {
    if (validateCardCount(count)) {
      setCardCountState(count);
    } else {
      console.warn(`${ERROR_MESSAGES.INVALID_CARD_COUNT}: ${count}. Allowed values: ${VALIDATION_CONSTRAINTS.CARD_COUNT.ALLOWED.join(', ')}`);
    }
  }, []);

  /**
   * Установка максимального количества игроков с валидацией
   */
  const setMaxPlayers = useCallback((count: PlayerCount) => {
    if (validateMaxPlayers(count)) {
      setMaxPlayersState(count);
      // Автоматическая корректировка количества игроков
      if (playerCount > count) {
        setPlayerCountState(count);
      }
    } else {
      console.warn(`${ERROR_MESSAGES.INVALID_MAX_PLAYERS}: ${count}. Must be between ${VALIDATION_CONSTRAINTS.MAX_PLAYERS.MIN} and ${VALIDATION_CONSTRAINTS.MAX_PLAYERS.MAX}`);
    }
  }, [playerCount]);

  // ===== ДОПОЛНИТЕЛЬНЫЕ МЕТОДЫ =====

  /**
   * Сброс к настройкам по умолчанию
   */
  const resetToDefaults = useCallback(() => {
    setPlayerCountState(DEFAULT_GAME_SETTINGS.playerCount);
    setGameModeState(DEFAULT_GAME_SETTINGS.gameMode);
    setThrowingModeState(DEFAULT_GAME_SETTINGS.throwingMode);
    setCardCountState(DEFAULT_GAME_SETTINGS.cardCount);
    setMaxPlayersState(DEFAULT_GAME_SETTINGS.maxPlayers);
  }, []);

  /**
   * Валидация текущих настроек
   */
  const validateSettings = useCallback((): ValidationResult => {
    const rules: GameRules = {
      gameMode,
      throwingMode,
      cardCount,
      maxPlayers
    };
    return validateGameRules(rules);
  }, [gameMode, throwingMode, cardCount, maxPlayers]);

  /**
   * Получение предупреждений о совместимости
   */
  const getCompatibilityWarningsCallback = useCallback((): string[] => {
    const rules: GameRules = {
      gameMode,
      throwingMode,
      cardCount,
      maxPlayers
    };
    return getCompatibilityWarnings(rules);
  }, [gameMode, throwingMode, cardCount, maxPlayers]);

  /**
   * Экспорт настроек как GameRules
   */
  const exportSettings = useCallback((): GameRules => {
    return {
      gameMode,
      throwingMode,
      cardCount,
      maxPlayers
    };
  }, [gameMode, throwingMode, cardCount, maxPlayers]);

  /**
   * Импорт настроек из GameRules
   */
  const importSettings = useCallback((rules: GameRules) => {
    if (validateGameRules(rules).isValid) {
      setGameModeState(rules.gameMode);
      setThrowingModeState(rules.throwingMode);
      setCardCountState(rules.cardCount);
      setMaxPlayersState(rules.maxPlayers);
      
      // Корректировка playerCount если необходимо
      if (playerCount > rules.maxPlayers) {
        setPlayerCountState(rules.maxPlayers);
      }
    } else {
      console.warn('Invalid rules provided to importSettings:', rules);
    }
  }, [playerCount]);

  /**
   * Получение рекомендованных настроек
   */
  const getRecommendedSettings = useCallback((): Partial<GameRules> => {
    const recommendations: Partial<GameRules> = {};
    
    if (cardCount === 24) {
      recommendations.maxPlayers = 3;
    } else if (cardCount === 36) {
      recommendations.maxPlayers = 4;
    } else if (cardCount === 52) {
      recommendations.maxPlayers = 6;
    }
    
    return recommendations;
  }, [cardCount]);

  /**
   * Проверка валидности комбинации настроек
   */
  const isSettingsCombinationValid = useCallback((rules: Partial<GameRules>): boolean => {
    const fullRules: GameRules = {
      gameMode: rules.gameMode || gameMode,
      throwingMode: rules.throwingMode || throwingMode,
      cardCount: rules.cardCount || cardCount,
      maxPlayers: rules.maxPlayers || maxPlayers
    };
    
    return validateGameRules(fullRules).isValid;
  }, [gameMode, throwingMode, cardCount, maxPlayers]);

  // ===== МЕМОИЗИРОВАННОЕ ЗНАЧЕНИЕ КОНТЕКСТА =====

  const value: UseGameSettingsExtended = useMemo(() => ({
    // Состояние
    playerCount,
    gameMode,
    throwingMode,
    cardCount,
    maxPlayers,
    
    // Основные методы
    setPlayerCount,
    setGameMode,
    setThrowingMode,
    setCardCount,
    setMaxPlayers,
    
    // Дополнительные методы
    resetToDefaults,
    validateSettings,
    isValid: validateSettings().isValid,
    getCompatibilityWarnings: getCompatibilityWarningsCallback,
    
    // Расширенные методы
    exportSettings,
    importSettings,
    validatePlayerCount,
    validateCardCount,
    validateMaxPlayers,
    getRecommendedSettings,
    isSettingsCombinationValid
  }), [
    playerCount,
    gameMode,
    throwingMode,
    cardCount,
    maxPlayers,
    setPlayerCount,
    setGameMode,
    setThrowingMode,
    setCardCount,
    setMaxPlayers,
    resetToDefaults,
    validateSettings,
    getCompatibilityWarningsCallback,
    exportSettings,
    importSettings,
    getRecommendedSettings,
    isSettingsCombinationValid
  ]);

  // ===== АВТОСОХРАНЕНИЕ В LOCALSTORAGE =====

  useEffect(() => {
    const currentSettings = {
      playerCount,
      gameMode,
      throwingMode,
      cardCount,
      maxPlayers
    };
    saveSettingsToStorage(currentSettings);
  }, [playerCount, gameMode, throwingMode, cardCount, maxPlayers]);

  // ===== РЕНДЕР =====

  return (
    <GameSettingsContext.Provider value={value}>
      {children}
    </GameSettingsContext.Provider>
  );
};

// ===== ХУК ДЛЯ ИСПОЛЬЗОВАНИЯ КОНТЕКСТА =====

/**
 * Хук для использования настроек игры
 */
export const useGameSettings = (): UseGameSettingsExtended => {
  const context = useContext(GameSettingsContext);
  
  if (!context) {
    throw new Error('useGameSettings must be used within a GameSettingsProvider');
  }
  
  return context;
};

// ===== ЭКСПОРТ ДОПОЛНИТЕЛЬНЫХ ТИПОВ И КОНСТАНТ =====
export type { GameSettingsProviderProps };
export { STORAGE_KEY, VALIDATION_CONSTRAINTS, ERROR_MESSAGES };
