import { useCallback } from 'react';
import { useWebSocketContext } from '../context/WebSocketProvider';
import { generateId } from '../utils/id';

interface CreateRoomParams {
  rules: any;
  maxPlayers: number;
}

interface UseWebSocketRoom {
  createRoom: (params: CreateRoomParams) => Promise<string>;
  joinRoom: (roomId: string) => void;
  isConnected: boolean;
}

export function useWebSocketRoom(): UseWebSocketRoom {
  const { sendWhenReady, isConnected } = useWebSocketContext();

  const createRoom = useCallback(async ({ rules, maxPlayers }: CreateRoomParams): Promise<string> => {
    const roomId = generateId();

    sendWhenReady({
      type: 'create_room',
      roomId,
      rules,
      maxPlayers,
    });

    return roomId;
  }, [sendWhenReady]);

  const joinRoom = useCallback((roomId: string) => {
    sendWhenReady({
      type: 'join_room',
      roomId,
    });
  }, [sendWhenReady]);

  return {
    createRoom,
    joinRoom,
    isConnected,
  };
}