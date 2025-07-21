const logger = require('./logger');
const { userManager } = require('./userManager');
const { validateUsername, validatePreferences, sanitizeData, rateLimiter } = require('./utils');

class SocketHandler {
  constructor(io) {
    if (!io) throw new Error('Socket.IO instance is required');
    this.io = io;
    this.connections = new Map();
    this.setupEventListeners();
  }

  setupEventListeners() {
    userManager.on('connectionCreated', ({ user1, user2 }) => {
      this.notifyConnectionCreated(user1, user2);
    });

    userManager.on('connectionEnded', ({ user, peer, reason }) => {
      this.notifyConnectionEnded(user, peer, reason);
    });
  }

  handleConnection(socket) {
    logger.info({ socketId: socket.id }, '🔌 New connection');
    this.connections.set(socket.id, { socket, connectedAt: Date.now() });

    this.setupSocketEvents(socket);

    socket.on('disconnect', (reason) => {
      this.handleDisconnection(socket, reason);
    });

    socket.on('error', (error) => {
      this.handleSocketError(socket, error);
    });
  }

  setupSocketEvents(socket) {
    const rateLimited = (eventName, handler, limit, windowMs) => {
      return (...args) => {
        if (!rateLimiter.isAllowed(socket.id, eventName, limit, windowMs)) {
          logger.warn({ socketId: socket.id, event: eventName }, 'Rate limit exceeded');
          socket.emit('error', { message: 'Rate limit exceeded', code: 'RATE_LIMIT' });
          return;
        }
        handler(...args);
      };
    };

    socket.on('join', rateLimited('join', (data) => this.handleJoin(socket, data), 3, 60000));
    socket.on('search', rateLimited('search', () => this.handleSearch(socket), 10, 60000));
    socket.on('offer', rateLimited('offer', (data) => this.handleOffer(socket, data), 20, 60000));
    socket.on('answer', rateLimited('answer', (data) => this.handleAnswer(socket, data), 20, 60000));
    socket.on('ice-candidate', rateLimited('ice-candidate', (data) => this.handleIceCandidate(socket, data), 50, 60000));
    socket.on('call-accepted', rateLimited('call-accepted', () => this.handleCallAccepted(socket), 5, 60000));
    socket.on('call-rejected', rateLimited('call-rejected', (data) => this.handleCallRejected(socket, data), 5, 60000));
    socket.on('end-call', rateLimited('end-call', () => this.handleEndCall(socket), 5, 60000));
    socket.on('next-peer', rateLimited('next-peer', () => this.handleNextPeer(socket), 3, 60000));
    socket.on('status-update', rateLimited('status-update', (data) => this.handleStatusUpdate(socket, data), 10, 60000));
    socket.on('report-user', rateLimited('report-user', (data) => this.handleReportUser(socket, data), 2, 3600000));
  }

  handleJoin(socket, data) {
    try {
      if (!data || !data.username) {
        return socket.emit('join-error', { message: 'Username is required' });
      }

      const validationResult = validateUsername(data.username);
      if (!validationResult.valid) {
        return socket.emit('join-error', { message: validationResult.message });
      }

      const sanitizedData = {
        ...sanitizeData(data),
        username: validationResult.username,
        preferences: validatePreferences(data.preferences || {}),
      };

      const user = userManager.addUser(socket.id, sanitizedData);
      socket.emit('join-success', { user: { id: user.id, username: user.username, status: user.status, preferences: user.preferences } });

      logger.info({ username: user.username, socketId: socket.id }, '✅ User joined');
    } catch (error) {
      logger.error({ err: error, socketId: socket.id }, '❌ Error in handleJoin');
      socket.emit('join-error', { message: 'Internal server error. Please try again.' });
    }
  }

  handleSearch(socket) {
    try {
      const success = userManager.startSearching(socket.id);
      if (success) {
        socket.emit('search-started');
        this.sendQueueStatus(socket);
      } else {
        socket.emit('search-error', { message: 'Cannot start search. You may be temporarily blocked.' });
      }
    } catch (error) {
      logger.error({ err: error, socketId: socket.id }, '❌ Error in handleSearch');
      socket.emit('search-error', { message: 'Search failed due to an internal error' });
    }
  }

  handleOffer(socket, { offer, to }) {
    if (!this.validatePeerConnection(socket.id, to)) return;
    const user = userManager.getUser(socket.id);
    if (!user) return;

    socket.to(to).emit('offer', {
      offer,
      from: socket.id,
      fromUsername: user.username,
    });
  }

