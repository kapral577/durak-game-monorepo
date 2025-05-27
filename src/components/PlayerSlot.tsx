import React from 'react';

interface Player {
  playerId: string;
  name: string;
}

interface Props {
  player: Player | null;
  isYou: boolean;
  ready: boolean;
}

/**
 * Отображает слот игрока:
 *  – пустой, если player === null
 *  – имя, подпись «(Вы)» и индикатор готовности
 */
const PlayerSlot: React.FC<Props> = ({ player, isYou, ready }) => {
  /* Пустое место */
  if (!player) {
    return (
      <div
        className="border border-secondary rounded text-center p-3"
        style={{ width: '120px', backgroundColor: '#2c2c2c' }}
      >
        <div className="text-muted">Пусто</div>
      </div>
    );
  }

  /* Занято место */
  return (
    <div
      className="border border-light rounded text-center p-3"
      style={{ width: '120px', backgroundColor: '#3a3a3a' }}
    >
      <div className="fw-bold text-white">{player.name}</div>
      {isYou && <div className="text-success">(Вы)</div>}
      {ready && <div className="text-primary">✅ Готов</div>}
    </div>
  );
};

export default PlayerSlot;