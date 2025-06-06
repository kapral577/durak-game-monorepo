// src/pages/FriendsPage.tsx - СТРАНИЦА ПРИГЛАШЕНИЯ ДРУЗЕЙ

import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Alert, Form } from 'react-bootstrap';
import { useGame } from '../context/GameProvider';

// ===== ИНТЕРФЕЙСЫ =====

/**
 * Props для FriendsPage
 */
export interface FriendsPageProps {
  // Если нужны props в будущем
}

/**
 * Интерфейс пользователя Telegram
 */
interface TelegramUser {
  id: number;
  name: string;
  isConnected: boolean;
  username?: string;
  photo_url?: string;
}

// ===== КОНСТАНТЫ =====

const UI_TEXT = {
  PAGE_TITLE: 'Пригласить друзей',
  BACK_BUTTON: '← Назад',
  INVITE_TITLE: 'Пригласить друзей в игру',
  INVITE_DESCRIPTION: 'Поделитесь ссылкой с друзьями, чтобы они могли присоединиться к игре',
  COPY_BUTTON: 'Копировать ссылку',
  INVITE_BUTTON: 'Пригласить через Telegram',
  PRIVATE_ROOM_TITLE: 'Создать приватную комнату',
  PRIVATE_ROOM_DESCRIPTION: 'Создайте приватную комнату для игры с друзьями',
  CREATE_PRIVATE_ROOM: 'Создать приватную комнату',
  SHARE_TEXT: 'Присоединяйся к игре в Дурак!',
  LINK_COPIED: 'Ссылка скопирована в буфер обмена!',
  LINK_GENERATION_ERROR: 'Ошибка генерации ссылки',
  BOT_CONFIG_ERROR: 'Ошибка конфигурации бота',
  USER_DATA_ERROR: 'Ошибка получения данных пользователя',
  CREATING_ROOM: 'Создание комнаты...'
} as const;

const CSS_CLASSES = {
  FRIENDS_PAGE: 'friends-page',
  INVITE_SECTION: 'invite-section',
  PRIVATE_ROOM_SECTION: 'private-room-section',
  PROFILE_SECTION: 'profile-section'
} as const;

const ROOM_DEFAULTS = {
  gameMode: 'classic' as const,
  throwingMode: 'standard' as const,
  cardCount: 36 as const,
  maxPlayers: 4 as const
};

// ===== УТИЛИТАРНЫЕ ФУНКЦИИ =====

/**
 * Валидация bot username
 */
const validateBotUsername = (username: string): boolean => {
  return /^[a-zA-Z][a-zA-Z0-9_]{4,31}bot$/i.test(username);
};

/**
 * Генерация безопасной invite ссылки
 */
const generateInviteLink = (telegramUser: TelegramUser | null): string | null => {
  try {
    const botUsername = import.meta.env.VITE_BOT_USERNAME;
    
    if (!botUsername) {
      console.error('VITE_BOT_USERNAME not configured');
      return null;
    }
    
    if (!validateBotUsername(botUsername)) {
      console.error('Invalid bot username format');
      return null;
    }
    
    if (!telegramUser?.id) {
      console.error('User ID not available');
      return null;
    }
    
    const startParam = `invite_${telegramUser.id}`;
    return `https://t.me/${botUsername}?start=${startParam}`;
  } catch (error) {
    console.error('Error generating invite link:', error);
    return null;
  }
};

/**
 * Копирование в буфер обмена с fallback
 */
const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback для старых браузеров
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'absolute';
      textArea.style.left = '-999999px';
      
      document.body.prepend(textArea);
      textArea.select();
      
      try {
        document.execCommand('copy');
        return true;
      } catch (error) {
        console.error('Fallback copy failed:', error);
        return false;
      } finally {
        textArea.remove();
      }
    }
  } catch (error) {
    console.error('Copy to clipboard failed:', error);
    return false;
  }
};

// ===== КОМПОНЕНТЫ =====

/**
 * Секция профиля пользователя
 */
