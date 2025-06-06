// src/pages/RoomListPage.tsx - СПИСОК ИГРОВЫХ КОМНАТ

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Form, Button, Alert, Badge, Spinner } from 'react-bootstrap';
import { useGame } from '../context/GameProvider';
import { Room } from '@shared/types';

// ===== ИНТЕРФЕЙСЫ =====

/**
 * Props для RoomListPage
 */
export interface RoomListPageProps {
  // Если нужны props в будущем
}

// ===== КОНСТАНТЫ =====

const UI_TEXT = {
  PAGE_TITLE: 'Список игровых комнат',
  SEARCH_PLACEHOLDER: 'Поиск по названию комнаты...',
  STATISTICS_TOTAL: 'Всего комнат:',
  STATISTICS_WAITING: 'Ожидают игроков:',
  STATISTICS_PLAYING: 'В игре:',
  JOIN_BUTTON: 'Присоединиться',
  CREATE_ROOM_BUTTON: 'Создать комнату',
  BACK_BUTTON: '← Назад',
  NO_ROOMS: 'Комнаты не найдены',
  LOADING_TEXT: 'Загрузка комнат...',
  ERROR_LOADING: 'Ошибка загрузки комнат',
  ROOM_FULL: 'Комната заполнена',
  ROOM_NOT_FOUND: 'Комната не найдена',
  JOINING_TEXT: 'Присоединение...'
} as const;

const STATUS_BADGES = {
  waiting: { variant: 'success', text: 'Ожидает игроков' },
  playing: { variant: 'warning', text: 'В игре' },
  finished: { variant: 'secondary', text: 'Завершена' }
} as const;

const GAME_MODE_TEXTS = {
  classic: 'Классический',
  transferable: 'Переводной'
} as const;

const THROWING_MODE_TEXTS = {
  standard: 'Стандартный',
  smart: 'Умный'
} as const;

const CSS_CLASSES = {
  ROOM_LIST_PAGE: 'room-list-page',
  SEARCH_SECTION: 'search-section',
  STATS_SECTION: 'stats-section',
  ROOMS_SECTION: 'rooms-section',
  ROOM_CARD: 'room-card',
  ROOM_HEADER: 'room-header',
  ROOM_BODY: 'room-body',
  ROOM_FOOTER: 'room-footer',
  PLAYER_LIST: 'player-list',
  EMPTY_STATE: 'empty-state'
} as const;

// ===== УТИЛИТАРНЫЕ ФУНКЦИИ =====

/**
 * Валидация комнаты
 */
const validateRoom = (room: any): room is Room => {
  return room &&
    typeof room.id === 'string' &&
    typeof room.name === 'string' &&
    Array.isArray(room.players) &&
    typeof room.maxPlayers === 'number' &&
    room.status &&
    room.rules;
};

/**
 * Проверка возможности присоединения к комнате
 */
const canJoinRoom = (room: Room): boolean => {
  return room.status === 'waiting' && room.players.length < room.maxPlayers;
};

/**
 * Получение badge статуса комнаты
 */
const getStatusBadge = (room: Room) => {
  const config = STATUS_BADGES[room.status as keyof typeof STATUS_BADGES] || STATUS_BADGES.finished;
  return config;
};

/**
 * Debounce функция для поиска
 */
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// ===== КОМПОНЕНТЫ =====

/**
 * Компонент карточки комнаты
 */
