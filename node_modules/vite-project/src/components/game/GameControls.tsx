// src/components/GameControls.tsx - ЭЛЕМЕНТЫ УПРАВЛЕНИЯ ИГРОЙ

import React, { useMemo, useCallback } from 'react';
import { Card, Button, Alert } from 'react-bootstrap';
import { Card as CardType } from '../../../packages/shared/src/types';

// ===== ИНТЕРФЕЙСЫ =====

/**
 * Props для GameControls
 */
export interface GameControlsProps {
  phase: 'attack' | 'defend' | 'discard';
  isPlayerTurn: boolean;
  selectedCards: CardType[];
  onAttack: () => void;
  onTake: () => void;
  onPass: () => void;
  onDiscard?: () => void;
  isLoading?: boolean;
  error?: string | null;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Конфигурация фазы игры
 */
interface PhaseConfig {
  title: string;
  description: string;
  primaryAction?: {
    label: string;
    handler: () => void;
    disabled: boolean;
    variant: string;
  };
  secondaryActions?: Array<{
    label: string;
    handler: () => void;
    disabled: boolean;
    variant: string;
  }>;
}

// ===== КОНСТАНТЫ =====

const UI_TEXT = {
  PHASES: {
    ATTACK: 'Фаза атаки',
    DEFEND: 'Фаза защиты', 
    DISCARD: 'Фаза сброса'
  },
  DESCRIPTIONS: {
    ATTACK: 'Выберите карты для атаки и нажмите "Атаковать"',
    DEFEND: 'Защитите карты или возьмите их',
    DISCARD: 'Сбросьте лишние карты'
  },
  BUTTONS: {
    ATTACK: 'Атаковать',
    TAKE: 'Взять карты',
    PASS: 'Пас',
    DISCARD: 'Сбросить'
  },
  MESSAGES: {
    WAITING_TURN: 'Ожидание хода противника...',
    SELECT_CARDS: 'Выберите карты для атаки',
    NO_CARDS_SELECTED: 'Карты не выбраны',
    UNKNOWN_PHASE: 'Неизвестная фаза игры'
  },
  EMOJIS: {
    ATTACK: '🗡️',
    DEFEND: '🛡️',
    TAKE: '📥',
    PASS: '✅',
    DISCARD: '🗑️',
    WAITING: '⏳'
  }
} as const;

const BUTTON_VARIANTS = {
  PRIMARY: 'primary',
  SUCCESS: 'success',
  WARNING: 'warning',
  DANGER: 'danger',
  SECONDARY: 'secondary'
} as const;

const CSS_CLASSES = {
  CONTROLS: 'game-controls',
  CONTROLS_DISABLED: 'game-controls--disabled',
  PHASE_INFO: 'phase-info',
  ACTIONS: 'game-actions',
  WAITING: 'waiting-message'
} as const;

// ===== УТИЛИТАРНЫЕ ФУНКЦИИ =====

/**
 * Получение конфигурации для текущей фазы
 */
const getPhaseConfig = (
  phase: string,
  selectedCards: CardType[],
  onAttack: () => void,
  onTake: () => void,
  onPass: () => void,
  onDiscard?: () => void,
  isLoading = false
): PhaseConfig => {
  switch (phase) {
    case 'attack':
      return {
        title: UI_TEXT.PHASES.ATTACK,
        description: selectedCards.length > 0 
          ? `${UI_TEXT.DESCRIPTIONS.ATTACK} (${selectedCards.length} карт выбрано)`
          : UI_TEXT.DESCRIPTIONS.ATTACK,
        primaryAction: {
          label: `${UI_TEXT.EMOJIS.ATTACK} ${UI_TEXT.BUTTONS.ATTACK} (${selectedCards.length})`,
          handler: onAttack,
          disabled: selectedCards.length === 0 || isLoading,
          variant: BUTTON_VARIANTS.PRIMARY
        },
        secondaryActions: [
          {
            label: `${UI_TEXT.EMOJIS.PASS} ${UI_TEXT.BUTTONS.PASS}`,
            handler: onPass,
            disabled: isLoading,
            variant: BUTTON_VARIANTS.SECONDARY
          }
        ]
      };

    case 'defend':
      return {
        title: UI_TEXT.PHASES.DEFEND,
        description: UI_TEXT.DESCRIPTIONS.DEFEND,
        primaryAction: {
          label: `${UI_TEXT.EMOJIS.DEFEND} Защитить`,
          handler: () => {}, // Защита происходит через выбор карт
          disabled: true,
          variant: BUTTON_VARIANTS.SUCCESS
        },
        secondaryActions: [
          {
            label: `${UI_TEXT.EMOJIS.TAKE} ${UI_TEXT.BUTTONS.TAKE}`,
            handler: onTake,
            disabled: isLoading,
            variant: BUTTON_VARIANTS.WARNING
          },
          {
            label: `${UI_TEXT.EMOJIS.PASS} ${UI_TEXT.BUTTONS.PASS}`,
            handler: onPass,
            disabled: isLoading,
            variant: BUTTON_VARIANTS.SUCCESS
          }
        ]
      };

    case 'discard':
      return {
        title: UI_TEXT.PHASES.DISCARD,
        description: UI_TEXT.DESCRIPTIONS.DISCARD,
        primaryAction: onDiscard ? {
          label: `${UI_TEXT.EMOJIS.DISCARD} ${UI_TEXT.BUTTONS.DISCARD}`,
          handler: onDiscard,
          disabled: isLoading,
          variant: BUTTON_VARIANTS.DANGER
        } : undefined
      };

    default:
      return {
        title: UI_TEXT.MESSAGES.UNKNOWN_PHASE,
        description: `Неизвестная фаза: ${phase}`
      };
  }
};

/**
 * Получение CSS классов для контролов
 */
const getControlsClasses = (isPlayerTurn: boolean, className?: string): string => {
  let classes = CSS_CLASSES.CONTROLS;
  
  if (!isPlayerTurn) {
    classes += ` ${CSS_CLASSES.CONTROLS_DISABLED}`;
  }
  
  if (className) {
    classes += ` ${className}`;
  }
  
  return classes;
};

// ===== КОМПОНЕНТЫ =====

/**
 * Компонент информации о фазе
 */
const PhaseInfo: React.FC<{
  config: PhaseConfig;
}> = React.memo(({ config }) => (
  <div className={CSS_CLASSES.PHASE_INFO}>
    <h6 className="mb-2">{config.title}</h6>
    <p className="text-muted small mb-0">{config.description}</p>
  </div>
));

PhaseInfo.displayName = 'PhaseInfo';

/**
 * Компонент кнопки действия
 */
const ActionButton: React.FC<{
  label: string;
  handler: () => void;
  disabled: boolean;
  variant: string;
  isLoading?: boolean;
}> = React.memo(({ label, handler, disabled, variant, isLoading }) => (
  <Button
    variant={variant}
    onClick={handler}
    disabled={disabled}
    className="me-2 mb-2"
    aria-label={label.replace(/[🗡️🛡️📥✅🗑️⏳]/g, '').trim()}
  >
    {isLoading ? (
      <>
        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
        Загрузка...
      </>
    ) : (
      label
    )}
  </Button>
));

ActionButton.displayName = 'ActionButton';

/**
 * Компонент сообщения ожидания
 */
const WaitingMessage: React.FC = React.memo(() => (
  <div className={CSS_CLASSES.WAITING}>
    <Alert variant="info" className="text-center mb-0">
      <div className="d-flex align-items-center justify-content-center">
        <span className="me-2" role="img" aria-label="Ожидание">
          {UI_TEXT.EMOJIS.WAITING}
        </span>
        {UI_TEXT.MESSAGES.WAITING_TURN}
      </div>
    </Alert>
  </div>
));

WaitingMessage.displayName = 'WaitingMessage';

// ===== ОСНОВНОЙ КОМПОНЕНТ =====

/**
 * Компонент элементов управления игрой
 */
export const GameControls: React.FC<GameControlsProps> = React.memo(({
  phase,
  isPlayerTurn,
  selectedCards,
  onAttack,
  onTake,
  onPass,
  onDiscard,
  isLoading = false,
  error,
  className,
  style
}) => {
  // ===== ВАЛИДАЦИЯ =====

  if (!onAttack || !onTake || !onPass) {
    console.warn('GameControls: Missing required callbacks');
    return null;
  }

  // ===== МЕМОИЗИРОВАННЫЕ ВЫЧИСЛЕНИЯ =====

  /**
   * Мемоизированная конфигурация фазы
   */
  const phaseConfig = useMemo(() => {
    return getPhaseConfig(
      phase,
      selectedCards,
      onAttack,
      onTake,
      onPass,
      onDiscard,
      isLoading
    );
  }, [phase, selectedCards, onAttack, onTake, onPass, onDiscard, isLoading]);

  /**
   * Мемоизированные CSS классы
   */
  const controlsClasses = useMemo(() => {
    return getControlsClasses(isPlayerTurn, className);
  }, [isPlayerTurn, className]);

  // ===== ОБРАБОТЧИКИ СОБЫТИЙ =====

  /**
   * Обработчик основного действия
   */
  const handlePrimaryAction = useCallback(() => {
    if (phaseConfig.primaryAction && !phaseConfig.primaryAction.disabled) {
      phaseConfig.primaryAction.handler();
    }
  }, [phaseConfig.primaryAction]);

  // ===== EARLY RETURN ДЛЯ ЧУЖОГО ХОДА =====

  if (!isPlayerTurn) {
    return (
      <Card className={controlsClasses} style={style}>
        <Card.Body>
          <WaitingMessage />
        </Card.Body>
      </Card>
    );
  }

  // ===== РЕНДЕР =====

  return (
    <Card 
      className={controlsClasses} 
      style={style}
      role="region"
      aria-label="Элементы управления игрой"
    >
      <Card.Body>
        {/* Информация о фазе */}
        <PhaseInfo config={phaseConfig} />

        {/* Ошибка */}
        {error && (
          <Alert variant="danger" className="mt-3 mb-3">
            {error}
          </Alert>
        )}

        {/* Действия */}
        <div className={CSS_CLASSES.ACTIONS}>
          {/* Основное действие */}
          {phaseConfig.primaryAction && (
            <ActionButton
              label={phaseConfig.primaryAction.label}
              handler={phaseConfig.primaryAction.handler}
              disabled={phaseConfig.primaryAction.disabled}
              variant={phaseConfig.primaryAction.variant}
              isLoading={isLoading}
            />
          )}

          {/* Дополнительные действия */}
          {phaseConfig.secondaryActions?.map((action, index) => (
            <ActionButton
              key={`secondary-${index}`}
              label={action.label}
              handler={action.handler}
              disabled={action.disabled}
              variant={action.variant}
              isLoading={isLoading}
            />
          ))}
        </div>

        {/* Подсказка для фазы атаки */}
        {phase === 'attack' && selectedCards.length === 0 && (
          <Alert variant="info" className="mt-3 mb-0">
            <small>{UI_TEXT.MESSAGES.SELECT_CARDS}</small>
          </Alert>
        )}
      </Card.Body>
    </Card>
  );
});

// Установка displayName для лучшей отладки
GameControls.displayName = 'GameControls';

// ===== ЭКСПОРТ =====
export default GameControls;
export type { GameControlsProps, PhaseConfig };
export { 
  UI_TEXT, 
  BUTTON_VARIANTS, 
  CSS_CLASSES,
  getPhaseConfig,
  getControlsClasses
};
