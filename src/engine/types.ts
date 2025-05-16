import { Card } from './deck';
import { Player } from './player';
import { GameRules } from '../types/context';

export interface GameState {
  players: Player[];
  deck: Card[];
  discardPile: Card[];
  trumpSuit: string;
  currentAttackerIndex: number;
  currentDefenderIndex: number;
  status: 'waiting' | 'in_progress' | 'ended';
  rules: GameRules;
}
