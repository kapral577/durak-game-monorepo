import { WebSocket } from 'ws';
import { Player } from '@shared/types';
/**
* Расширенная модель игрока, используемая только на сервере.
* Наследует данные, которые уходят клиенту, и добавляет поле
* `socket` — активное WebSocket соединение. Не передаётся в GameState.
*/
export interface ConnectedPlayer extends Player {
    socket: WebSocket;
    lastActivity: number;
    authToken?: string;
    roomId?: string;
}
//# sourceMappingURL=ConnectedPlayer.d.ts.map