const RoomCard: React.FC<{
  room: Room;
  isJoining: boolean;
  onJoin: (roomId: string) => void;
}> = React.memo(({ room, isJoining, onJoin }) => {
  const statusBadge = getStatusBadge(room);
  const canJoin = canJoinRoom(room);

  return (
    <Card 
      className={`${CSS_CLASSES.ROOM_CARD} mb-3`}
      role="listitem"
      aria-label={`Комната ${room.name}, ${room.players.length} из ${room.maxPlayers} игроков`}
    >
      <Card.Header className={`${CSS_CLASSES.ROOM_HEADER} d-flex justify-content-between align-items-center`}>
        <h5 className="mb-0">{room.name}</h5>
        <Badge 
          bg={statusBadge.variant}
          aria-label={statusBadge.text}
        >
          {statusBadge.text}
        </Badge>
      </Card.Header>
      
      <Card.Body className={CSS_CLASSES.ROOM_BODY}>
        <Row>
          <Col md={6}>
            <small className="text-muted">Игроки ({room.players.length}/{room.maxPlayers}):</small>
            <div className={CSS_CLASSES.PLAYER_LIST}>
              {room.players.map((player, index) => (
                <span key={player.id || index} className="me-2">
                  {player.name}
                  {player.isReady && <span className="text-success ms-1">✓</span>}
                  {!player.isConnected && <span className="text-warning ms-1">⚠️</span>}
                </span>
              ))}
            </div>
          </Col>
          
          <Col md={6}>
            <small className="text-muted">Настройки:</small>
            <div>
              <div>{GAME_MODE_TEXTS[room.rules.gameMode as keyof typeof GAME_MODE_TEXTS]} дурак</div>
              <div>{THROWING_MODE_TEXTS[room.rules.throwingMode as keyof typeof THROWING_MODE_TEXTS]} подкидывание</div>
              <div>{room.rules.cardCount} карт</div>
            </div>
          </Col>
        </Row>
      </Card.Body>
      
      <Card.Footer className={`${CSS_CLASSES.ROOM_FOOTER} d-flex justify-content-between align-items-center`}>
        <small className="text-muted">
          Создана: {new Date(room.createdAt).toLocaleString()}
        </small>
        
        <Button
          variant={canJoin ? "primary" : "secondary"}
          disabled={!canJoin || isJoining}
          onClick={() => onJoin(room.id)}
          aria-label={`Присоединиться к комнате ${room.name}`}
        >
          {isJoining ? (
            <>
              <Spinner size="sm" className="me-2" />
              {UI_TEXT.JOINING_TEXT}
            </>
          ) : (
            UI_TEXT.JOIN_BUTTON
          )}
        </Button>
      </Card.Footer>
    </Card>
  );
});

RoomCard.displayName = 'RoomCard';

/**
 * Компонент статистики комнат
 */
const RoomStats: React.FC<{
  total: number;
  waiting: number;
  playing: number;
}> = React.memo(({ total, waiting, playing }) => (
  <Alert variant="info" className={`${CSS_CLASSES.STATS_SECTION} mb-3`}>
    {UI_TEXT.STATISTICS_TOTAL} {total} | 
    {UI_TEXT.STATISTICS_WAITING} {waiting} | 
    {UI_TEXT.STATISTICS_PLAYING} {playing}
  </Alert>
));

RoomStats.displayName = 'RoomStats';

/**
 * Компонент пустого состояния
 */
const EmptyState: React.FC = React.memo(() => (
  <div className={`${CSS_CLASSES.EMPTY_STATE} text-center py-5`}>
    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏪</div>
    <h4>{UI_TEXT.NO_ROOMS}</h4>
    <p className="text-muted">Создайте первую комнату или попробуйте изменить поисковый запрос</p>
  </div>
));

EmptyState.displayName = 'EmptyState';

// ===== ОСНОВНОЙ КОМПОНЕНТ =====

/**
 * Страница списка комнат
 */
