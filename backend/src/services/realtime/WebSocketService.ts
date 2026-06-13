import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import logger from '../../utils/logger';

export class WebSocketService {
  private io: Server;

  constructor(httpServer: HttpServer) {
    this.io = new Server(httpServer, {
      cors: { origin: '*', methods: ['GET', 'POST'] },
      path: '/ws',
    });

    this.io.on('connection', (socket: Socket) => {
      logger.info(`WebSocket client connected: ${socket.id}`);

      socket.on('subscribe', (channel: string) => {
        socket.join(channel);
        logger.debug(`Client ${socket.id} subscribed to ${channel}`);
      });

      socket.on('unsubscribe', (channel: string) => {
        socket.leave(channel);
      });

      socket.on('disconnect', () => {
        logger.info(`WebSocket client disconnected: ${socket.id}`);
      });
    });
  }

  emitSecurityEvent(event: Record<string, unknown>): void {
    this.io.to('security-events').emit('security:event', event);
  }

  emitThreatDetection(threat: Record<string, unknown>): void {
    this.io.to('security-events').emit('security:threat', threat);
  }

  emitAlert(alert: Record<string, unknown>): void {
    this.io.to('alerts').emit('alert:new', alert);
  }

  emitSystemHealth(health: Record<string, unknown>): void {
    this.io.emit('system:health', health);
  }

  getConnectionCount(): number {
    return this.io.engine.clientsCount;
  }
}

let wsService: WebSocketService | null = null;

export function initWebSocket(httpServer: HttpServer): WebSocketService {
  wsService = new WebSocketService(httpServer);
  return wsService;
}

export function getWebSocketService(): WebSocketService | null {
  return wsService;
}
