import { useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWebSocketContext } from '../context/WebSocketProvider';

export function useWebSocketRoom() {
  const { sendWhenReady } = useWebSocketContext();
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!socketRef.current && typeof window !== 'undefined') {
      socketRef.current = new WebSocket('wss://durak-server-051x.onrender.com');
    }
  }, []);

  const createRoom = useCallback(({ rules, maxPlayers }: { rules: any; maxPlayers: number }) => {
    return new Promise<string>((resolve) => {
      sendWhenReady({ type: 'create_room', rules, maxPlayers });

      const socket = socketRef.current;
      if (!socket) return;

      const handler = (event: MessageEvent) => {
        const data = JSON.parse(event.data);
        if (data.type === 'room_created') {
          resolve(data.roomId);
          socket.removeEventListener('message', handler);
        }
      };

      socket.addEventListener('message', handler);
    });
  }, [sendWhenReady]);

  const joinRoom = useCallback((roomId: string) => {
    sendWhenReady({ type: 'join_room', roomId });
  }, [sendWhenReady]);

  return {
    createRoom,
    joinRoom,
  };
}
