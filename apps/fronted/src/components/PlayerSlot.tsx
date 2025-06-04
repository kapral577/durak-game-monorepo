import React from 'react';
import { Player } from '../shared/types';

// Константы для UI элементов
const UI_CONSTANTS = {
  EMPTY_SLOT: 'Пусто',
  YOU_LABEL: '(Вы)',
  READY_EMOJI: '✅',
  READY_TEXT: 'Готов',
} as const;

interface Props {
  player: Player | null;
  isYou: boolean;
  ready: boolean;
}

/**
 * Отображает слот игрока:
 * – пустой, если player === null
 * – имя, подпись «(Вы)» и индикатор готовности
 */
const PlayerSlot: React.FC<Props> = ({ player, isYou, ready }) => {
  /* Пустое место */
  if (!player) {
    return (
      <div className="player-slot empty">
        <span className="text-muted">{UI_CONSTANTS.EMPTY_SLOT}</span>
      </div>
    );
  }

  /* Занято место */
  return (
    <div className="player-slot occupied">
      <div className="player-name">
        {player.name}
        {isYou && (
          <small className="text-primary ms-1">
            {UI_CONSTANTS.YOU_LABEL}
          </small>
        )}
      </div>
      {ready && (
        <div className="ready-indicator">
          <span className="me-1">{UI_CONSTANTS.READY_EMOJI}</span>
          <small className="text-success">{UI_CONSTANTS.READY_TEXT}</small>
        </div>
      )}
    </div>
  );
};

export default React.memo(PlayerSlot);
