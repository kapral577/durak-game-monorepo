import { Card, Player } from './types';

let playerIdCounter = 1;

export function createPlayer(name: string, isBot: boolean = false): Player {
  return {
    id: playerIdCounter++,
    name,
    isBot,
    hand: [],
    status: 'waiting',
  };
}

export function giveCards(player: Player, cards: Card[]): void {
  player.hand.push(...cards);
}
