// src/pages/GameSettingsPage.tsx - СТРАНИЦА НАСТРОЕК ИГРЫ

import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { useGame } from '../context/GameProvider';
import { useGameSettings } from '../context/GameSettingsProvider';
import { GameMode, ThrowingMode, CardCount, PlayerCount } from '@shared/types';
import { useDeviceType } from '../hooks/useDeviceType';

// ===== ИНТЕРФЕЙСЫ =====

/**
 * Props для GameSettingsPage
 */
export interface GameSettingsPageProps {
  // Если нужны props в будущем
}

// ===== КОНСТАНТЫ =====

const UI_TEXT = {
  PAGE_TITLE: 'Настройки игры',
  BACK_BUTTON: '← Назад',
  CREATE_ROOM_BUTTON: 'Создать комнату',
  ROOM_NAME_LABEL: 'Название комнаты',
  ROOM_NAME_PLACEHOLDER: 'Введите название комнаты',
  GAME_MODE_LABEL: 'Режим игры',
  THROWING_MODE_LABEL: 'Режим подкидывания',
  CARD_COUNT_LABEL: 'Количество карт',
  MAX_PLAYERS_LABEL: 'Максимум игроков',
  CREATING_ROOM: 'Создание комнаты...',
  REDIRECT_MESSAGE: 'Комната создана! Перенаправление...'
} as const;

const VALIDATION_RULES = {
  ROOM_NAME: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 50
  }
} as const;

const GAME_MODE_DESCRIPTIONS = {
  classic: 'Классический дурак - стандартные правила игры',
  transferable: 'Переводной дурак - можно переводить атаку на следующего игрока'
} as const;

const THROWING_MODE_DESCRIPTIONS = {
  standard: 'Стандартное подкидывание - по одной карте',
  smart: 'Умное подкидывание - автоматический выбор лучших карт'
} as const;

const CARD_COUNT_OPTIONS: readonly CardCount[] = [24, 36, 52] as const;
const MAX_PLAYERS_OPTIONS: readonly PlayerCount[] = [2, 3, 4, 5, 6] as const;

const CSS_CLASSES = {
  SETTINGS_PAGE: 'game-settings-page',
  SETTINGS_FORM: 'settings-form',
  FORM_SECTION: 'form-section'
} as const;

// ===== УТИЛИТАРНЫЕ ФУНКЦИИ =====

/**
 * Валидация названия комнаты
 */
const validateRoomName = (name: string): string | null => {
  const trimmedName = name.trim();
  
  if (trimmedName.length < VALIDATION_RULES.ROOM_NAME.MIN_LENGTH) {
    return `Название должно содержать минимум ${VALIDATION_RULES.ROOM_NAME.MIN_LENGTH} символа`;
  }
  
  if (trimmedName.length > VALIDATION_RULES.ROOM_NAME.MAX_LENGTH) {
    return `Название должно содержать максимум ${VALIDATION_RULES.ROOM_NAME.MAX_LENGTH} символов`;
  }
  
  return null;
};

// ===== КОМПОНЕНТЫ =====

/**
 * Секция названия комнаты
 */
const RoomNameSection: React.FC<{
  roomName: string;
  onNameChange: (name: string) => void;
  isCreating: boolean;
  validationError: string | null;
}> = React.memo(({ roomName, onNameChange, isCreating, validationError }) => (
  <Card className={`${CSS_CLASSES.FORM_SECTION} mb-4`}>
    <Card.Body>
      <Form.Group>
        <Form.Label>{UI_TEXT.ROOM_NAME_LABEL}</Form.Label>
        <Form.Control
          type="text"
          placeholder={UI_TEXT.ROOM_NAME_PLACEHOLDER}
          value={roomName}
          onChange={(e) => onNameChange(e.target.value)}
          maxLength={VALIDATION_RULES.ROOM_NAME.MAX_LENGTH}
          disabled={isCreating}
          isInvalid={!!validationError}
          aria-describedby="room-name-help"
        />
        <Form.Text id="room-name-help" className="text-muted">
          {roomName.length}/{VALIDATION_RULES.ROOM_NAME.MAX_LENGTH} символов
        </Form.Text>
        {validationError && (
          <Form.Control.Feedback type="invalid">
            {validationError}
          </Form.Control.Feedback>
        )}
      </Form.Group>
    </Card.Body>
  </Card>
));

RoomNameSection.displayName = 'RoomNameSection';

/**
 * Секция режима игры
 */
