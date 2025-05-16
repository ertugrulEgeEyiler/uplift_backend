const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

let io;

function initSocket(server) {
  io = new Server(server, {
    cors: { origin: '*' },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error('Authentication error'));
      
      const decoded = jwt.verify(token, "jwt_secret_key");
      socket.userId = decoded.id;
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', socket => {
    console.log('User connected:', socket.userId);

    socket.on('join', conversationId => {
      socket.join(conversationId);
      console.log(`User ${socket.userId} joined conversation ${conversationId}`);
    });

    socket.on('leave', conversationId => {
      socket.leave(conversationId);
      console.log(`User ${socket.userId} left conversation ${conversationId}`);
    });

    socket.on('send-message', (message) => {
      console.log('New message received from client:', message);
      
      // Broadcast the message to all users in the conversation
      io.to(message.conversationId).emit('new-message', {
        ...message,
        sender: socket.userId,
        timestamp: new Date(),
        status: 'sent'
      });

      // Send delivery confirmation back to sender
      socket.emit('message-status', {
        conversationId: message.conversationId,
        status: 'delivered',
        timestamp: new Date()
      });
    });

    socket.on('message-received', (data) => {
      // When a client confirms message receipt, broadcast to sender
      io.to(data.conversationId).emit('message-status', {
        messageId: data.messageId,
        status: 'delivered',
        timestamp: new Date()
      });
    });

    socket.on('message-read', (data) => {
      // When a message is read, broadcast to all clients in conversation
      io.to(data.conversationId).emit('message-status', {
        messageId: data.messageId,
        status: 'read',
        timestamp: new Date()
      });
    });

    socket.on('typing', ({ conversationId, isTyping }) => {
      socket.to(conversationId).emit('typing', {
        userId: socket.userId,
        isTyping
      });
    });

    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    socket.on('disconnect', (reason) => {
      console.log(`User disconnected (${reason}):`, socket.userId);
    });
  });
}

module.exports = { initSocket, io };