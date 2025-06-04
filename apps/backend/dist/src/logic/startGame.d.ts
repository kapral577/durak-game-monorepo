import { GameState, Player, GameRules } from '@shared/types';
export interface StartGameInput {
    roomId: string;
    rules: GameRules;
    players: Player[];
}
export declare function startGame(input: StartGameInput): GameState;
//# sourceMappingURL=startGame.d.ts.map