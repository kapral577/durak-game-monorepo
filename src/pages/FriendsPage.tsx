import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, InputGroup, Badge } from 'react-bootstrap';
import { useGame } from '../context/GameProvider';

const FriendsPage: React.FC = () => {
  const { telegramUser, sendMessage, isConnected } = useGame();
  const [inviteLink, setInviteLink] = useState('');

  useEffect(() => {
    // Генерируем ссылку-приглашение
    const botUsername = 'YourBotUsername'; // замените на ваш бот
    const startParam = `invite_${telegramUser?.id || 'unknown'}`;
    setInviteLink(`https://t.me/${botUsername}?start=${startParam}`);
  }, [telegramUser]);

  const handleInviteFriends = () => {
    if (window.Telegram?.WebApp) {
      // Используем Telegram WebApp API для отправки приглашения
      const shareText = `🃏 Присоединяйся к игре в Дурак!\n\n👤 ${telegramUser?.first_name} приглашает тебя сыграть`;
      
      const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=${encodeURIComponent(shareText)}`;
      window.open(shareUrl, '_blank');
    }
  };

  const handleCreatePrivateRoom = () => {
    // Создаем приватную комнату только для друзей
    sendMessage({
      type: 'create_private_room',
      name: `Комната ${telegramUser?.first_name}`,
      isPrivate: true,
      inviteOnly: true
    });
  };

  return (
    <Container className="py-4">
      <Row className="justify-content-center">
        <Col xs={12} md={8} lg={6}>
          <h2 className="mb-4">👥 Друзья</h2>

          {/* Пригласить друзей */}
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">Пригласить друзей</h5>
            </Card.Header>
            <Card.Body>
              <p className="text-muted">
                Поделитесь ссылкой с друзьями, чтобы они присоединились к игре
              </p>
              
              <InputGroup className="mb-3">
                <Form.Control
                  type="text"
                  value={inviteLink}
                  readOnly
                  className="bg-light"
                />
                <Button 
                  variant="outline-primary"
                  onClick={() => navigator.clipboard.writeText(inviteLink)}
                >
                  Копировать
                </Button>
              </InputGroup>

              <div className="d-grid">
                <Button 
                  variant="primary" 
                  onClick={handleInviteFriends}
                  disabled={!isConnected}
                >
                  📤 Пригласить через Telegram
                </Button>
              </div>
            </Card.Body>
          </Card>

          {/* Приватная комната */}
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">Приватная игра</h5>
            </Card.Header>
            <Card.Body>
              <p className="text-muted">
                Создайте приватную комнату только для ваших друзей
              </p>
              <div className="d-grid">
                <Button 
                  variant="success" 
                  onClick={handleCreatePrivateRoom}
                  disabled={!isConnected}
                >
                  🔒 Создать приватную комнату
                </Button>
              </div>
            </Card.Body>
          </Card>

          {/* Информация о пользователе */}
          {telegramUser && (
            <Card className="bg-light">
              <Card.Body>
                <div className="d-flex align-items-center">
                  {telegramUser.photo_url && (
                    <img 
                      src={telegramUser.photo_url} 
                      alt="Avatar" 
                      className="rounded-circle me-3"
                      width={50}
                      height={50}
                    />
                  )}
                  <div>
                    <h6 className="mb-1">{telegramUser.first_name} {telegramUser.last_name}</h6>
                    {telegramUser.username && (
                      <small className="text-muted">@{telegramUser.username}</small>
                    )}
                  </div>
                </div>
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default FriendsPage;