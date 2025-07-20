const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
require('dotenv').config();

const logger = require('./logger');
const { initializeSocket } = require('./socketHandler');
const { userManager } = require('./userManager');

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Configure Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3002',
    methods: ['GET', 'POST'],
    credentials: true
  },
  pingTimeout: 60000, // Time a client has to pong back
  pingInterval: 25000, // Time between pings
  maxHttpBufferSize: 1e6, // 1MB
  transports: ['websocket', 'polling']
});

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3002',
  credentials: true
}));
app.use(helmet()); 
app.use(compression());
app.use(express.json({ limit: '100kb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    users: userManager.getStats(),
  });
});

// Initialize socket handling
initializeSocket(io);

// Global error handling middleware
app.use((err, req, res, next) => {
  logger.error({ err, path: req.path }, '❌ Unhandled server error');
  res.status(500).json({ error: 'Internal server error' });
});

// Server configuration
const PORT = process.env.PORT || 5000;
// const HOST = process.env.HOST || '192.168.0.10';

// Start server
server.listen(PORT, () => {
  logger.info(`🚀 Server running on http://localhost:${PORT}`);
});

// Graceful shutdown
const gracefulShutdown = (signal) => {
  logger.info(`🛑 Received ${signal}. Initiating graceful shutdown...`);
  server.close(() => {
    logger.info('✅ HTTP server closed');
    io.close(() => {
      logger.info('✅ Socket.IO connections closed');
      process.exit(0);
    });
  });

  // Force close after a timeout
  setTimeout(() => {
    logger.error('❌ Forcing shutdown due to timeout');
    process.exit(1);
  }, 10000);
};

// Handle process termination signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error, origin) => {
  logger.fatal({ error, origin }, '❌ Uncaught Exception');
  gracefulShutdown('uncaughtException');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.fatal({ reason, promise }, '❌ Unhandled Rejection');
  gracefulShutdown('unhandledRejection');
});