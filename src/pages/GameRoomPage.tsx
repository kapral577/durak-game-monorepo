import React, { useEffect, useMemo } from 'react';
import { Container, Button } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';

import { useWebSocketRoom } from '../hooks/useWebSocketRoom';
import { useGame } from '../context/GameEngineProvider';
import PlayerSlot from '../components/PlayerSlot';

const GameRoomPage: React.FC = () => {
  /* ――― WebSocket-слой ――― */
  const {
    joinRoom,
    slots = [],               // ← на случай undefined
    you,
    isConnected,
    sendWhenReady,
  } = useWebSocketRoom();

  /* ――― GameState из Engine ――― */
  const { gameState } = useGame();

  /* ――― Router ――― */
  const { roomId } = useParams();
  const navigate = useNavigate();

  /* ① Вступаем в комнату при первом соединении */
  useEffect(() => {
    if (!roomId || !isConnected) return;
    if (slots.some((s) => s.player?.playerId === you?.playerId)) return;
    joinRoom(roomId);
  }, [roomId, isConnected, joinRoom, slots, you]);

  /* ② Переход в игровую фазу */
  useEffect(() => {
    if (gameState?.phase === 'playing') navigate('/play');
  }, [gameState?.phase, navigate]);

  /* ③ Индекс «своего» слота и упорядоченный массив */
  const yourIndex = useMemo(
    () => slots.findIndex((s) => s.player?.playerId === you?.playerId),
    [slots, you]
  );

  const orderedSlots = useMemo(() => {
    if (yourIndex === -1) return slots;
    return [...slots.slice(yourIndex + 1), ...slots.slice(0, yourIndex + 1)];
  }, [slots, yourIndex]);

  /* ④ Отправляем готовность */
  const markReady = () => {
    if (!you || !roomId) return;
    sendWhenReady({ type: 'set_ready', roomId, playerId: you.playerId });
  };

  /* ⑤ Готов ли «я»? */
  const isYouReady = useMemo(() => {
    if (!you) return false;
    const meSlot = slots.find((s) => s.player?.playerId === you.playerId);
    return !!meSlot?.player?.isReady;
  }, [slots, you]);

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
            ready={!!slot.player?.isReady}
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