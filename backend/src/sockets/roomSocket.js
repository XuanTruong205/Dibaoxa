import { Server } from 'socket.io';

let ioInstance = null;

export function initSocketIO(server, corsOrigin) {
  ioInstance = new Server(server, {
    cors: {
      origin: corsOrigin || '*',
      methods: ['GET', 'POST'],
    },
  });

  ioInstance.on('connection', (socket) => {
    console.log(`Client socket connected: ${socket.id}`);

    socket.on('join_room_channel', (hotelId) => {
      socket.join(`hotel_${hotelId}`);
      console.log(`Socket ${socket.id} joined channel hotel_${hotelId}.`);
    });

    socket.on('disconnect', () => {
      console.log(`Client socket disconnected: ${socket.id}`);
    });
  });

  return ioInstance;
}

export function getIO() {
  return ioInstance;
}
