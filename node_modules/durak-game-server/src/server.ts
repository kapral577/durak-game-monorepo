import { TelegramAuth } from './auth/TelegramAuth'
import WebSocket from 'ws';
import http from 'http';
import { RoomManager } from './logic/RoomManager';

interface AuthenticatedClient {
  socket: WebSocket;
  telegramUser: any;
  authToken: string;
  playerId: string;
  lastHeartbeat: Date;
}

interface VerifyClientInfo {
  origin?: string;
  secure: boolean;
  req: any;
}

// ===== ТИПЫ ДЛЯ API ОТВЕТОВ =====
interface ValidationResponse {
  valid: boolean;
  user?: any;
  error?: string;
}

interface LoginResponse {
  success: boolean;
  token?: string;
  player?: any;
  error?: string;
}

class DurakGameServer {
  private server: http.Server;
  private wss: WebSocket.Server;
  private roomManager: RoomManager;
  private authenticatedClients = new Map<WebSocket, AuthenticatedClient>();
  private port: number;
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.port = parseInt(process.env.PORT || '3001');
    
    // HTTP СЕРВЕР С ПРАВИЛЬНЫМИ ЭНДПОИНТАМИ
    this.server = http.createServer((req, res) => {
      // CORS заголовки для всех запросов
       res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Telegram-Init-Data');
  
console.log(`🔍 ${req.method} ${req.url}`);
 
  if (req.url?.includes('/auth/validate-telegram')) {
    console.log('✅ Validation endpoint detected');
  }
      // Обработка preflight OPTIONS запросов
      if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
      }

      // ✅ ИСПРАВЛЕНО: /auth/validate-telegram
      if (req.method === 'POST' && req.url === '/auth/validate-telegram') {
        this.handleValidateTelegramAuth(req, res);
        return;
      }

      // ✅ ДОБАВЛЕНО: /auth/login
      if (req.method === 'POST' && req.url === '/auth/login') {
        this.handleLoginAuth(req, res);
        return;
      }

      // Статус сервера
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: 'Durak Game Server is running',
        timestamp: new Date().toISOString(),
        connectedClients: this.authenticatedClients.size,
        serverUptime: process.uptime()
      }));
    });

    this.wss = new WebSocket.Server({ 
      server: this.server,
      verifyClient: (info: VerifyClientInfo) => {
        const allowedOrigins = [
          process.env.FRONTEND_URL,
          'https://durakapp.vercel.app',
          'https://durakapp-nyph.vercel.app',
          'https://web.telegram.org',
          'https://telegram.org',
          'localhost:3000'
        ].filter(Boolean);
        
        const origin = info.origin;
        console.log('🔍 WebSocket connection from origin:', origin);
        
        if (!origin) return true;
        
        return allowedOrigins.some(allowed => 
          allowed && origin.includes(allowed.replace('https://', ''))
        );
      }
    });
    
    this.roomManager = new RoomManager();
    this.setupServer();
    
    console.log(`🚀 Durak Game Server running on port ${this.port}`);
    console.log(`📱 Frontend URL: ${process.env.FRONTEND_URL || 'Not set'}`);
    console.log(`🤖 Bot Token: ${process.env.TELEGRAM_BOT_TOKEN ? '✅ Set' : '❌ Missing'}`);
  }

  // ✅ ИСПРАВЛЕНО: /auth/validate-telegram
  private handleValidateTelegramAuth(req: any, res: any): void {
    console.log('🔐 POST /auth/validate-telegram');
    
    let body = '';
    req.on('data', (chunk: any) => {
      body += chunk.toString();
    });

    req.on('end', () => {
      try {
        const { initData } = JSON.parse(body);
        console.log('📄 Validating initData:', { initDataLength: initData?.length || 0 });

        if (!initData) {
          const response: ValidationResponse = {
            valid: false,
            error: 'Missing initData'
          };
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(response));
          return;
        }

        // ✅ ИСПОЛЬЗУЕМ КЛАСС TelegramAuth ДЛЯ ВАЛИДАЦИИ
        const clientIP = req.connection.remoteAddress || req.socket.remoteAddress;
        const telegramUser = TelegramAuth.validateInitData(initData, clientIP);

        if (telegramUser) {
          // Создаем объект Player для фронтенда
          const player = {
            id: `tg_${telegramUser.id}`,
            name: telegramUser.first_name + (telegramUser.last_name ? ` ${telegramUser.last_name}` : ''),
            telegramId: telegramUser.id,
            username: telegramUser.username,
            avatar: telegramUser.photo_url,
            isReady: false
          };

          const response: ValidationResponse = {
            valid: true,
            user: player
          };

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(response));
          
          console.log(`✅ Validation successful: ${telegramUser.first_name} (${telegramUser.id})`);
        } else {
          const response: ValidationResponse = {
            valid: false,
            error: 'Invalid Telegram data'
          };

          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(response));
          
          console.log('❌ Validation failed');
        }

      } catch (error) {
        console.error('❌ Validation error:', error);
        
        const response: ValidationResponse = {
          valid: false,
          error: 'Server validation error'
        };

        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(response));
      }
    });
  }

  // ✅ ИСПРАВЛЕНО: /auth/login теперь возвращает единообразный формат
  private handleLoginAuth(req: any, res: any): void {
    console.log('🔐 POST /auth/login');
    
    let body = '';
    req.on('data', (chunk: any) => {
      body += chunk.toString();
    });

    req.on('end', () => {
      try {
        const { initData, telegramUser } = JSON.parse(body);
        console.log('📄 Login attempt:', { 
          userExists: !!telegramUser, 
          initDataLength: initData?.length || 0 
        });

        // Development режим с прямым пользователем
        if (process.env.NODE_ENV === 'development' && telegramUser && !initData) {
          console.log('🧪 Direct user login (development mode)');
          
          const authToken = TelegramAuth.generateAuthToken(telegramUser);
          const player = {
            id: `tg_${telegramUser.id}`,
            name: telegramUser.first_name + (telegramUser.last_name ? ` ${telegramUser.last_name}` : ''),
            telegramId: telegramUser.id,
            username: telegramUser.username,
            avatar: telegramUser.photo_url,
            isReady: false
          };

          // ✅ ИСПОЛЬЗУЕМ ValidationResponse формат для единообразия
          const response: ValidationResponse = {
            valid: true,
            user: {
              ...player,
              token: authToken // Добавляем токен в user объект
            }
          };

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(response));
          return;
        }

        // Валидация через initData (основной способ)
        if (!initData) {
          const response: ValidationResponse = {
            valid: false,
            error: 'Missing authentication data'
          };
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(response));
          return;
        }

        const clientIP = req.connection.remoteAddress || req.socket.remoteAddress;
        const validatedUser = TelegramAuth.validateInitData(initData, clientIP);

        if (!validatedUser) {
          const response: ValidationResponse = {
            valid: false,
            error: 'Invalid Telegram authentication'
          };
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(response));
          return;
        }

        // ✅ ГЕНЕРИРУЕМ JWT ТОКЕН
        const authToken = TelegramAuth.generateAuthToken(validatedUser);
        const player = {
          id: `tg_${validatedUser.id}`,
          name: validatedUser.first_name + (validatedUser.last_name ? ` ${validatedUser.last_name}` : ''),
          telegramId: validatedUser.id,
          username: validatedUser.username,
          avatar: validatedUser.photo_url,
          isReady: false
        };

        // ✅ ИСПОЛЬЗУЕМ ValidationResponse формат для единообразия
        const response: ValidationResponse = {
          valid: true,
          user: {
            ...player,
            token: authToken // Добавляем токен в user объект
          }
        };

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(response));

        console.log(`✅ Login successful: ${validatedUser.first_name} (${validatedUser.id})`);

      } catch (error) {
        console.error('❌ Login error:', error);
        
        const response: ValidationResponse = {
          valid: false,
          error: 'Internal server error'
        };

        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(response));
      }
    });
  }

  private setupServer(): void {
    this.wss.on('connection', this.handleConnection.bind(this));
    
    // Heartbeat каждые 60 секунд
    this.heartbeatInterval = setInterval(() => {
      console.log(`💓 Heartbeat check: ${this.authenticatedClients.size} clients`);
      
      this.authenticatedClients.forEach((client, socket) => {
        if (socket.readyState === WebSocket.OPEN) {
          const timeSinceLastHeartbeat = Date.now() - client.lastHeartbeat.getTime();
          
          if (timeSinceLastHeartbeat > 120000) { // 2 минуты без heartbeat
            console.log(`⏰ Client ${client.telegramUser.first_name} heartbeat timeout, disconnecting`);
            socket.close(4000, 'Heartbeat timeout');
          } else {
            socket.ping();
          }
        } else {
          console.log(`🔌 Removing dead socket for ${client.telegramUser.first_name}`);
          this.handleDisconnection(socket);
        }
      });
    }, 60000);

    this.server.listen(this.port, () => {
      console.log(`✅ HTTP + WebSocket server listening on port ${this.port}`);
    });

    // Graceful shutdown
    process.on('SIGTERM', this.shutdown.bind(this));
    process.on('SIGINT', this.shutdown.bind(this));
  }

  private handleConnection(socket: WebSocket): void {
    console.log('🔌 New WebSocket connection attempt');
    
    const authTimeout = setTimeout(() => {
      console.log('⏰ WebSocket authentication timeout');
      socket.close(4001, 'Authentication timeout');
    }, 15000);

    socket.on('message', (data: WebSocket.Data) => {
      try {
        const message = JSON.parse(data.toString());
        
        if (message.type === 'authenticate') {
          clearTimeout(authTimeout);
          this.handleAuthentication(socket, message);
        } else {
          const client = this.authenticatedClients.get(socket);
          if (!client) {
            socket.send(JSON.stringify({ 
              type: 'error', 
              message: 'Authentication required' 
            }));
            return;
          }
          
          client.lastHeartbeat = new Date();
          this.handleAuthenticatedMessage(client, message);
        }
      } catch (error) {
        console.error('❌ WebSocket message parsing error:', error);
        socket.send(JSON.stringify({ 
          type: 'error', 
          message: 'Invalid message format' 
        }));
      }
    });

    socket.on('close', (code: number, reason: Buffer) => {
      clearTimeout(authTimeout);
      this.handleDisconnection(socket);
      console.log(`🔌 WebSocket connection closed: ${code} ${reason.toString()}`);
    });

    socket.on('error', (error: Error) => {
      console.error('❌ WebSocket error:', error);
      this.handleDisconnection(socket);
    });

    socket.on('pong', () => {
      const client = this.authenticatedClients.get(socket);
      if (client) {
        client.lastHeartbeat = new Date();
        console.log(`💓 Pong received from ${client.telegramUser.first_name}`);
      }
    });
  }

  private handleAuthentication(socket: WebSocket, message: any): void {
    console.log('🔐 WebSocket authentication attempt');
    
    // ✅ ИСПОЛЬЗУЕМ TelegramAuth ДЛЯ WEBSOCKET АУТЕНТИФИКАЦИИ
    const { initData, telegramUser } = message;
    
    // Development режим с прямым пользователем
    if (process.env.NODE_ENV === 'development' && telegramUser?.id < 1000000) {
      console.log('🧪 Development mode: accepting test user via WebSocket');
      this.createAuthenticatedClient(socket, telegramUser, 'dev_token');
      return;
    }

    // Валидация через initData
    if (initData) {
      const validatedUser = TelegramAuth.validateInitData(initData);
      if (validatedUser) {
        const authToken = TelegramAuth.generateAuthToken(validatedUser);
        this.createAuthenticatedClient(socket, validatedUser, authToken);
        return;
      }
    }

    // Fallback на telegramUser (для совместимости)
    if (telegramUser) {
      const authToken = TelegramAuth.generateAuthToken(telegramUser);
      this.createAuthenticatedClient(socket, telegramUser, authToken);
      return;
    }

    console.log('❌ Invalid WebSocket authentication');
    socket.send(JSON.stringify({ 
      type: 'error', 
      message: 'Invalid authentication' 
    }));
    socket.close(4002, 'Authentication failed');
  }

  private createAuthenticatedClient(socket: WebSocket, telegramUser: any, authToken: string): void {
    const playerId = `tg_${telegramUser.id}`;
    
    const client: AuthenticatedClient = {
      socket,
      telegramUser,
      authToken,
      playerId,
      lastHeartbeat: new Date()
    };

    this.authenticatedClients.set(socket, client);

    socket.send(JSON.stringify({ 
      type: 'authenticated', 
      player: {
        id: playerId,
        name: telegramUser.first_name + (telegramUser.last_name ? ` ${telegramUser.last_name}` : ''),
        telegramId: telegramUser.id,
        username: telegramUser.username,
        avatar: telegramUser.photo_url,
        isReady: false
      },
      token: authToken
    }));

    console.log(`✅ WebSocket user authenticated: ${telegramUser.first_name} (${telegramUser.id})`);
    
    this.roomManager.sendRoomsList(socket);
  }

  private handleAuthenticatedMessage(client: AuthenticatedClient, message: any): void {
    console.log(`📨 Message from ${client.telegramUser.first_name}: ${message.type}`);
    
    if (message.type === 'heartbeat') {
      client.lastHeartbeat = new Date();
      client.socket.send(JSON.stringify({
        type: 'heartbeat_response',
        timestamp: Date.now()
      }));
      return;
    }
    
    const enrichedMessage = {
      ...message,
      playerId: client.playerId,
      telegramUser: client.telegramUser
    };

    this.roomManager.handleMessage(client.socket, enrichedMessage);
  }

  private handleDisconnection(socket: WebSocket): void {
    const client = this.authenticatedClients.get(socket);
    if (client) {
      console.log(`❌ User disconnected: ${client.telegramUser.first_name} (${client.playerId})`);
      
      this.roomManager.handleDisconnection(socket);
      this.authenticatedClients.delete(socket);
      
      console.log(`📊 Remaining clients: ${this.authenticatedClients.size}`);
    }
  }

  private shutdown(): void {
    console.log('🛑 Shutting down server...');
    
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    
    this.wss.close(() => {
      this.server.close(() => {
        console.log('✅ Server shut down gracefully');
        process.exit(0);
      });
    });
  }

  getServerStats(): any {
    return {
      connectedClients: this.authenticatedClients.size,
      totalConnections: this.wss.clients.size,
      serverUptime: process.uptime(),
      ...this.roomManager.getStats()
    };
  }
}

// Запуск сервера
new DurakGameServer();