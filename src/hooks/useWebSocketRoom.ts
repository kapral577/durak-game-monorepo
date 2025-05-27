import { useCallback, useEffect, useState } from 'react';
import { useWebSocketContext } from '../context/WebSocketProvider';
import { generateId } from '../utils/id';

/* ────────── типы ────────── */

interface CreateRoomParams {
  rules: any;
  maxPlayers: number;
}
interface Slot {
  id: number;
  player: {
    playerId: string;
    name: string;
    isReady: boolean;
  } | null;
}
interface UseWebSocketRoom {
  createRoom: (p: CreateRoomParams) => Promise<string>;
  joinRoom: (roomId: string) => void;
  isConnected: boolean;
  sendWhenReady: (d: any) => void;
  slots: Slot[];
  you: { playerId: string; name: string } | null;
}

/* ────────── хук ────────── */

export function useWebSocketRoom(): UseWebSocketRoom {
  const { socket, isConnected, sendWhenReady } = useWebSocketContext();

  const [slots, setSlots] = useState<Slot[]>([]);
  const [you, setYou] = useState<{ playerId: string; name: string } | null>(
    null
  );

  /* подписка на сообщения сервера */
  useEffect(() => {
    if (!socket) return;

    const listener = (event: MessageEvent) => {
      const data = JSON.parse(event.data);

      if (data.type === 'you') {
        setYou({ playerId: data.playerId, name: data.name });
      }

      if (data.type === 'slots') {
        setSlots(data.slots);
      }
    };

    socket.addEventListener('message', listener);
    return () => socket.removeEventListener('message', listener);
  }, [socket]);

  /* create_room */
  const createRoom = useCallback(
    async ({ rules, maxPlayers }: CreateRoomParams) => {
      const roomId = generateId();
      sendWhenReady({ type: 'create_room', roomId, rules, maxPlayers });
      return roomId;
    },
    [sendWhenReady]
  );

  /* join_room */
  const joinRoom = useCallback(
    (roomId: string) => sendWhenReady({ type: 'join_room', roomId }),
    [sendWhenReady]
  );

  return { createRoom, joinRoom, isConnected, sendWhenReady, slots, you };
}