// src/pages/RoomListPage.tsx - ФРОНТЕНД - ИСПРАВЛЕНО
import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Button, Badge, Form, InputGroup, Alert, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameProvider';
import { RoomInfo } from '../../shared/types';

const RoomListPage: React.FC = () => {
  const navigate = useNavigate();
  const { rooms, joinRoom, isConnected, error, sendMessage } = useGame();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isJoining, setIsJoining] = useState<string | null>(null);
  const [filteredRooms, setFilteredRooms] = useState<RoomInfo[]>([]);

  // Обновление списка комнат
  useEffect(() => {
    if (isConnected) {
      sendMessage({ type: 'get_rooms' });
    }
  }, [isConnected, sendMessage]);

  // Фильтрация комнат по поисковому запросу
  useEffect(() => {
    const filtered = rooms.filter(room =>
      room.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredRooms(filtered);
  }, [rooms, searchTerm]);

  const handleJoinRoom = async (roomId: string) => {
    setIsJoining(roomId);
    try {
      joinRoom(roomId);
      // Переход к комнате произойдет автоматически при получении ответа от сервера
      setTimeout(() => {
        navigate(`/room/${roomId}`);
        setIsJoining(null);
      }, 1000);
    } catch (err) {
      console.error('Error joining room:', err);
      setIsJoining(null);
    }
  };

  const handleCreateRoom = () => {
    navigate('/settings');
  };

  const handleBack = () => {
    navigate('/');
  };

  const getStatusBadge = (room: RoomInfo) => {
    switch (room.status) {
      case 'waiting':
        return <Badge bg="success">Ожидание</Badge>;
      case 'playing':
        return <Badge bg="warning">В игре</Badge>;
      case 'finished':
        return <Badge bg="secondary">Завершена</Badge>;
      default:
        return <Badge bg="light">Неизвестно</Badge>;
    }
  };

  const getGameModeText = (gameMode: string) => {
    switch (gameMode) {
      case 'classic': return 'Классический';
      case 'transferable': return 'Переводной';
      case 'smart': return 'Умный';
      default: return gameMode;
    }
  };

  const getThrowingModeText = (throwingMode: string) => {
    switch (throwingMode) {
      case 'none': return 'Без подкидывания';
      case 'neighbors': return 'Соседи';
      case 'all': return 'Все';
      default: return throwingMode;
    }
  };

  const canJoinRoom = (room: RoomInfo) => {
    return room.status === 'waiting' && room.players.length < room.maxPlayers;
  };

  return (
    <Container className="py-4">
      <Row className="justify-content-center">
        <Col xs={12} lg={8}>
          {/* Заголовок */}
          <div className="d-flex align-items-center justify-content-between mb-4">
            <div className="d-flex align-items-center">
              <Button variant="outline-secondary" onClick={handleBack} className="me-3">
                ← Назад
              </Button>
              <h2 className="mb-0">Список комнат</h2>
            </div>
            <Button variant="success" onClick={handleCreateRoom}>
              + Создать
            </Button>
          </div>

          {/* Ошибки */}
          {error && (
            <Alert variant="danger" className="mb-4">
              {error}
            </Alert>
          )}

          {/* Поиск */}
          <Card className="mb-4">
            <Card.Body>
              <InputGroup>
                <InputGroup.Text>🔍</InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Поиск по названию комнаты..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </Card.Body>
          </Card>

          {/* Индикатор загрузки */}
          {!isConnected && (
            <Card className="text-center py-4">
              <Card.Body>
                <Spinner animation="border" className="mb-3" />
                <p className="text-muted mb-0">Загрузка списка комнат...</p>
              </Card.Body>
            </Card>
          )}

          {/* Список комнат */}
          {isConnected && (
            <>
              {filteredRooms.length === 0 ? (
                <Card className="text-center py-4">
                  <Card.Body>
                    <div className="text-muted mb-3" style={{ fontSize: '3rem' }}>
                      🏠
                    </div>
                    <h5 className="text-muted">
                      {searchTerm ? 'Комнаты не найдены' : 'Нет доступных комнат'}
                    </h5>
                    <p className="text-muted">
                      {searchTerm 
                        ? 'Попробуйте изменить поисковый запрос'
                        : 'Создайте новую комнату или подождите, пока другие игроки создадут комнаты'
                      }
                    </p>
                    {!searchTerm && (
                      <Button variant="primary" onClick={handleCreateRoom}>
                        Создать первую комнату
                      </Button>
                    )}
                  </Card.Body>
                </Card>
              ) : (
                <div className="d-flex flex-column gap-3">
                  {filteredRooms.map((room) => (
                    <Card key={room.id} className="border-start border-4 border-primary">
                      <Card.Body>
                        <div className="d-flex justify-content-between align-items-start mb-3">
                          <div className="flex-grow-1">
                            <div className="d-flex align-items-center gap-2 mb-2">
                              <h5 className="mb-0">{room.name}</h5>
                              {getStatusBadge(room)}
                            </div>
                            
                            <div className="text-muted small">
                              <div className="mb-1">
                                👥 Игроки: {room.players.length}/{room.maxPlayers}
                              </div>
                              <div className="mb-1">
                                🎮 {getGameModeText(room.rules.gameMode)}
                              </div>
                              <div className="mb-1">
                                🃏 {room.rules.cardCount} карт, {getThrowingModeText(room.rules.throwingMode)}
                              </div>
                              <div>
                                🕐 Создана {new Date(room.createdAt).toLocaleTimeString()}
                              </div>
                            </div>
                          </div>

                          <div className="ms-3">
                            <Button
                              variant={canJoinRoom(room) ? 'primary' : 'secondary'}
                              disabled={!canJoinRoom(room) || isJoining === room.id}
                              onClick={() => handleJoinRoom(room.id)}
                            >
                              {isJoining === room.id ? (
                                <>
                                  <Spinner animation="border" size="sm" className="me-1" />
                                  Подключение...
                                </>
                              ) : canJoinRoom(room) ? (
                                'Присоединиться'
                              ) : room.status === 'playing' ? (
                                'В игре'
                              ) : (
                                'Полная'
                              )}
                            </Button>
                          </div>
                        </div>

                        {/* Список игроков */}
                        {room.players.length > 0 && (
                          <div>
                            <small className="text-muted">Игроки:</small>
                            <div className="d-flex flex-wrap gap-1 mt-1">
                              {room.players.map((player, index) => (
                                <Badge 
                                  key={player.id} 
                                  bg={player.isReady ? 'success' : 'secondary'}
                                  className="small"
                                >
                                  {player.name}
                                  {player.isReady && ' ✓'}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </Card.Body>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Статистика */}
          {isConnected && rooms.length > 0 && (
            <Card className="mt-4 bg-light">
              <Card.Body className="text-center">
                <small className="text-muted">
                  Всего комнат: {rooms.length} | 
                  Ожидают игроков: {rooms.filter(r => r.status === 'waiting').length} | 
                  В игре: {rooms.filter(r => r.status === 'playing').length}
                </small>
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default RoomListPage;