export const RoomListPage: React.FC<RoomListPageProps> = () => {
  // Состояния
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isJoining, setIsJoining] = useState<string | null>(null);

  // Хуки
  const navigate = useNavigate();
  const { 
    rooms, 
    joinRoom, 
    refreshRooms,
    isConnected, 
    error,
    clearError 
  } = useGame();

  // Debounced поиск
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // ===== ОБРАБОТЧИКИ =====

  /**
   * Обработчик возврата назад
   */
  const handleBack = useCallback(() => {
    navigate('/');
  }, [navigate]);

  /**
   * Обработчик создания комнаты
   */
  const handleCreateRoom = useCallback(() => {
    navigate('/settings');
  }, [navigate]);

  /**
   * Обработчик присоединения к комнате
   */
  const handleJoinRoom = useCallback(async (roomId: string) => {
    if (!roomId || isJoining) return;

    if (!isConnected) {
      console.warn('Cannot join room: not connected to server');
      return;
    }

    setIsJoining(roomId);
    clearError();

    try {
      await joinRoom(roomId);
      navigate(`/room/${roomId}`);
    } catch (err) {
      console.error('Error joining room:', err);
      // Ошибка будет показана через контекст
    } finally {
      setIsJoining(null);
    }
  }, [joinRoom, navigate, isJoining, isConnected, clearError]);

  // ===== МЕМОИЗАЦИЯ =====

  /**
   * Фильтрация комнат по поисковому запросу
   */
  const filteredRooms = useMemo(() => {
    if (!rooms || !Array.isArray(rooms)) return [];

    return rooms
      .filter(validateRoom)
      .filter(room => 
        room.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      );
  }, [rooms, debouncedSearchTerm]);

  /**
   * Статистика комнат
   */
  const roomStats = useMemo(() => {
    const total = filteredRooms.length;
    const waiting = filteredRooms.filter(r => r.status === 'waiting').length;
    const playing = filteredRooms.filter(r => r.status === 'playing').length;

    return { total, waiting, playing };
  }, [filteredRooms]);

  // ===== АВТООБНОВЛЕНИЕ =====

  useEffect(() => {
    if (isConnected) {
      refreshRooms();
    }
  }, [isConnected, refreshRooms]);

  // ===== KEYBOARD SHORTCUTS =====

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case 'n':
            event.preventDefault();
            handleCreateRoom();
            break;
          case 'f':
            event.preventDefault();
            document.querySelector('input[type="text"]')?.focus();
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
  }, [handleCreateRoom, handleBack]);

  // ===== РЕНДЕР =====

  return (
    <Container 
      className={CSS_CLASSES.ROOM_LIST_PAGE}
      role="main"
      aria-label="Список игровых комнат"
    >
      {/* Заголовок и навигация */}
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <Button
              variant="outline-secondary"
              onClick={handleBack}
              aria-label="Вернуться на главную страницу"
            >
              {UI_TEXT.BACK_BUTTON}
            </Button>
            
            <h2 className="mb-0">{UI_TEXT.PAGE_TITLE}</h2>
            
            <Button
              variant="success"
              onClick={handleCreateRoom}
              aria-label="Создать новую игровую комнату"
            >
              {UI_TEXT.CREATE_ROOM_BUTTON}
            </Button>
          </div>
        </Col>
      </Row>

      {/* Поиск */}
      <Row className="mb-3">
        <Col>
          <Form.Control
            type="text"
            placeholder={UI_TEXT.SEARCH_PLACEHOLDER}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={CSS_CLASSES.SEARCH_SECTION}
            aria-label="Поиск комнат по названию"
          />
        </Col>
      </Row>

      {/* Статистика */}
      <RoomStats 
        total={roomStats.total}
        waiting={roomStats.waiting}
        playing={roomStats.playing}
      />

      {/* Ошибка */}
      {error && (
        <Alert variant="danger" role="alert" aria-live="assertive">
          {error}
        </Alert>
      )}

      {/* Список комнат */}
      <div className={CSS_CLASSES.ROOMS_SECTION} role="list">
        {filteredRooms.length === 0 ? (
          <EmptyState />
        ) : (
          filteredRooms.map(room => (
            <RoomCard
              key={room.id}
              room={room}
              isJoining={isJoining === room.id}
              onJoin={handleJoinRoom}
            />
          ))
        )}
      </div>
    </Container>
  );
};

// Установка displayName для лучшей отладки
RoomListPage.displayName = 'RoomListPage';

// ===== ЭКСПОРТ =====
export default RoomListPage;
export type { RoomListPageProps };
export { UI_TEXT, STATUS_BADGES, CSS_CLASSES, validateRoom, canJoinRoom, getStatusBadge };
