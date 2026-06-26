import { Server } from 'socket.io';
import http from 'http';
import jwt from 'jsonwebtoken';
import { AuthPayload } from '../types';

let io: Server;

export const initSocket = (server: http.Server) => {
  io = new Server(server, {
    cors: { origin: process.env.FRONTEND_URL, credentials: true },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Unauthorized'));
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET!) as AuthPayload;
      (socket as any).user = payload;
      next();
    } catch {
      next(new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    const user = (socket as any).user as AuthPayload;

    // Join personal room
    socket.join(`user:${user.userId}`);

    if (user.role === 'mechanic') {
      socket.join('mechanics');
    }

    socket.on('join_request', (requestId: string) => {
      socket.join(`request:${requestId}`);
    });

    socket.on('join_job', (jobId: string) => {
      socket.join(`job:${jobId}`);
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = (): Server => {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
};
