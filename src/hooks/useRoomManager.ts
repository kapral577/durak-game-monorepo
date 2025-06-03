// src/hooks/useRoomManager.ts
import { useState, useEffect, useCallback } from 'react';
import { Room, WebSocketMessage } from '../shared/types';

export const useRoomManager = (socket: WebSocket | null) => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [autoStartInfo, setAutoStartInfo] = useState<any>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Обработка входящих сообщений комнат
  useEffect(() => {
    if (!socket) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        
        switch (message.type) {
          case 'rooms_list':
            setRooms(message.rooms || []);
            break;
            
          case 'room_created':
            if (message.room) {
              setCurrentRoom(message.room);
              setNotification('Комната успешно создана');
            }
            break;
            
          case 'room_joined':
            if (message.room) {
              setCurrentRoom(message.room);
              setNotification('Вы присоединились к комнате');
            }
            break;
            
          case 'room_updated':
            if (message.room) {
              setCurrentRoom(message.room);
              // Обновляем комнату в списке
              setRooms(prev => prev.map(r => 
                r.id === message.room.id ? message.room : r
              ));
            }
            break;
            
          case 'room_left':
            setCurrentRoom(null);
            setNotification('Вы покинули комнату');
            break;
            
          case 'player_joined_room':
            if (currentRoom && message.room) {
              setCurrentRoom(message.room);
            }
            break;
            
          case 'player_left_room':
            if (currentRoom && message.room) {
              setCurrentRoom(message.room);
            }
            break;
            
          case 'player_ready_changed':
            if (currentRoom && message.room) {
              setCurrentRoom(message.room);
            }
            break;
            
          case 'auto_start_info':
            setAutoStartInfo(message.autoStartInfo);
            break;
            
          case 'auto_start_countdown':
            setAutoStartInfo(message.autoStartInfo);
            break;
            
          case 'room_error':
            setError(message.error || 'Ошибка комнаты');
            break;
        }
      } catch (err) {
        console.error('Error parsing room message:', err);
      }
    };

    socket.addEventListener('message', handleMessage);
    return () => socket.removeEventListener('message', handleMessage);
  }, [socket, currentRoom]);

  // Создание комнаты
  const createRoom = useCallback((name: string, rules: any) => {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      setError('Нет соединения с сервером');
      return;
    }

    try {
      setError(null);
      
      const message: WebSocketMessage = {
        type: 'create_room',
        name,
        rules,
        timestamp: Date.now(),
      };

      socket.send(JSON.stringify(message));
    } catch (err) {
      setError('Ошибка создания комнаты');
    }
  }, [socket]);

  // Присоединение к комнате
  const joinRoom = useCallback((roomId: string) => {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      setError('Нет соединения с сервером');
      return;
    }

    try {
      setError(null);
      
      const message: WebSocketMessage = {
        type: 'join_room',
        roomId,
        timestamp: Date.now(),
      };

      socket.send(JSON.stringify(message));
    } catch (err) {
      setError('Ошибка присоединения к комнате');
    }
  }, [socket]);

  // Покидание комнаты
  const leaveRoom = useCallback(() => {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      setError('Нет соединения с сервером');
      return;
    }

    try {
      setError(null);
      
      const message: WebSocketMessage = {
        type: 'leave_room',
        timestamp: Date.now(),
      };

      socket.send(JSON.stringify(message));
    } catch (err) {
      setError('Ошибка выхода из комнаты');
    }
  }, [socket]);

  // Установка готовности
  const setReady = useCallback(() => {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      setError('Нет соединения с сервером');
      return;
    }

    try {
      setError(null);
      
      const message: WebSocketMessage = {
        type: 'player_ready',
        timestamp: Date.now(),
      };

      socket.send(JSON.stringify(message));
    } catch (err) {
      setError('Ошибка изменения готовности');
    }
  }, [socket]);

  // Запуск игры
  const startGame = useCallback(() => {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      setError('Нет соединения с сервером');
      return;
    }

    try {
      setError(null);
      
      const message: WebSocketMessage = {
        type: 'start_game',
        timestamp: Date.now(),
      };

      socket.send(JSON.stringify(message));
    } catch (err) {
      setError('Ошибка запуска игры');
    }
  }, [socket]);

  // Очистка уведомлений
  const clearNotification = useCallback(() => {
    setNotification(null);
  }, []);

  return {
    rooms,
    currentRoom,
    autoStartInfo,
    notification,
    error,
    createRoom,
    joinRoom,
    leaveRoom,
    setReady,
    startGame,
    clearNotification,
  };
};
