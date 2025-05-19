import { useState } from "react";
import { createDeck } from "../engine/deck";
import { createPlayer, giveCards } from "../engine/player";
import { Player } from "../engine/types";

export type GamePhase = 'waiting' | 'dealing' | 'playing' | 'finished';

interface GameState {
  phase: GamePhase;
  players: Player[];
  table: any[];
  trumpSuit: string | null;
  currentAttackerIndex: number;
}

export function useGameEngine() {
  const [gameState, setGameState] = useState<GameState>({
    phase: 'waiting',
    players: [],
    table: [],
    trumpSuit: null,
    currentAttackerIndex: 0,
  });

  function startGame(playerCount: number) {
    const deck = createDeck();
    const newPlayers = Array.from({ length: playerCount }, (_, i) =>
      createPlayer(`player-${i + 1}`, `Игрок ${i + 1}`)
    );
    giveCards(newPlayers, deck);

    const trumpCard = deck[deck.length - 1];
    const trumpSuit = trumpCard.suit;

    setGameState({
      phase: 'playing',
      players: newPlayers,
      table: [],
      trumpSuit,
      currentAttackerIndex: 0,
    });
  }

  function setPhase(phase: GamePhase) {
    setGameState((prev) => ({ ...prev, phase }));
  }

  return {
    gameState,
    startGame,
    setPhase,
  };
}
