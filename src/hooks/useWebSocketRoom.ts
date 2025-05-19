import { useCallback, useEffect, useRef, useState } from 'react';
import { generateId } from '../utils/id';

const WS_URL = 'wss://durak-server-051x.onrender.com';

interface Player {
  playerId: string;
  name: string;
}

interface Slot {
  id: number;
  player: Player | null;
}

interface Rules {
  gameMode: string;
  throwingMode: string;
  cardCount: number;
}

interface RoomInfo {
  roomId: string;
  rules: Rules;
  slots: Slot[];
}

export function useWebSocketRoom() {
  const socketRef = useRef<WebSocket | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [you, setYou] = useState<Player | null>(null);

  useEffect(() => {
    const socket = new WebSocket(WS_URL);
    socketRef.current = socket;

    socket.onopen = () => {
      setIsConnected(true);

      const playerId = localStorage.getItem('playerId') || generateId();
      const name = localStorage.getItem('playerName') || 'Ты';
      localStorage.setItem('playerId', playerId);
      localStorage.setItem('playerName', name);
      setYou({ playerId, name });
    };

    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);

      if (message.type === 'room_created') {
        setRoomId(message.roomId);
      }

      if (message.type === 'room_state') {
        setSlots(message.slots || []);
      }
    };

    socket.onclose = () => setIsConnected(false);
    socket.onerror = () => setIsConnected(false);

    return () => socket.close();
  }, []);

  const sendWhenReady = useCallback((payload: object) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(payload));
    } else {
      const trySend = () => {
        if (socketRef.current?.readyState === WebSocket.OPEN) {
          socketRef.current.send(JSON.stringify(payload));
        } else {
          setTimeout(trySend, 100);
        }
      };
      trySend();
    }
  }, []);

  const createRoom = useCallback(
    ({ rules, maxPlayers }: { rules: Rules; maxPlayers: number }): Promise<string> => {
      return new Promise((resolve) => {
        const playerId = localStorage.getItem('playerId');
        const name = localStorage.getItem('playerName');

        if (playerId && name) {
          const handler = (event: MessageEvent) => {
            const message = JSON.parse(event.data);
            if (message.type === 'room_created') {
              setRoomId(message.roomId);
              socketRef.current?.removeEventListener('message', handler);
              resolve(message.roomId);
            }
          };

          socketRef.current?.addEventListener('message', handler);

          sendWhenReady({
            type: 'create_room',
            playerId,
            name,
            rules,
            maxPlayers,
          });
        }
      });
    },
    [sendWhenReady]
  );

  const joinRoom = useCallback((roomId: string) => {
    const playerId = localStorage.getItem('playerId');
    const name = localStorage.getItem('playerName');

    if (playerId && name) {
      sendWhenReady({
        type: 'join_room',
        roomId,
        playerId,
        name,
      });
    }
  }, [sendWhenReady]);

  const getRooms = useCallback(() => {
    sendWhenReady({ type: 'get_rooms' });
  }, [sendWhenReady]);

  return {
    socket: socketRef.current,
    roomId,
    slots,
    isConnected,
    you,
    createRoom,
    joinRoom,
    getRooms,
  };
}
