import { useEffect, useMemo, useRef, useState } from 'react';
import { useGame } from '../context/GameEngineProvider';

export function useWebSocketRoom() {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [roomId, setRoomId] = useState<string>('');
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const joinCallback = useRef<(roomId: string) => void>();
  const { startLobby } = useGame();

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

  const avatar = useMemo(() => {
    const existing = localStorage.getItem('playerAvatar');
    if (existing) return existing;
    const seed = Math.random().toString(36).substring(2, 10);
    localStorage.setItem('playerAvatar', seed);
    return seed;
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
        const players = data.players.map((p: any) => ({
          id: p.playerId,
          name: p.name,
          avatar: p.avatar,
          ready: false,
        }));
        const you = players.find((p: any) => p.id === playerId);
        startLobby(players, {}, you);
      }
    };

    setSocket(ws);
    return () => ws.close();
  }, []);

  const createRoom = () => {
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: 'create_room', playerId, name, avatar }));
    }
  };

  const joinRoom = (roomId: string) => {
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: 'join_room', roomId, playerId, name, avatar }));
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
  };
}
