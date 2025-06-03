// src/pages/RoomListPage.tsx - РЕФАКТОРИРОВАННАЯ ВЕРСИЯ

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Container, Row, Col, Card, Button, Badge, Form, InputGroup, Alert, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameProvider';
import { Room } from '../shared/types';

// ===== КОНСТАНТЫ =====
const UI_TEXT = {
  PAGE_TITLE: 'Список комнат',
  BACK_BUTTON: '← Назад',
  CREATE_BUTTON: '+ Создать',
  SEARCH_PLACEHOLDER: 'Поиск комнат...',
  LOADING_TEXT: 'Загрузка списка комнат...',
  NO_ROOMS_FOUND: 'Комнаты не найдены',
  NO_ROOMS_AVAILABLE: 'Нет доступных комнат',
  SEARCH_HINT: 'Попробуйте изменить поисковый запрос',
  CREATE_HINT: 'Создайте новую комнату или подождите, пока другие игроки создадут комнаты',
  CREATE_FIRST_ROOM: 'Создать первую комнату',
  JOIN_BUTTON: 'Присоединиться',
  JOINING_TEXT: 'Подключение...',
  IN_GAME_TEXT: 'В игре',
  ROOM_FULL_TEXT: 'Полная',
  PLAYERS_LABEL: 'Игроки:',
  STATISTICS_TOTAL: 'Всего комнат:',
  STATISTICS_WAITING: 'Ожидают игроков:',
  STATISTICS_PLAYING: 'В игре:',
} as const;

const STATUS_BADGES = {
  waiting: { text: 'Ожидание', variant: 'primary' },
  playing: { text: 'В игре', variant: 'success' },
  finished: { text: 'Завершена', variant: 'secondary' },
} as const;

const GAME_MODE_TEXTS = {
  classic: 'Классический',
  transferable: 'Переводной',
  smart: 'Умный',
} as const;

const THROWING_MODE_TEXTS = {
  none: 'Без подкидывания',
  neighbors: 'Соседи',
  all: 'Все',
} as const;

