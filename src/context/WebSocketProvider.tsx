import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameEngineProvider';

const WS_URL = 'wss://durak-server-051x.onrender.com';

interface WebSocketContextType {
  socket: WebSocket | null;
  isConnected: boolean;
  sendWhenReady: (data: any) => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const socketRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const queue = useRef<any[]>([]);
  const navigate = useNavigate();
  const { setGameState } = useGame();

  useEffect(() => {
    const socket = new WebSocket(WS_URL);
    socketRef.current = socket;

    socket.addEventListener('open', () => {
      setIsConnected(true);
      while (queue.current.length > 0) {
        const msg = queue.current.shift();
        socket.send(JSON.stringify(msg));
      }
    });

    socket.addEventListener('message', (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'start_game') {
        setGameState(data.state);
        navigate('/play');
      }
    });

    socket.addEventListener('close', () => {
      setIsConnected(false);
    });

    socket.addEventListener('error', (e) => {
      console.error('WebSocket error:', e);
    });

    return () => {
      // socket.close(); // отключаем только если нужно
    };
  }, [navigate, setGameState]);

  const sendWhenReady = (data: any) => {
    const socket = socketRef.current;
    if (!socket) return;
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(data));
    } else {
      queue.current.push(data);
    }
  };

  return (
    <WebSocketContext.Provider
      value={{ socket: socketRef.current, isConnected, sendWhenReady }}
    >
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocketContext = (): WebSocketContextType => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocketContext must be used within WebSocketProvider');
  }
  return context;
};