import { useEffect, useMemo, useRef, useState } from 'react';
import { useGameSettings } from '../context/GameSettingsContext';

export function useWebSocketRoom() {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [roomId, setRoomId] = useState<string>('');
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const joinCallback = useRef<(roomId: string) => void>();
  const [slots, setSlots] = useState<(any | null)[]>([]);

  const { playerCount } = useGameSettings();

  const playerId = useMemo(() => {
    const existing = localStorage.getItem('playerId');
    if (existing) return existing;
    const newId = crypto.randomUUID();
    localStorage.setItem('playerId', newId);
    return newId;
  }, []);

  const name = useMemo(() => {
    const existing = localStorage.getItem('playerName');
    if (existing) return existing;
    const generated = 'Игрок ' + Math.floor(Math.random() * 1000);
    localStorage.setItem('playerName', generated);
    return generated;
  }, []);

  useEffect(() => {
    const ws = new WebSocket('wss://durak-server-051x.onrender.com');

    ws.onopen = () => {
      setIsConnected(true);
      console.log('[WS] Connected');
    };

    ws.onclose = () => {
      setIsConnected(false);
      console.log('[WS] Disconnected');
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'room_created') {
        setRoomId(data.roomId);
      }

      if (data.type === 'room_joined') {
        if (joinCallback.current) {
          joinCallback.current(data.roomId);
        }
      }

      if (data.type === 'room_state') {
        setSlots(data.slots);
      }
    };

    setSocket(ws);
    return () => ws.close();
  }, []);

  const createRoom = () => {
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: 'create_room',
        playerId,
        name,
        maxPlayers: playerCount,
      }));
    }
  };

  const joinRoom = (roomId: string) => {
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: 'join_room',
        roomId,
        playerId,
        name,
      }));
    }
  };

  const getRooms = () => {
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: 'get_rooms' }));
    }
  };

  return {
    socket,
    roomId,
    isConnected,
    createRoom,
    joinRoom,
    getRooms,
    slots,
    you: { playerId, name },
  };
}
