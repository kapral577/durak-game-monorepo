import { useCallback, useEffect, useState } from 'react';
import { useWebSocketContext } from '../context/WebSocketProvider';
import { generateId } from '../utils/id';

/* ────────── Типы ────────── */

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
  createRoom: (params: CreateRoomParams) => Promise<string>;
  joinRoom: (roomId: string) => void;
  isConnected: boolean;
  sendWhenReady: (data: any) => void;
  slots: Slot[];
  you: { playerId: string; name: string } | null;
}

/* ────────── Хук ────────── */

export function useWebSocketRoom(): UseWebSocketRoom {
  const { socket, isConnected, sendWhenReady } = useWebSocketContext();

  const [slots, setSlots] = useState<Slot[]>([]);
  const [you, setYou] = useState<{ playerId: string; name: string } | null>(
    null
  );

  /* Подписка на событие 'slots' от сервера */
  useEffect(() => {
    if (!socket) return;

    const listener = (event: MessageEvent) => {
      const data = JSON.parse(event.data);

      if (data.type === 'slots') {
        setSlots(data.slots);

        /* Определяем «себя» по playerId, который хранится в сокете */
        const myId = (socket as any).playerId as string | undefined;
        if (!myId) return;

        const me = data.slots
          .flatMap((s: Slot) => (s.player ? [s.player] : []))
          .find((p) => p.playerId === myId);

        if (me) setYou({ playerId: me.playerId, name: me.name });
      }
    };

    socket.addEventListener('message', listener);
    return () => socket.removeEventListener('message', listener);
  }, [socket]);

  /* create_room */
  const createRoom = useCallback(
    async ({ rules, maxPlayers }: CreateRoomParams): Promise<string> => {
      const roomId = generateId();

      sendWhenReady({
        type: 'create_room',
        roomId,
        rules,
        maxPlayers,
      });

      return roomId;
    },
    [sendWhenReady]
  );

  /* join_room */
  const joinRoom = useCallback(
    (roomId: string) => {
      sendWhenReady({
        type: 'join_room',
        roomId,
      });
    },
    [sendWhenReady]
  );

  return {
    createRoom,
    joinRoom,
    isConnected,
    sendWhenReady,
    slots,
    you,
  };
}