const GameModeSection: React.FC<{
  gameMode: GameMode;
  onGameModeChange: (mode: GameMode) => void;
  isCreating: boolean;
}> = React.memo(({ gameMode, onGameModeChange, isCreating }) => (
  <Card className={`${CSS_CLASSES.FORM_SECTION} mb-4`}>
    <Card.Body>
      <Form.Group>
        <Form.Label>{UI_TEXT.GAME_MODE_LABEL}</Form.Label>
        {Object.entries(GAME_MODE_DESCRIPTIONS).map(([mode, description]) => (
          <Form.Check
            key={mode}
            type="radio"
            id={`gameMode-${mode}`}
            name="gameMode"
            label={
              <div>
                <strong>{mode === 'classic' ? 'Классический' : 'Переводной'}</strong>
                <br />
                <small className="text-muted">{description}</small>
              </div>
            }
            checked={gameMode === mode}
            onChange={() => onGameModeChange(mode as GameMode)}
            disabled={isCreating}
          />
        ))}
      </Form.Group>
    </Card.Body>
  </Card>
));

GameModeSection.displayName = 'GameModeSection';

/**
 * Секция режима подкидывания
 */
const ThrowingModeSection: React.FC<{
  throwingMode: ThrowingMode;
  onThrowingModeChange: (mode: ThrowingMode) => void;
  isCreating: boolean;
}> = React.memo(({ throwingMode, onThrowingModeChange, isCreating }) => (
  <Card className={`${CSS_CLASSES.FORM_SECTION} mb-4`}>
    <Card.Body>
      <Form.Group>
        <Form.Label>{UI_TEXT.THROWING_MODE_LABEL}</Form.Label>
        {Object.entries(THROWING_MODE_DESCRIPTIONS).map(([mode, description]) => (
          <Form.Check
            key={mode}
            type="radio"
            id={`throwingMode-${mode}`}
            name="throwingMode"
            label={
              <div>
                <strong>{mode === 'standard' ? 'Стандартный' : 'Умный'}</strong>
                <br />
                <small className="text-muted">{description}</small>
              </div>
            }
            checked={throwingMode === mode}
            onChange={() => onThrowingModeChange(mode as ThrowingMode)}
            disabled={isCreating}
          />
        ))}
      </Form.Group>
    </Card.Body>
  </Card>
));

ThrowingModeSection.displayName = 'ThrowingModeSection';

/**
 * Секция количества карт и игроков
 */
