import dotenv from 'dotenv';
dotenv.config();
import { parse, validate } from '@telegram-apps/init-data-node';
import { AuthSuccessResponse, AuthErrorResponse, TelegramUser, Player } from './types/AuthTypes';
import { TelegramAuth } from './auth/TelegramAuth'
import WebSocket from 'ws';
import http from 'http';
import { RoomManager } from './logic/RoomManager';
import { authenticateTelegram } from './controllers/authController';

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

class DurakGameServer {
  private server: http.Server;
  private wss: WebSocket.Server;
  private roomManager: RoomManager;
  private authenticatedClients = new Map<WebSocket, AuthenticatedClient>();
  private port: number;
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.port = parseInt(process.env.PORT || '3001');
    
    this.server = http.createServer((req, res) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Telegram-Init-Data');
      res.setHeader('Access-Control-Max-Age', '86400');
      console.log(`🔍 ${req.method} ${req.url}`);
      

      // Обработка preflight OPTIONS запросов
      if (req.method === 'OPTIONS') {
        console.log('🔧 OPTIONS preflight request handled');
          res.writeHead(200);
          res.end();
          return;
        }  
  
        // Telegram авторизация
  if (req.url?.includes('/auth/telegram') && req.method === 'POST') {
    console.log('✅ Telegram auth endpoint detected');
    this.handleTelegramAuth(req, res);
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


  private async handleTelegramAuth(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
    try {
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });

      req.on('end', async () => {
        try {
          const { initData } = JSON.parse(body);
          console.log('🔍 Raw request body:', body);
          console.log('🔍 Parsed JSON keys:', Object.keys(JSON.parse(body)));
          console.log('🔍 initData exists after parse:', !!initData);
          console.log('🔍 initData type:', typeof initData);
          console.log('🔍 initData length:', initData?.length);
          console.log('🔍 Body contains initData string:', body.includes('initData'));

          // Development mode проверка
          if (process.env.NODE_ENV === 'development' && body.includes('"id":')) {
            console.log('🧪 Development mode: accepting test login data');
            const testUser = JSON.parse(body);
            
            const player: Player = {
              id: `tg_${testUser.id}`,
              name: testUser.first_name + (testUser.last_name ? ` ${testUser.last_name}` : ''),
              telegramId: testUser.id,
              username: testUser.username,
              avatar: testUser.photo_url,
              isReady: false
            };

            const authToken = TelegramAuth.generateAuthToken(testUser);
            const response: AuthSuccessResponse = {
              success: true,
              token: authToken,
              sessionId: `session_${testUser.id}_${Date.now()}`,
              user: player,
              expiresAt: Date.now() + (24 * 60 * 60 * 1000)
            };

            res.writeHead(200, { 
             'Content-Type': 'application/json',
             'Access-Control-Allow-Origin': '*'
           });
          res.end(JSON.stringify(response));  
          return;
          }

          // Production: валидация через initData с официальным пакетом
          if (!initData) {
            const response: AuthErrorResponse = {
              success: false,
              error: 'Missing authentication data',
              code: 400
            };
            res.writeHead(400, { 
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            });
            res.end(JSON.stringify(response));
            return;
            } 

          const botToken = process.env.TELEGRAM_BOT_TOKEN;
          if (!botToken) {
            const response: AuthErrorResponse = {
              success: false,
              error: 'Server configuration error',
              code: 500
            };
            res.writeHead(500, {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            });
            res.end(JSON.stringify(response));
            return;
          }

          try {
            // Официальная валидация
            validate(initData, botToken);
            const initDataParsed = parse(initData);
            const validatedUser = initDataParsed.user;
            if (!validatedUser) {
              const response: AuthErrorResponse = {
                success: false,
                error: 'User data not found in Telegram initData',
                code: 400
              };
              res.writeHead(400, { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
              });  
              res.end(JSON.stringify(response)); 
              return;
            }     

            const authToken = TelegramAuth.generateAuthToken(validatedUser);
            const player: Player = {
              id: `tg_${validatedUser.id}`,
              name: validatedUser.first_name + (validatedUser.last_name ? ` ${validatedUser.last_name}` : ''),
              telegramId: validatedUser.id,
              username: validatedUser.username,
              avatar: validatedUser.photo_url,
              isReady: false
            };

            const response: AuthSuccessResponse = {
              success: true,
              token: authToken,
              sessionId: `session_${validatedUser.id}_${Date.now()}`,
              user: player,
              expiresAt: Date.now() + (24 * 60 * 60 * 1000)
            };

            res.writeHead(200, { 
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            });  
            res.end(JSON.stringify(response));

            console.log(`✅ Login successful: ${validatedUser.first_name} (${validatedUser.id})`);

          } catch (validationError) {
            console.log('❌ Telegram validation failed:', validationError);
            const response: AuthErrorResponse = {
              success: false,
              error: 'Invalid Telegram authentication',
              code: 401
            };
            res.writeHead(401, {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            });
            res.end(JSON.stringify(response));
          }

        } catch (parseError) {
          console.error('❌ JSON parsing error:', parseError);
          const response: AuthErrorResponse = {
            success: false,
            error: 'Invalid request format',
            code: 400
          };
          res.writeHead(400, {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          });
          res.end(JSON.stringify(response));
        }
      });

    } catch (error) {
      console.error('❌ Login error:', error);
      
      const response: AuthErrorResponse = {
        success: false,
        error: 'Internal server error',
        code: 500
      };

      res.writeHead(500, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify(response));
    }
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
    
    const { initData, telegramUser } = message;
    
    // Development режим с прямым пользователем
    if (process.env.NODE_ENV === 'development' && telegramUser?.id < 1000000) {
      console.log('🧪 Development mode: accepting test user via WebSocket');
      this.createAuthenticatedClient(socket, telegramUser, 'dev_token');
      return;
    }

    // Валидация через initData
    if (initData) {
      const initDataParsed = parse(initData);
      const telegramUser = initDataParsed.user;

      if (!telegramUser) {
         throw new Error('User data not found in initData');
      
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