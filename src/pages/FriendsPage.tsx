// src/pages/FriendsPage.tsx - ПОЛНОСТЬЮ РЕФАКТОРИРОВАННАЯ ВЕРСИЯ

import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Button, Form, InputGroup, Badge, Alert } from 'react-bootstrap';
import { useGame } from '../context/GameProvider';

// ===== КОНСТАНТЫ =====
const UI_TEXT = {
  PAGE_TITLE: '👥 Друзья',
  INVITE_TITLE: 'Пригласить друзей',
  INVITE_DESCRIPTION: 'Поделитесь ссылкой с друзьями, чтобы они присоединились к игре',
  PRIVATE_ROOM_TITLE: 'Приватная игра',
  PRIVATE_ROOM_DESCRIPTION: 'Создайте приватную комнату только для ваших друзей',
  COPY_BUTTON: 'Копировать',
  INVITE_BUTTON: '📤 Пригласить через Telegram',
  CREATE_ROOM_BUTTON: '🔒 Создать приватную комнату',
  PROFILE_TITLE: 'Ваш профиль',
  LINK_COPIED: 'Ссылка скопирована!',
  COPY_ERROR: 'Не удалось скопировать ссылку',
  SHARE_TEXT: '🃏 Присоединяйся к игре в Дурак!',
} as const;

const FriendsPage: React.FC = () => {
  const { telegramUser, sendMessage, isConnected } = useGame();
  
  const [inviteLink, setInviteLink] = useState('');
  const [notification, setNotification] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Генерация invite ссылки
  useEffect(() => {
    const generateInviteLink = () => {
      try {
        // Получаем bot username из переменных окружения
        const botUsername = import.meta.env.VITE_BOT_USERNAME;
        
        if (!botUsername) {
          console.error('VITE_BOT_USERNAME not configured');
          return;
        }

        const startParam = `invite_${telegramUser?.id || 'unknown'}`;
        const link = `https://t.me/${botUsername}?start=${startParam}`;
        
        setInviteLink(link);
      } catch (error) {
        console.error('Error generating invite link:', error);
      }
    };

    if (telegramUser) {
      generateInviteLink();
    }
  }, [telegramUser]);

  // Копирование ссылки в буфер обмена
  const handleCopyLink = useCallback(async () => {
    if (!inviteLink) return;

    try {
      // Проверяем поддержку clipboard API
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(inviteLink);
        setNotification(UI_TEXT.LINK_COPIED);
      } else {
        // Fallback для старых браузеров
        const textArea = document.createElement('textarea');
        textArea.value = inviteLink;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        setNotification(UI_TEXT.LINK_COPIED);
      }
    } catch (error) {
      console.error('Failed to copy link:', error);
      setNotification(UI_TEXT.COPY_ERROR);
    }

    // Автоматически скрыть уведомление
    setTimeout(() => setNotification(null), 3000);
  }, [inviteLink]);

  // Приглашение через Telegram
  const handleInviteFriends = useCallback(() => {
    if (!inviteLink || !telegramUser) return;

    try {
      if (window.Telegram?.WebApp) {
        const shareText = `${UI_TEXT.SHARE_TEXT}\n\n👤 ${telegramUser.name} приглашает тебя сыграть`;
        const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=${encodeURIComponent(shareText)}`;
        
        window.open(shareUrl, '_blank');
      } else {
        // Fallback - копируем ссылку
        handleCopyLink();
      }
    } catch (error) {
      console.error('Error sharing invite:', error);
      setNotification('Ошибка при отправке приглашения');
      setTimeout(() => setNotification(null), 3000);
    }
  }, [inviteLink, telegramUser, handleCopyLink]);

  // Создание приватной комнаты
  const handleCreatePrivateRoom = useCallback(async () => {
    if (!isConnected || !telegramUser) return;

    setIsLoading(true);
    
    try {
      sendMessage({
        type: 'create_room',
        name: `Комната ${telegramUser.name}`,
        isPrivate: true,
        inviteOnly: true,
        maxPlayers: 4,
        rules: {
          gameMode: 'classic',
          throwingMode: 'standard',
          cardCount: 36,
        }
      });
    } catch (error) {
      console.error('Error creating private room:', error);
      setNotification('Ошибка создания комнаты');
      setTimeout(() => setNotification(null), 3000);
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, telegramUser, sendMessage]);

  return (
    <Container className="py-4">
      <h2 className="text-center mb-4">{UI_TEXT.PAGE_TITLE}</h2>

      {/* Уведомления */}
      {notification && (
        <Alert 
          variant={notification.includes('Ошибка') ? 'danger' : 'success'} 
          className="mb-3"
          dismissible
          onClose={() => setNotification(null)}
        >
          {notification}
        </Alert>
      )}

      <Row className="g-4">
        {/* Пригласить друзей */}
        <Col md={6}>
          <Card className="h-100">
            <Card.Body>
              <Card.Title>{UI_TEXT.INVITE_TITLE}</Card.Title>
              <Card.Text className="text-muted">
                {UI_TEXT.INVITE_DESCRIPTION}
              </Card.Text>
              
              <InputGroup className="mb-3">
                <Form.Control
                  type="text"
                  value={inviteLink}
                  readOnly
                  placeholder="Генерация ссылки..."
                />
                <Button 
                  variant="outline-secondary" 
                  onClick={handleCopyLink}
                  disabled={!inviteLink}
                >
                  {UI_TEXT.COPY_BUTTON}
                </Button>
              </InputGroup>
              
              <Button 
                variant="primary" 
                className="w-100"
                onClick={handleInviteFriends}
                disabled={!inviteLink || !isConnected}
              >
                {UI_TEXT.INVITE_BUTTON}
              </Button>
            </Card.Body>
          </Card>
        </Col>

        {/* Приватная комната */}
        <Col md={6}>
          <Card className="h-100">
            <Card.Body>
              <Card.Title>{UI_TEXT.PRIVATE_ROOM_TITLE}</Card.Title>
              <Card.Text className="text-muted">
                {UI_TEXT.PRIVATE_ROOM_DESCRIPTION}
              </Card.Text>
              
              <Button 
                variant="success" 
                className="w-100"
                onClick={handleCreatePrivateRoom}
                disabled={!isConnected || isLoading}
              >
                {isLoading ? 'Создание...' : UI_TEXT.CREATE_ROOM_BUTTON}
              </Button>
            </Card.Body>
          </Card>
        </Col>

        {/* Информация о пользователе */}
        {telegramUser && (
          <Col md={12}>
            <Card>
              <Card.Body>
                <Card.Title>{UI_TEXT.PROFILE_TITLE}</Card.Title>
                <div className="d-flex align-items-center">
                  <div className="me-3">
                    <div 
                      className="rounded-circle bg-primary d-flex align-items-center justify-content-center"
                      style={{ width: '60px', height: '60px' }}
                    >
                      <span className="text-white fw-bold fs-4">
                        {telegramUser.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div>
                    <h5 className="mb-1">{telegramUser.name}</h5>
                    <Badge bg={telegramUser.isConnected ? 'success' : 'secondary'}>
                      {telegramUser.isConnected ? 'Онлайн' : 'Офлайн'}
                    </Badge>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        )}
      </Row>
    </Container>
  );
};

export default FriendsPage;