const GameParametersSection: React.FC<{
  cardCount: CardCount;
  maxPlayers: PlayerCount;
  onCardCountChange: (count: CardCount) => void;
  onMaxPlayersChange: (count: PlayerCount) => void;
  isCreating: boolean;
}> = React.memo(({ cardCount, maxPlayers, onCardCountChange, onMaxPlayersChange, isCreating }) => (
  <Card className={`${CSS_CLASSES.FORM_SECTION} mb-4`}>
    <Card.Body>
      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>{UI_TEXT.CARD_COUNT_LABEL}</Form.Label>
            <Form.Select
              value={cardCount}
              onChange={(e) => onCardCountChange(Number(e.target.value) as CardCount)}
              disabled={isCreating}
            >
              {CARD_COUNT_OPTIONS.map((count) => (
                <option key={count} value={count}>
                  {count} карт
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Col>
        
        <Col md={6}>
          <Form.Group>
            <Form.Label>{UI_TEXT.MAX_PLAYERS_LABEL}</Form.Label>
            <Form.Select
              value={maxPlayers}
              onChange={(e) => onMaxPlayersChange(Number(e.target.value) as PlayerCount)}
              disabled={isCreating}
            >
              {MAX_PLAYERS_OPTIONS.map((count) => (
                <option key={count} value={count}>
                  {count} игроков
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Col>
      </Row>
    </Card.Body>
  </Card>
));

GameParametersSection.displayName = 'GameParametersSection';

// ===== ОСНОВНОЙ КОМПОНЕНТ =====

/**
 * Страница настроек игры
 */
export const GameSettingsPage: React.FC<GameSettingsPageProps> = () => {
   const device = useDeviceType();

  // Состояния
  const [roomName, setRoomName] = useState<string>('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState<boolean>(false);

  // Хуки
  const navigate = useNavigate();
  const { createRoom, isConnected } = useGame();
  const {
    gameMode,
    throwingMode,
    cardCount,
    maxPlayers,
    setGameMode,
    setThrowingMode,
    setCardCount,
    setMaxPlayers,
    validateSettings,
    getCompatibilityWarnings
  } = useGameSettings();

  // ===== ОБРАБОТЧИКИ СОБЫТИЙ =====

  /**
   * Обработчик возврата назад
   */
  const handleBack = useCallback(() => {
    navigate('/');
  }, [navigate]);

  /**
   * Валидация настроек
   */
  const validateAllSettings = useCallback((): string | null => {
    // Валидация названия комнаты
    const nameError = validateRoomName(roomName);
    if (nameError) {
      return nameError;
    }

    // Валидация игровых настроек
    const settingsValidation = validateSettings();
    if (!settingsValidation.isValid) {
      return settingsValidation.errors[0];
    }

    return null;
  }, [roomName, validateSettings]);

  /**
   * Обработчик создания комнаты
   */
  const handleCreateRoom = useCallback(async () => {
    const validationResult = validateAllSettings();
    if (validationResult) {
      setValidationError(validationResult);
      return;
    }

    if (!isConnected) {
      setValidationError('Нет соединения с сервером');
      return;
    }

    setIsCreating(true);
    setValidationError(null);
    
    try {
      const rules = {
        gameMode,
        throwingMode,
        cardCount,
        maxPlayers,
      };
      
      await createRoom(roomName.trim(), rules);
      
      // Показать сообщение о перенаправлении
      setValidationError(null);
      
      // Перенаправление произойдет автоматически через GameProvider
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка создания комнаты';
      console.error('Error creating room:', err);
      setValidationError(errorMessage);
    } finally {
      setIsCreating(false);
    }
  }, [validateAllSettings, isConnected, roomName, gameMode, throwingMode, cardCount, maxPlayers, createRoom]);

  // ===== KEYBOARD SHORTCUTS =====

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case 'Enter':
            event.preventDefault();
            if (!isCreating) {
              handleCreateRoom();
            }
            break;
          case 'Escape':
            event.preventDefault();
            handleBack();
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleCreateRoom, handleBack, isCreating]);

  // ===== ПОЛУЧЕНИЕ ПРЕДУПРЕЖДЕНИЙ =====

  const compatibilityWarnings = getCompatibilityWarnings();

  // ===== РЕНДЕР =====

  return (
    <Container 
      className={`${CSS_CLASSES.SETTINGS_PAGE} adaptive-container with-safe-area`}
      role="main" 
      aria-label="Настройки игры"
    >
      <Row className="justify-content-center">
        <Col lg={8}>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <Button
              variant="outline-secondary"
              onClick={handleBack}
              aria-label="Вернуться на главную страницу"
            >
              {UI_TEXT.BACK_BUTTON}
            </Button>
            <h2 className="mb-0">{UI_TEXT.PAGE_TITLE}</h2>
            <div style={{ width: '80px' }}></div> {/* Spacer для центрирования заголовка */}
          </div>

          <Form 
            className={CSS_CLASSES.SETTINGS_FORM}
            onSubmit={(e) => { e.preventDefault(); handleCreateRoom(); }}
            aria-label="Форма создания игровой комнаты"
          >
            {/* Ошибки валидации */}
            {validationError && (
              <Alert variant="danger" className="mb-4">
                {validationError}
              </Alert>
            )}

            {/* Предупреждения о совместимости */}
            {compatibilityWarnings.length > 0 && (
              <Alert variant="warning" className="mb-4">
                <strong>Предупреждения:</strong>
                <ul className="mb-0 mt-2">
                  {compatibilityWarnings.map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              </Alert>
            )}

            {/* Название комнаты */}
            <RoomNameSection
              roomName={roomName}
              onNameChange={setRoomName}
              isCreating={isCreating}
              validationError={validationError}
            />

            {/* Режим игры */}
            <GameModeSection
              gameMode={gameMode}
              onGameModeChange={setGameMode}
              isCreating={isCreating}
            />

            {/* Режим подкидывания */}
            <ThrowingModeSection
              throwingMode={throwingMode}
              onThrowingModeChange={setThrowingMode}
              isCreating={isCreating}
            />

            {/* Параметры игры */}
            <GameParametersSection
              cardCount={cardCount}
              maxPlayers={maxPlayers}
              onCardCountChange={setCardCount}
              onMaxPlayersChange={setMaxPlayers}
              isCreating={isCreating}
            />

            {/* Кнопка создания */}
            <div className="text-center">
              <Button
                type="submit"
                variant="success"
                size="lg"
                disabled={isCreating || !isConnected}
                className="px-5"
                aria-label="Создать игровую комнату с выбранными настройками"
              >
                {isCreating ? (
                  <>
                    <Spinner size="sm" className="me-2" />
                    {UI_TEXT.CREATING_ROOM}
                  </>
                ) : (
                  UI_TEXT.CREATE_ROOM_BUTTON
                )}
              </Button>
            </div>
          </Form>
        </Col>
      </Row>
    </Container>
  );
};

// Установка displayName для лучшей отладки
GameSettingsPage.displayName = 'GameSettingsPage';

// ===== ЭКСПОРТ =====
export default GameSettingsPage;
export type { GameSettingsPageProps };
export { UI_TEXT, VALIDATION_RULES, GAME_MODE_DESCRIPTIONS, THROWING_MODE_DESCRIPTIONS };
