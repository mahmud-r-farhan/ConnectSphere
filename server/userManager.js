const EventEmitter = require('events');
const logger = require('./logger');

class UserManager extends EventEmitter {
  constructor() {
    super();
    this.users = new Map();
    this.matchingQueue = new Set();
    this.connectionAttempts = new Map();

    // Cleanup routines
    setInterval(() => this.cleanupInactiveUsers(), 60 * 1000);
    setInterval(() => this.processMatchingQueue(), 2000);
  }

  addUser(socketId, userData) {
    if (this.users.has(socketId)) {
      logger.warn({ socketId }, 'Attempted to add existing user');
      return this.users.get(socketId);
    }

    const user = {
      id: socketId,
      username: userData.username,
      status: 'idle',
      peerId: null,
      joinedAt: Date.now(),
      lastActivity: Date.now(),
      preferences: userData.preferences || {},
    };

    this.users.set(socketId, user);
    logger.info({ username: user.username, socketId }, 'User added to manager');
    this.emit('userAdded', user);
    return user;
  }

  removeUser(socketId) {
    const user = this.users.get(socketId);
    if (!user) return null;

    if (user.peerId) {
      this.endConnection(socketId, 'user_disconnected');
    }

    this.matchingQueue.delete(socketId);
    this.connectionAttempts.delete(socketId);
    this.users.delete(socketId);

    logger.info({ username: user.username, socketId }, 'User removed from manager');
    this.emit('userRemoved', user);
    return user;
  }

  updateUserActivity(socketId) {
    const user = this.users.get(socketId);
    if (user) {
      user.lastActivity = Date.now();
    }
  }

  updateUserStatus(socketId, status) {
    const user = this.users.get(socketId);
    if (user && ['idle', 'searching'].includes(status)) {
      user.status = status;
      this.updateUserActivity(socketId);
    }
  }

  startSearching(socketId) {
    const user = this.users.get(socketId);
    if (!user || user.status !== 'idle') return false;

    this.updateUserActivity(socketId);

    const now = Date.now();
    const attempts = this.connectionAttempts.get(socketId) || { count: 0, firstAttempt: now };
    if (now - attempts.firstAttempt > 60000) {
      this.connectionAttempts.set(socketId, { count: 1, firstAttempt: now });
    } else {
      attempts.count++;
      if (attempts.count > 15) {
        logger.warn({ username: user.username, socketId }, 'Search spam detected');
        return false;
      }
    }

    user.status = 'searching';
    user.searchStarted = Date.now();
    this.matchingQueue.add(socketId);

    logger.info({ username: user.username, socketId }, '🔍 User started searching');
    this.emit('userSearching', user);
    return true;
  }

  processMatchingQueue() {
    if (this.matchingQueue.size < 2) return;

    const searchingUsers = Array.from(this.matchingQueue)
      .map(id => this.users.get(id))
      .filter(user => user && user.status === 'searching');

    for (let i = 0; i < searchingUsers.length - 1; i++) {
      const user1 = searchingUsers[i];
      for (let j = i + 1; j < searchingUsers.length; j++) {
        const user2 = searchingUsers[j];
        if (this.canMatch(user1, user2)) {
          this.createConnection(user1.id, user2.id);
          this.matchingQueue.delete(user1.id);
          this.matchingQueue.delete(user2.id);
          searchingUsers.splice(j, 1);
          searchingUsers.splice(i, 1);
          break;
        }
      }
    }
  }

  canMatch(user1, user2) {
    if (!user1 || !user2 || user1.id === user2.id) return false;
    if (user1.status !== 'searching' || user2.status !== 'searching') return false;

    const pref1 = user1.preferences || {};
    const pref2 = user2.preferences || {};

    if (pref1.language && pref2.language && pref1.language !== pref2.language) {
      return false;
    }

    if (pref1.interests && pref2.interests) {
      const commonInterests = pref1.interests.filter(interest => pref2.interests.includes(interest));
      return commonInterests.length > 0;
    }

    return true;
  }

  createConnection(userId1, userId2) {
    const user1 = this.users.get(userId1);
    const user2 = this.users.get(userId2);
    if (!user1 || !user2) return false;

    user1.status = 'connecting';
    user1.peerId = userId2;
    user2.status = 'connecting';
    user2.peerId = userId1;

    this.matchingQueue.delete(userId1);
    this.matchingQueue.delete(userId2);

    logger.info({ user1: user1.username, user2: user2.username }, '🔗 Connection created');
    this.emit('connectionCreated', { user1, user2 });
    return true;
  }

  activateConnection(userId) {
    const user = this.users.get(userId);
    if (user && user.status === 'connecting') {
      user.status = 'in_call';
      this.updateUserActivity(userId);
      const peer = this.users.get(user.peerId);
      if (peer && peer.status === 'in_call') {
        logger.info({ user: user.username, peer: peer.username }, '📞 Call is now active for both users');
        this.emit('callActive', { user, peer });
      }
    }
  }

  endConnection(userId, reason = 'unknown') {
    const user = this.users.get(userId);
    if (!user) return;

    const peerId = user.peerId;
    const peer = peerId ? this.users.get(peerId) : null;

    user.status = 'idle';
    user.peerId = null;
    this.updateUserActivity(userId);

    if (peer) {
      peer.status = 'idle';
      peer.peerId = null;
      this.updateUserActivity(peer.id);
    }

    logger.info({ user: user.username, peer: peer?.username, reason }, '🔚 Connection ended');
    this.emit('connectionEnded', { user, peer, reason });
  }

  cleanupInactiveUsers() {
    const now = Date.now();
    const idleTimeout = 10 * 60 * 1000; // 10 minutes
    const searchTimeout = 3 * 60 * 1000; // 3 minutes

    for (const [socketId, user] of this.users.entries()) {
      if (now - user.lastActivity > idleTimeout) {
        logger.info({ username: user.username }, '🧹 Cleaning up stale user due to inactivity');
        this.removeUser(socketId);
        continue;
      }

      if (user.status === 'searching' && (now - user.searchStarted > searchTimeout)) {
        logger.info({ username: user.username }, '🧹 Resetting stuck search');
        this.matchingQueue.delete(socketId);
        user.status = 'idle';
        this.emit('searchTimeout', { socketId, message: 'Your search timed out. Please try again.' });
      }
    }
  }

  getStats() {
    const usersInCall = Array.from(this.users.values()).reduce((count, user) => {
      return user.status === 'in_call' && user.peerId ? count + 1 : count;
    }, 0) / 2; // Divide by 2 since each call involves two users
    return {
      totalUsers: this.users.size,
      usersSearching: this.matchingQueue.size,
      usersInCall,
    };
  }

  getUser(socketId) {
    this.updateUserActivity(socketId);
    return this.users.get(socketId);
  }
}

const userManager = new UserManager();
module.exports = { userManager };