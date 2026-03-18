import { Server } from 'socket.io';
import { logger } from '../config/bootstrap.js';
class SocketService {
    io = null;
    init(httpServer) {
        this.io = new Server(httpServer, {
            cors: {
                origin: "*", // Allow all for now, lock down in prod
                methods: ["GET", "POST"]
            }
        });
        this.io.on('connection', (socket) => {
            logger.info(`[Socket] New connection: ${socket.id}`);
            socket.on('join_app', (appId) => {
                logger.debug(`[Socket] ${socket.id} joining room: app_${appId}`);
                socket.join(`app_${appId}`);
            });
            socket.on('leave_app', (appId) => {
                logger.debug(`[Socket] ${socket.id} leaving room: app_${appId}`);
                socket.leave(`app_${appId}`);
            });
            socket.on('disconnect', () => {
                logger.debug(`[Socket] Disconnected: ${socket.id}`);
            });
        });
        logger.info('[Socket] Socket.io initialized');
    }
    emitToApp(appId, event, data) {
        if (this.io) {
            this.io.to(`app_${appId}`).emit(event, data);
        }
        else {
            logger.warn('[Socket] Attempted to emit but IO not initialized');
        }
    }
}
export const socketService = new SocketService();
