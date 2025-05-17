import { useEffect, useRef, useState } from 'react';

type Message =
  | { type: 'create_room' }
  | { type: 'join_room'; roomId: string }
  | { type: 'room_created'; roomId: string }
  | { type: 'room_joined'; roomId: string }
  | { type: 'player_count'; count: number }
  | { type: 'error'; message: string };

export function useWebSocketRoom(url = 'wss://durak-server-051x.onrender.com') {
  const socketRef = useRef<WebSocket | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [playerCount, setPlayerCount] = useState<number>(1);
  const [isConnected, setConnected] = useState<boolean>(false);

  useEffect(() => {
    const socket = new WebSocket(url);
    socketRef.current = socket;

    socket.onopen = () => {
      setConnected(true);
      console.log('[WebSocket] Connected');
    };

    socket.onmessage = (event) => {
      const msg: Message = JSON.parse(event.data);
      console.log('[WebSocket] Message:', msg);

      if (msg.type === 'room_created') {
        setRoomId(msg.roomId);
      }

      if (msg.type === 'room_joined') {
        setRoomId(msg.roomId);
      }

      if (msg.type === 'player_count') {
        setPlayerCount(msg.count);
      }

      if (msg.type === 'error') {
        console.warn('[WebSocket] Error:', msg.message);
      }
    };

    socket.onclose = () => {
      setConnected(false);
      console.log('[WebSocket] Disconnected');
    };

    return () => {
      socket.close();
    };
  }, [url]);

  const send = (msg: Message) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(msg));
    } else {
      console.warn('[WebSocket] Not ready');
    }
  };

  const createRoom = () => {
    send({ type: 'create_room' });
  };

  const joinRoom = (id: string) => {
    send({ type: 'join_room', roomId: id });
  };

  return {
    roomId,
    playerCount,
    createRoom,
    joinRoom,
    isConnected,
  };
}
