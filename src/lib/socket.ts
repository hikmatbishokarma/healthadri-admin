import { io, Socket } from 'socket.io-client';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

let socket: Socket | null = null;

export function connectNavigatorSocket(navigatorId: string): Socket {
  if (socket?.connected) return socket;

  socket = io(`${BASE_URL}/navigator`, {
    query: { navigatorId },
    transports: ['websocket'],
    autoConnect: true,
  });

  socket.on('connect', () => {
    socket?.emit('join', { navigatorId });
  });

  return socket;
}

export function disconnectNavigatorSocket() {
  socket?.disconnect();
  socket = null;
}

export function getSocket(): Socket | null {
  return socket;
}
