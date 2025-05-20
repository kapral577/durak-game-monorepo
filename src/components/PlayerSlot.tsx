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

const PlayerSlot: React.FC<Props> = ({ player, isYou, ready }) => {
  if (!player) {
    return (
      <div className="border border-secondary rounded text-center p-3" style={{ width: '120px', backgroundColor: '#2c2c2c' }}>
        <div className="text-muted">Пусто</div>
      </div>
    );
  }

  return (
    <div className="border border-light rounded text-center p-3" style={{ width: '120px', backgroundColor: '#3a3a3a' }}>
      <div className="fw-bold text-white">{player.name}</div>
      {isYou && <div className="text-success">(Вы)</div>}
   </div>
  );   {ready && <div className="text-primary">✅ Готов</div>}
    
};

export default PlayerSlot;