  handleAnswer(socket, { answer, to }) {
    if (!this.validatePeerConnection(socket.id, to)) return;
    socket.to(to).emit('answer', {
      answer,
      from: socket.id,
    });
  }

  handleCallAccepted(socket) {
    const user = userManager.getUser(socket.id);
    if (!user || !user.peerId) return;

    userManager.activateConnection(socket.id);
    socket.to(user.peerId).emit('call-accepted');
  }

  handleIceCandidate(socket, { candidate, to }) {
    if (!this.validatePeerConnection(socket.id, to)) return;
    socket.to(to).emit('ice-candidate', {
      candidate,
      from: socket.id,
    });
  }

  handleCallRejected(socket, data) {
    const user = userManager.getUser(socket.id);
    if (user && user.peerId) {
      socket.to(user.peerId).emit('call-rejected', {
        from: socket.id,
        reason: data.reason || 'Call rejected by peer',
      });
      userManager.endConnection(socket.id, 'call_rejected');
      userManager.startSearching(user.peerId);
    }
  }

  handleEndCall(socket) {
    userManager.endConnection(socket.id, 'user_ended');
  }

  handleNextPeer(socket) {
    userManager.endConnection(socket.id, 'next_peer');
    setTimeout(() => {
      const success = userManager.startSearching(socket.id);
      if (success) this.sendQueueStatus(socket);
    }, 1000);
  }

  handleStatusUpdate(socket, data) {
    userManager.updateUserStatus(socket.id, data.status);
  }

  handleReportUser(socket, { reportedUserId, reason }) {
    const reporter = userManager.getUser(socket.id);
    const reported = userManager.getUser(reportedUserId);
    if (reporter && reported && reason) {
      logger.warn({ reporter: reporter.username, reported: reported.username, reason }, '🚨 User Report');
      socket.emit('report-submitted', { message: 'Report submitted successfully. Thank you.' });
    } else {
      socket.emit('report-error', { message: 'Invalid report data' });
    }
  }

  handleDisconnection(socket, reason) {
    logger.info({ socketId: socket.id, reason }, '🔌 User disconnected');
    userManager.removeUser(socket.id);
    this.connections.delete(socket.id);
  }

  handleSocketError(socket, error) {
    logger.error({ err: error, socketId: socket.id }, '❌ Socket-level error');
  }

  validatePeerConnection(fromId, toId) {
    if (!fromId || !toId) return false;
    const fromUser = userManager.getUser(fromId);
    if (!fromUser || fromUser.peerId !== toId) {
      logger.warn({ fromId, toId, peerId: fromUser?.peerId }, '⚠️ Unauthorized peer communication attempt');
      return false;
    }
    return true;
  }

  notifyConnectionCreated(user1, user2) {
    const peerData1 = { peerId: user2.id, peerUsername: user2.username };
    const peerData2 = { peerId: user1.id, peerUsername: user1.username };

    this.io.to(user1.id).emit('peer-found', peerData1);
    this.io.to(user2.id).emit('peer-found', peerData2);
  }

  notifyConnectionEnded(user, peer, reason) {
    const reasons = {
      user_ended: 'You ended the call.',
      user_disconnected: 'Your peer disconnected.',
      next_peer: 'Searching for next peer.',
      connection_timeout: 'Connection timed out.',
      call_rejected: 'Call was rejected by peer.',
      search_timeout: 'Search timed out.',
    };

    if (user) {
      this.io.to(user.id).emit('call-ended', { reason: reasons[reason] || 'Call ended' });
    }
    if (peer) {
      const peerReason = (reason === 'user_ended' || reason === 'next_peer')
        ? 'Your peer ended the call.'
        : reasons[reason] || 'Call ended';
      this.io.to(peer.id).emit('call-ended', { reason: peerReason });
    }
  }

  sendQueueStatus(socket) {
    const stats = userManager.getStats();
    socket.emit('queue-status', {
      position: stats.usersSearching,
      estimatedWait: stats.usersSearching * 2, // Rough estimate: 2s per user in queue
      activeUsers: stats.totalUsers,
    });
  }
}

let socketHandlerInstance;

const initializeSocket = (io) => {
  if (!io) throw new Error('Socket.IO instance is required');
  if (!socketHandlerInstance) {
    socketHandlerInstance = new SocketHandler(io);
    io.on('connection', (socket) => socketHandlerInstance.handleConnection(socket));
  }
  return socketHandlerInstance;
};

module.exports = { initializeSocket };