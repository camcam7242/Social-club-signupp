import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import * as SecureStore from 'expo-secure-store';

interface SocketState {
  socket: Socket | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  joinRequest: (requestId: string) => void;
  joinJob: (jobId: string) => void;
}

const WS_URL = process.env.EXPO_PUBLIC_WS_URL || 'http://localhost:3000';

export const useSocketStore = create<SocketState>((set, get) => ({
  socket: null,

  connect: async () => {
    const token = await SecureStore.getItemAsync('accessToken');
    if (!token) return;

    const socket = io(WS_URL, {
      auth: { token },
      transports: ['websocket'],
    });

    socket.on('connect', () => console.log('Socket connected'));
    socket.on('disconnect', () => console.log('Socket disconnected'));

    set({ socket });
  },

  disconnect: () => {
    get().socket?.disconnect();
    set({ socket: null });
  },

  joinRequest: (requestId) => get().socket?.emit('join_request', requestId),
  joinJob: (jobId) => get().socket?.emit('join_job', jobId),
}));
