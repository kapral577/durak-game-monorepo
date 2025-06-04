export { Card, Player, GameState, GameRules, TableCard, GameAction, AutoStartInfo } from '@shared/types';
import { GameState as BaseGameState } from '@shared/types';
export interface ServerGameState extends BaseGameState {
    internalData?: any;
}
//# sourceMappingURL=GameState.d.ts.map