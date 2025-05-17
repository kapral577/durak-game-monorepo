type Message =
  | { type: 'create_room' }
  | { type: 'join_room'; roomId: string }
  | { type: 'room_created'; roomId: string }
  | { type: 'room_joined'; roomId: string }
  | { type: 'player_count'; count: number }
  | { type: 'error'; message: string };

type Callback = (msg: Message) => void;

export class DurakSocket {
  private socket: WebSocket;
  private listeners: Callback[] = [];

  constructor(url: string) {
    this.socket = new WebSocket(url);

    this.socket.onopen = () => {
      console.log('[ws] Connected');
    };

    this.socket.onmessage = (event) => {
      const data = JSON.parse(event.data) as Message;
      this.listeners.forEach((cb) => cb(data));
    };

    this.socket.onclose = () => {
      console.log('[ws] Disconnected');
    };

    this.socket.onerror = (err) => {
      console.error('[ws] Error', err);
    };
  }

  send(msg: Message) {
    this.socket.send(JSON.stringify(msg));
  }

  onMessage(callback: Callback) {
    this.listeners.push(callback);
  }
}
