import { useState } from 'react';
import { createDeck } from '../engine/deck';
import { createPlayer, giveCards } from '../engine/player';
import { findFirstAttacker, getInitialHandSize } from '../engine/rules';
import { GameState, Player } from '../engine/types';
import { UseGame } from '../types/context';
import { GameRules } from '../types/context';

export function useGameEngine(): UseGame {
  const [players, setPlayers] = useState<Player[]>([]);
  const [you, setYou] = useState<Player | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);

  const startLobby = (names: string[], rules: GameRules) => {
    const created = names.map((name, index) =>
      createPlayer(name, index !== names.length - 1)
    );
    const youPlayer = created[created.length - 1];
    const updated = created.map((p) =>
      p.id === youPlayer.id ? p : { ...p, status: 'ready' }
    );

    setPlayers(updated);
    setYou(youPlayer);

    setGameState({
      players: updated,
      deck: [],
      discardPile: [],
      trumpSuit: '♠', // временно, переопределится в startGame
      currentAttackerIndex: 0,
      currentDefenderIndex: 1,
      status: 'waiting',
      rules,
    });
  };

  const markReady = (id: number) => {
    setPlayers((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: 'ready' } : p))
    );
  };

  const startGame = () => {
    if (!gameState) return;

    const { rules } = gameState;
    const deck = createDeck(rules.cardCount === 52 ? '52' : '36');
    const trumpCard = deck[deck.length - 1];
    const trumpSuit = trumpCard.suit;

    const handSize = getInitialHandSize();
    const { updatedPlayers, updatedDeck } = giveCards(players, deck, handSize);

    const attackerIndex = findFirstAttacker(updatedPlayers, trumpSuit);
    const defenderIndex = (attackerIndex + 1) % updatedPlayers.length;

    setPlayers(updatedPlayers);
    setGameState({
      ...gameState,
      players: updatedPlayers,
      deck: updatedDeck,
      discardPile: [],
      trumpSuit,
      currentAttackerIndex: attackerIndex,
      currentDefenderIndex: defenderIndex,
      status: 'in_progress',
      rules,
    });
  };

  return {
    players,
    you,
    gameState,
    startLobby,
    markReady,
    startGame, // важно добавить
  };
}
