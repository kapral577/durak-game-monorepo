// src/hooks/useGameState.ts
import { useState, useEffect, useCallback } from 'react';
import { GameState, GameAction, WebSocketMessage } from '../shared/types';

export const useGameState = (socket: WebSocket | null) => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Обработка входящих сообщений игры
  useEffect(() => {
    if (!socket) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        
        switch (message.type) {
          case 'game_started':
            setGameState(message.gameState);
            break;
            
          case 'game_updated':
            setGameState(message.gameState);
            break;
            
          case 'game_action_result':
            if (message.success) {
              setGameState(message.gameState);
            } else {
              setError(message.error || 'Ошибка игрового действия');
            }
            break;
            
          case 'game_ended':
            setGameState(message.gameState);
            break;
            
          case 'player_disconnected':
            if (gameState) {
              setGameState({
                ...gameState,
                players: gameState.players.map(p => 
                  p.id === message.playerId 
                    ? { ...p, isConnected: false }
                    : p
                )
              });
            }
            break;
        }
      } catch (err) {
        console.error('Error parsing game message:', err);
      }
    };

    socket.addEventListener('message', handleMessage);
    return () => socket.removeEventListener('message', handleMessage);
  }, [socket, gameState]);

  // Выполнение игрового действия
  const makeGameAction = useCallback(async (action: GameAction) => {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      throw new Error('Нет соединения с сервером');
    }

    try {
      setError(null);
      
      const message: WebSocketMessage = {
        type: 'game_action',
        action,
        timestamp: Date.now(),
      };

      socket.send(JSON.stringify(message));
    } catch (err) {
      const errorMessage = 'Ошибка отправки игрового действия';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [socket]);

  return {
    gameState,
    error,
    makeGameAction,
  };
};
