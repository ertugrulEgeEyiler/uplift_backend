const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const Message = require('./models/Message');

let io;

function initSocket(server) {  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
      allowedHeaders: ["Content-Type", "Authorization"],
      credentials: true
    },
    pingTimeout: 60000,
    pingInterval: 25000,
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000
  });
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        console.log('Socket authentication failed: No token provided');
        return next(new Error('Authentication error: No token provided'));
      }
      
      const decoded = jwt.verify(token, "jwt_secret_key");
      if (!decoded || !decoded.id) {
        console.log('Socket authentication failed: Invalid token');
        return next(new Error('Authentication error: Invalid token'));
      }

      socket.userId = decoded.id;
      console.log('Socket authenticated for user:', decoded.id);
      next();
    } catch (err) {
      console.error('Socket authentication error:', err);
      next(new Error(`Authentication error: ${err.message}`));
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
    });    socket.on('send-message', async (message) => {
      console.log('New message received from client:', message);
      try {
        const savedMessage = await Message.create({
          conversation: message.conversationId,
          sender: socket.userId,
          text: message.text
        });

        // Broadcast the saved message to all users in the conversation
        io.to(message.conversationId).emit('new-message', {
          ...savedMessage.toObject(),
          status: 'sent'
        });

        // Send delivery confirmation back to sender
        socket.emit('message-status', {
          messageId: savedMessage._id,
          status: 'delivered'
        });

        // Debug log
        console.log('Message saved and broadcasted:', savedMessage._id);
      } catch (error) {
        console.error('Error saving message:', error);
        socket.emit('message-status', {
          messageId: message.tempId,
          status: 'error'
        });
      }
    });    socket.on('message-received', (data) => {
      console.log('Message received confirmation:', data);
      // When a client confirms message receipt, emit only to sender
      socket.to(data.conversationId).emit('message-status', {
        messageId: data.messageId,
        status: 'delivered'
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