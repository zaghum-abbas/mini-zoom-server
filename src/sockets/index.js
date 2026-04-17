const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const env = require('../config/env');

let io;

const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: env.clientUrl,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      if (!token) {
        return next(new Error('Unauthorized'));
      }
      jwt.verify(token, env.jwtSecret);
      return next();
    } catch {
      return next(new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    socket.on('meeting:subscribe', (meetingId) => {
      if (!meetingId || typeof meetingId !== 'string') return;
      socket.join(`meeting:${meetingId}`);
    });

    socket.on('meeting:unsubscribe', (meetingId) => {
      if (!meetingId) return;
      socket.leave(`meeting:${meetingId}`);
    });
  });

  return io;
};

const getIo = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

const emitMeetingEvent = (meetingId, event, payload) => {
  if (!io) return;
  io.to(`meeting:${meetingId}`).emit(event, payload);
};

module.exports = { initSocket, getIo, emitMeetingEvent };
