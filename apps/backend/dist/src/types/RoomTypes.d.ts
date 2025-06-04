import { Player } from './GameState';
export interface Rules {
    gameMode: 'classic' | 'transferable' | 'smart';
    throwingMode: 'none' | 'all' | 'neighbors';
    cardCount: 6 | 8 | 10;
    maxPlayers: number;
}
export interface RoomInfo {
    id: string;
    name: string;
    players: Player[];
    maxPlayers: number;
    rules: Rules;
    status: 'waiting' | 'playing' | 'finished';
    createdAt: string;
}
//# sourceMappingURL=RoomTypes.d.ts.map