const RoomListPage: React.FC = () => {
  const navigate = useNavigate();
  const { rooms, joinRoom, isConnected, error, sendMessage } = useGame();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isJoining, setIsJoining] = useState<string | null>(null);

  // Обновление списка комнат при подключении
  useEffect(() => {
    if (isConnected) {
      sendMessage({ type: 'get_rooms' });
    }
  }, [isConnected, sendMessage]);

  // Мемоизированная фильтрация комнат
  const filteredRooms = useMemo(() => {
    if (!rooms || !Array.isArray(rooms)) return [];
    
    return rooms.filter(room =>
      room?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [rooms, searchTerm]);

  // Мемоизированная статистика
  const roomStats = useMemo(() => {
    if (!rooms || !Array.isArray(rooms)) return { total: 0, waiting: 0, playing: 0 };
    
    return {
      total: rooms.length,
      waiting: rooms.filter(r => r?.status === 'waiting').length,
      playing: rooms.filter(r => r?.status === 'playing').length,
    };
  }, [rooms]);

  // Обработчики событий
  const handleJoinRoom = useCallback(async (roomId: string) => {
    if (!roomId || isJoining) return;
    
    setIsJoining(roomId);
    
    try {
      joinRoom(roomId);
      // Навигация через контекст вместо setTimeout
      navigate(`/room/${roomId}`);
    } catch (err) {
      console.error('Error joining room:', err);
    } finally {
      setIsJoining(null);
    }
  }, [joinRoom, navigate, isJoining]);

  const handleCreateRoom = useCallback(() => {
    navigate('/settings');
  }, [navigate]);

  const handleBack = useCallback(() => {
    navigate('/');
  }, [navigate]);

  // Утилиты для отображения
  const getStatusBadge = useCallback((room: Room) => {
    const status = STATUS_BADGES[room.status as keyof typeof STATUS_BADGES] || 
                  { text: 'Неизвестно', variant: 'secondary' };
    
    return (
      <Badge bg={status.variant as any}>
        {status.text}
      </Badge>
    );
  }, []);

  const getGameModeText = useCallback((gameMode: string) => {
    return GAME_MODE_TEXTS[gameMode as keyof typeof GAME_MODE_TEXTS] || gameMode;
  }, []);

  const getThrowingModeText = useCallback((throwingMode: string) => {
    return THROWING_MODE_TEXTS[throwingMode as keyof typeof THROWING_MODE_TEXTS] || throwingMode;
  }, []);

  const canJoinRoom = useCallback((room: Room) => {
    return room?.status === 'waiting' && 
           room?.players?.length < (room?.maxPlayers || 0);
  }, []);

  return (
    <Container className="py-4">
      {/* Заголовок */}
      <Row className="align-items-center mb-4">
        <Col xs="auto">
          <Button variant="link" onClick={handleBack} className="p-0">
            {UI_TEXT.BACK_BUTTON}
          </Button>
        </Col>
        <Col>
          <h2 className="text-center mb-0">{UI_TEXT.PAGE_TITLE}</h2>
        </Col>
        <Col xs="auto">
          <Button variant="primary" onClick={handleCreateRoom}>
            {UI_TEXT.CREATE_BUTTON}
          </Button>
        </Col>
      </Row>

      {/* Ошибки */}
      {error && (
        <Alert variant="danger" className="mb-3">
          {error}
        </Alert>
      )}

      {/* Поиск */}
      <Row className="mb-4">
        <Col>
          <InputGroup>
            <Form.Control
              type="text"
              placeholder={UI_TEXT.SEARCH_PLACEHOLDER}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </InputGroup>
        </Col>
      </Row>

      {/* Индикатор загрузки */}
      {!isConnected && (
        <div className="text-center py-5">
          <Spinner animation="border" className="me-2" />
          {UI_TEXT.LOADING_TEXT}
        </div>
      )}

      {/* Список комнат */}
      {isConnected && (
        <>
          {filteredRooms.length === 0 ? (
            <Card className="text-center py-5">
              <Card.Body>
                <h5>{searchTerm ? UI_TEXT.NO_ROOMS_FOUND : UI_TEXT.NO_ROOMS_AVAILABLE}</h5>
                <p className="text-muted">
                  {searchTerm ? UI_TEXT.SEARCH_HINT : UI_TEXT.CREATE_HINT}
                </p>
                {!searchTerm && (
                  <Button variant="primary" onClick={handleCreateRoom}>
                    {UI_TEXT.CREATE_FIRST_ROOM}
                  </Button>
                )}
              </Card.Body>
            </Card>
          ) : (
            <Row className="g-3">
              {filteredRooms.map((room) => (
                <Col md={6} lg={4} key={room.id}>
                  <Card className="h-100">
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <Card.Title className="mb-0">{room.name}</Card.Title>
                        {getStatusBadge(room)}
                      </div>
                      
                      <div className="mb-2">
                        <small className="text-muted">
                          👥 {UI_TEXT.STATISTICS_TOTAL.replace(':', '')} {room.players?.length || 0}/{room.maxPlayers || 0}
                        </small>
                      </div>
                      
                      <div className="mb-2">
                        <small className="text-muted">
                          🎮 {getGameModeText(room.rules?.gameMode || '')}
                        </small>
                      </div>
                      
                      <div className="mb-3">
                        <small className="text-muted">
                          🃏 {room.rules?.cardCount || 0} карт, {getThrowingModeText(room.rules?.throwingMode || '')}
                        </small>
                      </div>
                      
                      {room.createdAt && (
                        <div className="mb-3">
                          <small className="text-muted">
                            🕐 Создана {new Date(room.createdAt).toLocaleTimeString()}
                          </small>
                        </div>
                      )}

                      <Button
                        variant={canJoinRoom(room) ? 'success' : 'secondary'}
                        className="w-100 mb-2"
                        onClick={() => handleJoinRoom(room.id)}
                        disabled={!canJoinRoom(room) || isJoining === room.id}
                      >
                        {isJoining === room.id ? (
                          <>
                            <Spinner animation="border" size="sm" className="me-2" />
                            {UI_TEXT.JOINING_TEXT}
                          </>
                        ) : canJoinRoom(room) ? (
                          UI_TEXT.JOIN_BUTTON
                        ) : room.status === 'playing' ? (
                          UI_TEXT.IN_GAME_TEXT
                        ) : (
                          UI_TEXT.ROOM_FULL_TEXT
                        )}
                      </Button>

                      {/* Список игроков */}
                      {room.players && room.players.length > 0 && (
                        <div>
                          <small className="text-muted">{UI_TEXT.PLAYERS_LABEL}</small>
                          <div className="mt-1">
                            {room.players.map((player, index) => (
                              <Badge 
                                key={`${player.id}-${index}`} 
                                bg="light" 
                                text="dark" 
                                className="me-1 mb-1"
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
                </Col>
              ))}
            </Row>
          )}
        </>
      )}

      {/* Статистика */}
      {isConnected && roomStats.total > 0 && (
        <Row className="mt-4">
          <Col>
            <Card>
              <Card.Body className="text-center">
                <small className="text-muted">
                  {UI_TEXT.STATISTICS_TOTAL} {roomStats.total} | 
                  {UI_TEXT.STATISTICS_WAITING} {roomStats.waiting} | 
                  {UI_TEXT.STATISTICS_PLAYING} {roomStats.playing}
                </small>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
    </Container>
  );
};

export default RoomListPage;
