import { GameMode } from '../types/context';
import { Card } from './deck';

export const rankOrder: string[] = ['6','7','8','9','10','J','Q','K','A'];

/**
 * Проверяет, можно ли перевести атаку (для режима transferable)
 */
export function canTransferAttack(
  mode: GameMode,
  defenderHand: Card[],
  incomingCard: Card
): boolean {
  if (mode !== 'transferable') return false;

  return defenderHand.some((card) => card.rank === incomingCard.rank);
}

/**
 * Возвращает максимум карт для подкидывания на основе количества игроков
 */
export function getMaxTableCards(gameMode: GameMode, numPlayers: number): number {
  return gameMode === 'transferable' ? numPlayers * 2 : 6;
}

/**
 * Проверяет, может ли карта начать атаку (первая карта раунда)
 */
export function canStartAttack(card: Card): boolean {
  return true;
}

/**
 * Проверка валидности подкидывания/атаки
 */
export function isValidMove(card: Card, tableCards: Card[], gameMode: GameMode): boolean {
  if (tableCards.length === 0) return canStartAttack(card);
  return tableCards.some((c) => c.rank === card.rank);
}

/**
 * Определяет первого атакующего (по наименьшему козырю)
 */
export function findFirstAttacker(players: { hand: Card[] }[], trumpSuit: string): number {
  let attackerIndex = -1;
  let lowestTrumpIndex = Infinity;

  players.forEach((player, index) => {
    const trumps = player.hand.filter((card) => card.suit === trumpSuit);
    const lowest = trumps.reduce((min, c) => {
      const idx = rankOrder.indexOf(c.rank);
      return idx >= 0 && idx < min ? idx : min;
    }, Infinity);

    if (lowest < lowestTrumpIndex) {
      lowestTrumpIndex = lowest;
      attackerIndex = index;
    }
  });

  return attackerIndex >= 0 ? attackerIndex : 0;
}

/**
 * Подсчитывает, сколько карт положено раздать каждому игроку
 */
export function getInitialHandSize(): number {
  return 6;
} 
