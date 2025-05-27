import React, { useEffect, useMemo, useState } from 'react';
import { Container, Button } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';

import { useWebSocketRoom } from '../hooks/useWebSocketRoom';
import { useGame } from '../context/GameEngineProvider';
import PlayerSlot from '../components/PlayerSlot';

const GameRoomPage: React.FC = () => {
  /* ――― WebSocket-слой ――― */
  const {
    joinRoom,
    slots = [],                  // ← если undefined, берём пустой массив
    you,
    isConnected,
    sendWhenReady,
  } = useWebSocketRoom();

  /* ――― GameState из Engine ――― */
  const { gameState } = useGame();

  /* ――― React Router ――― */
  const { roomId } = useParams();
  const navigate = useNavigate();

  /* ――― Локальное состояние готовности ――― */
  const [readyPlayers, setReadyPlayers] = useState<string[]>([]);

  /* Подключаемся к комнате однажды, когда сокет соединён */
  useEffect(() => {
    if (!roomId || !isConnected) return;
    if (slots.some((s) => s.player?.playerId === you?.playerId)) return;
    joinRoom(roomId);
  }, [roomId, isConnected, joinRoom, slots, you]);

  /* Переходим на игровую страницу, когда сервер прислал фазу 'playing' */
  useEffect(() => {
    if (gameState?.phase === 'playing') {
      navigate('/play');
    }
  }, [gameState?.phase, navigate]);

  /* Индекс «вашего» слота и переупорядоченный массив слотов */
  const yourIndex = useMemo(
    () => slots.findIndex((s) => s.player?.playerId === you?.playerId),
    [slots, you]
  );

  const orderedSlots = useMemo(() => {
    if (yourIndex === -1) return slots;
    return [...slots.slice(yourIndex + 1), ...slots.slice(0, yourIndex + 1)];
  }, [slots, yourIndex]);

  /* Отметить готовность */
  const markReady = () => {
    if (!you || !roomId) return;
    setReadyPlayers((prev) => [...prev, you.playerId]);
    sendWhenReady({ type: 'set_ready', roomId, playerId: you.playerId });
  };

  const isYouReady = you ? readyPlayers.includes(you.playerId) : false;

  /* ――― UI ――― */
  return (
    <Container
      fluid
      className="position-relative text-light"
      style={{ minHeight: '100vh', backgroundColor: '#1c1c1c' }}
    >
      <h1 className="text-center pt-4">Ожидание игроков</h1>

      <div className="d-flex justify-content-center align-items-center flex-wrap gap-3 mt-5">
        {orderedSlots.map((slot) => (
          <PlayerSlot
            key={slot.id}
            player={slot.player}
            isYou={slot.player?.playerId === you?.playerId}
            ready={slot.player ? readyPlayers.includes(slot.player.playerId) : false}
          />
        ))}
      </div>

      {you && !isYouReady && (
        <div className="text-center mt-4">
          <Button variant="success" size="lg" onClick={markReady}>
            Я готов
          </Button>
        </div>
      )}
    </Container>
  );
};

export default GameRoomPage;