// useWebSocketRoom.ts
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateId } from '../utils/id';
import { useWebSocketContext } from '../context/WebSocketProvider';

interface Player {
  playerId: string;
  name: string;
}

interface Slot {
  id: number;
  player: Player | null;
}

interface RoomStateMessage {
  type: 'room_state';
  slots: Slot[];
}

interface RoomsListMessage {
  type: 'rooms_list';
  rooms: any[];
}

interface RoomJoinedMessage {
  type: 'room_joined';
  roomId: string;
}

export function useWebSocketRoom() {
  const { socket, isConnected, sendWhenReady } = useWebSocketContext();
  const [slots, setSlots] = useState<Slot[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const navigate = useNavigate();

  const playerId = useRef(localStorage.getItem('playerId') || generateId());
  const name = useRef(localStorage.getItem('playerName') || 'Гость');

  useEffect(() => {
    localStorage.setItem('playerId', playerId.current);
    localStorage.setItem('playerName', name.current);
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleMessage = (event: MessageEvent) => {
      const data = JSON.parse(event.data);

      switch (data.type) {
        case 'room_state':
          setSlots(data.slots);
          break;
        case 'rooms_list':
          setRooms(data.rooms);
          break;
        case 'room_joined':
          navigate(`/room/${data.roomId}`);
          break;
      }
    };

    socket.addEventListener('message', handleMessage);
    return () => {
      socket.removeEventListener('message', handleMessage);
      // socket.close(); // 🔥 Удалено: сокет больше не закрывается
    };
  }, [socket, navigate]);

  const createRoom = useCallback(
    (payload: { rules: any; maxPlayers: number }): Promise<string> => {
      return new Promise((resolve) => {
        const roomId = generateId();
        sendWhenReady({
          type: 'create_room',
          playerId: playerId.current,
          name: name.current,
          rules: payload.rules,
          maxPlayers: payload.maxPlayers,
        });
        resolve(roomId);
      });
    },
    [sendWhenReady]
  );

  const joinRoom = useCallback(
    (roomId: string) => {
      sendWhenReady({
        type: 'join_room',
        roomId,
        playerId: playerId.current,
        name: name.current,
      });
    },
    [sendWhenReady]
  );

  const getRooms = useCallback(() => {
    sendWhenReady({ type: 'get_rooms' });
  }, [sendWhenReady]);

  const you = slots.find((s) => s.player?.playerId === playerId.current)?.player || null;

  return {
    socket,
    isConnected,
    createRoom,
    joinRoom,
    getRooms,
    slots,
    rooms,
    you,
  };
}
