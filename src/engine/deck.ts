import { Card } from './types';

/**
 * Создаёт колоду карт (36 или 52 карты).
 * @param type Тип колоды: '36' или '52'
 * @returns Перемешанная колода
 */
export function createDeck(type: '36' | '52' = '36'): Card[] {
  const suits: Card['suit'][] = ['♠', '♥', '♦', '♣'];

  const ranks36 = ['6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  const ranks52 = ['2', '3', '4', '5', ...ranks36];

  const ranks = type === '52' ? ranks52 : ranks36;

  const deck: Card[] = [];

  for (const suit of suits) {
    for (const rank of ranks) {
      deck.push({ suit, rank });
    }
  }

  return shuffle(deck);
}

/**
 * Перемешивает колоду (Fisher-Yates shuffle)
 */
function shuffle(deck: Card[]): Card[] {
  const result = [...deck];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
