mport { Card, Suit } from './deck';
import { GameMode } from '../types/context';
import { Player } from './player';

// Порядок старшинства карт (index = сила)
const rankOrder: string[] = ['6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

function getRankIndex(rank: string): number {
  return rankOrder.indexOf(rank);
}

/**
 * Проверяет, может ли карта defCard побить карту attackCard
 */
export function canDefend(defCard: Card, attackCard: Card, trumpSuit: Suit): boolean {
  const isDefTrump = defCard.suit === trumpSuit;
  const isAttackTrump = attackCard.suit === trumpSuit;

  if (isDefTrump && !isAttackTrump) return true;
  if (defCard.suit === attackCard.suit) {
    return getRankIndex(defCard.rank) > getRankIndex(attackCard.rank);
  }
  return false;
}

/**
 * Проверяет, можно ли подкинуть карту на стол
 * @param card - подкидываемая карта
 * @param tableCards - уже лежащие карты на столе
 */
export function canThrow(card: Card, tableCards: Card[], gameMode: GameMode): boolean {
  const activeRanks = tableCards.flatMap((c) => c.rank);
  return activeRanks.includes(card.rank);
}

/**
 * Проверка окончания раунда — все атакующие отбиты
 */
export function isRoundOver(attackPairs: { attack: Card; defend?: Card }[]): boolean {
  return attackPairs.every((pair) => pair.defend !== undefined);
}

/**
 * Получает индекс следующего игрока
 */
export function getNextPlayerIndex(currentIndex: number, totalPlayers: number): number {
  return (currentIndex + 1) % totalPlayers;
}

/**
 * Начало нового раунда: атака от игрока
 */
export function startRound(players: Player[], attackerIndex: number): { attacker: Player; defender: Player } {
  const defenderIndex = getNextPlayerIndex(attackerIndex, players.length);
  return {
    attacker: players[attackerIndex],
    defender: players[defenderIndex],
  };
}

/**
 * Совершение атаки — удаляет карту из руки атакующего
 */
export function makeAttack(player: Player, card: Card): Player {
  return {
    ...player,
    hand: player.hand.filter(
      (c) => !(c.suit === card.suit && c.rank === card.rank)
    ),
  };
}

/**
 * Совершение защиты — удаляет карту из руки защитника
 */
export function defendWithCard(player: Player, card: Card): Player {
  return {
    ...player,
    hand: player.hand.filter(
      (c) => !(c.suit === card.suit && c.rank === card.rank)
    ),
  };
}

/**
 * Завершение хода — расчёт следующего атакующего
 */
export function endTurn(currentDefenderIndex: number, tableCleared: boolean, totalPlayers: number): number {
  return tableCleared
    ? getNextPlayerIndex(currentDefenderIndex, totalPlayers)
    : currentDefenderIndex;
}