const ProfileSection: React.FC<{
  telegramUser: TelegramUser | null;
}> = React.memo(({ telegramUser }) => {
  if (!telegramUser) return null;

  return (
    <Card className={`${CSS_CLASSES.PROFILE_SECTION} mb-4`}>
      <Card.Body className="text-center">
        <div className="d-flex align-items-center justify-content-center mb-3">
          {telegramUser.photo_url ? (
            <img
              src={telegramUser.photo_url}
              alt={`Аватар ${telegramUser.name}`}
              className="rounded-circle me-3"
              style={{ width: '50px', height: '50px' }}
            />
          ) : (
            <div 
              className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center me-3"
              style={{ width: '50px', height: '50px' }}
            >
              {telegramUser.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h5 className="mb-0">{telegramUser.name}</h5>
            {telegramUser.username && (
              <small className="text-muted">@{telegramUser.username}</small>
            )}
          </div>
        </div>
      </Card.Body>
    </Card>
  );
});

ProfileSection.displayName = 'ProfileSection';

/**
 * Секция приглашения
 */
const InviteSection: React.FC<{
  inviteLink: string | null;
  onCopy: () => void;
  onInvite: () => void;
}> = React.memo(({ inviteLink, onCopy, onInvite }) => (
  <Card className={`${CSS_CLASSES.INVITE_SECTION} mb-4`}>
    <Card.Body>
      <h5>{UI_TEXT.INVITE_TITLE}</h5>
      <p className="text-muted">{UI_TEXT.INVITE_DESCRIPTION}</p>
      
      {inviteLink && (
        <Form.Group className="mb-3">
          <Form.Control
            type="text"
            value={inviteLink}
            readOnly
            onClick={(e) => (e.target as HTMLInputElement).select()}
            aria-label="Ссылка для приглашения друзей"
          />
        </Form.Group>
      )}
      
      <div className="d-grid gap-2 d-md-flex">
        <Button
          variant="outline-primary"
          onClick={onCopy}
          disabled={!inviteLink}
          aria-label="Копировать ссылку приглашения"
          className="me-md-2"
        >
          {UI_TEXT.COPY_BUTTON}
        </Button>
        
        <Button
          variant="primary"
          onClick={onInvite}
          disabled={!inviteLink}
          aria-label="Пригласить друзей через Telegram"
        >
          {UI_TEXT.INVITE_BUTTON}
        </Button>
      </div>
    </Card.Body>
  </Card>
));

InviteSection.displayName = 'InviteSection';

/**
 * Секция приватной комнаты
 */
const PrivateRoomSection: React.FC<{
  isLoading: boolean;
  onCreate: () => void;
}> = React.memo(({ isLoading, onCreate }) => (
  <Card className={CSS_CLASSES.PRIVATE_ROOM_SECTION}>
    <Card.Body>
      <h5>{UI_TEXT.PRIVATE_ROOM_TITLE}</h5>
      <p className="text-muted">{UI_TEXT.PRIVATE_ROOM_DESCRIPTION}</p>
      
      <Button
        variant="success"
        onClick={onCreate}
        disabled={isLoading}
        aria-label="Создать приватную комнату для друзей"
        className="w-100"
      >
        {isLoading ? UI_TEXT.CREATING_ROOM : UI_TEXT.CREATE_PRIVATE_ROOM}
      </Button>
    </Card.Body>
  </Card>
));

PrivateRoomSection.displayName = 'PrivateRoomSection';

// ===== ОСНОВНОЙ КОМПОНЕНТ =====

/**
 * Страница приглашения друзей
 */
export const FriendsPage: React.FC<FriendsPageProps> = () => {
  // Состояния
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Хуки
  const navigate = useNavigate();
  const { telegramUser, createRoom } = useGame();

  // ===== УТИЛИТАРНАЯ ФУНКЦИЯ ДЛЯ УВЕДОМЛЕНИЙ =====

  const showNotification = useCallback((message: string, duration = 3000) => {
    setNotification(message);
    setTimeout(() => setNotification(null), duration);
  }, []);

  // ===== ГЕНЕРАЦИЯ ССЫЛКИ ПРИ МОНТИРОВАНИИ =====

  useEffect(() => {
    const link = generateInviteLink(telegramUser);
    if (link) {
      setInviteLink(link);
    } else {
      showNotification(UI_TEXT.LINK_GENERATION_ERROR);
    }
  }, [telegramUser, showNotification]);

  // ===== ОБРАБОТЧИКИ СОБЫТИЙ =====

  /**
   * Обработчик возврата назад
   */
  const handleBack = useCallback(() => {
    navigate('/');
  }, [navigate]);

  /**
   * Обработчик копирования ссылки
   */
  const handleCopyLink = useCallback(async () => {
    if (!inviteLink) {
      showNotification(UI_TEXT.LINK_GENERATION_ERROR);
      return;
    }

    const success = await copyToClipboard(inviteLink);
    if (success) {
      showNotification(UI_TEXT.LINK_COPIED);
    } else {
      showNotification('Не удалось скопировать ссылку');
    }
  }, [inviteLink, showNotification]);

  /**
   * Обработчик приглашения через Telegram
   */
  const handleInviteFriends = useCallback(() => {
    if (!inviteLink || !telegramUser) {
      showNotification('Данные для приглашения недоступны');
      return;
    }

    try {
      // Проверка доступности Telegram WebApp
      if (window.Telegram?.WebApp?.isVersionAtLeast?.('6.0')) {
        const shareText = `${UI_TEXT.SHARE_TEXT}\n\n👤 ${telegramUser.name} приглашает тебя сыграть`;
        const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=${encodeURIComponent(shareText)}`;
        
        window.Telegram.WebApp.openTelegramLink(shareUrl);
      } else {
        // Fallback для старых версий или веб-браузера
        handleCopyLink();
        showNotification('Ссылка скопирована. Поделитесь ей с друзьями!');
      }
    } catch (error) {
      console.error('Error sharing invite:', error);
      showNotification('Ошибка при отправке приглашения');
    }
  }, [inviteLink, telegramUser, handleCopyLink, showNotification]);

  /**
   * Обработчик создания приватной комнаты
   */
  const handleCreatePrivateRoom = useCallback(async () => {
    if (!telegramUser) {
      showNotification(UI_TEXT.USER_DATA_ERROR);
      return;
    }

    setIsLoading(true);
    try {
      const roomName = `Комната ${telegramUser.name}`;
      await createRoom(roomName, ROOM_DEFAULTS, true);
      
      // Навигация произойдет автоматически через GameProvider
    } catch (error) {
      console.error('Error creating private room:', error);
      showNotification('Ошибка создания комнаты');
    } finally {
      setIsLoading(false);
    }
  }, [telegramUser, createRoom, showNotification]);

  // ===== KEYBOARD SHORTCUTS =====

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case 'c':
            event.preventDefault();
            handleCopyLink();
            break;
          case 'i':
            event.preventDefault();
            handleInviteFriends();
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
  }, [handleCopyLink, handleInviteFriends, handleBack]);

  // ===== РЕНДЕР =====

  return (
    <Container 
      className={CSS_CLASSES.FRIENDS_PAGE}
      role="main"
      aria-label="Страница приглашения друзей"
    >
      <Row className="justify-content-center">
        <Col lg={8}>
          {/* Заголовок и навигация */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <Button
              variant="outline-secondary"
              onClick={handleBack}
              aria-label="Вернуться на главную страницу"
            >
              {UI_TEXT.BACK_BUTTON}
            </Button>
            <h2 className="mb-0">{UI_TEXT.PAGE_TITLE}</h2>
            <div style={{ width: '80px' }}></div> {/* Spacer */}
          </div>

          {/* Уведомления */}
          {notification && (
            <Alert 
              variant="success" 
              dismissible 
              onClose={() => setNotification(null)}
              role="alert"
              aria-live="polite"
            >
              {notification}
            </Alert>
          )}

          {/* Профиль пользователя */}
          <ProfileSection telegramUser={telegramUser} />

          {/* Секция приглашения */}
          <InviteSection
            inviteLink={inviteLink}
            onCopy={handleCopyLink}
            onInvite={handleInviteFriends}
          />

          {/* Секция приватной комнаты */}
          <PrivateRoomSection
            isLoading={isLoading}
            onCreate={handleCreatePrivateRoom}
          />

          {/* Подсказки для клавиш */}
          {process.env.NODE_ENV === 'development' && (
            <Alert variant="info" className="mt-4">
              <small>
                <strong>Клавиши:</strong> Ctrl+C - Копировать, Ctrl+I - Пригласить, Escape - Назад
              </small>
            </Alert>
          )}
        </Col>
      </Row>
    </Container>
  );
};

// Установка displayName для лучшей отладки
FriendsPage.displayName = 'FriendsPage';

// ===== ЭКСПОРТ =====
export default FriendsPage;
export type { FriendsPageProps, TelegramUser };
export { UI_TEXT, CSS_CLASSES, validateBotUsername, generateInviteLink, copyToClipboard };
