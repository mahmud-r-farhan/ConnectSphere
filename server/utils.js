const sanitizeHtml = require('sanitize-html');

const validation = {
  validateUsername(username) {
    if (!username || typeof username !== 'string') {
      return { valid: false, message: 'Username is required' };
    }
    const trimmed = username.trim();
    if (trimmed.length < 2 || trimmed.length > 20) {
      return { valid: false, message: 'Username must be 2-20 characters' };
    }
    if (!/^[a-zA-Z0-9\s._-]+$/.test(trimmed)) {
      return { valid: false, message: 'Username contains invalid characters' };
    }
    const inappropriateWords = ['admin', 'moderator', 'support', 'system'];
    if (inappropriateWords.some(word => trimmed.toLowerCase().includes(word))) {
      return { valid: false, message: 'That username is not allowed' };
    }
    return { valid: true, username: trimmed };
  },

  validatePreferences(preferences) {
    if (!preferences || typeof preferences !== 'object') {
      return {};
    }
    const validPreferences = {};
    if (preferences.language && typeof preferences.language === 'string') {
      validPreferences.language = preferences.language.toLowerCase().substring(0, 5);
    }
    if (Array.isArray(preferences.interests)) {
      validPreferences.interests = preferences.interests
        .map(interest => typeof interest === 'string' ? interest.trim().toLowerCase() : '')
        .filter(interest => interest && interest.length <= 20)
        .slice(0, 5); // Max 5 interests
    }
    return validPreferences;
  }
};

const sanitizeData = (data) => {
    if (typeof data !== 'object' || data === null) return data;
    
    const sanitized = {};
    for (const [key, value] of Object.entries(data)) {
        if (typeof value === 'string') {
            sanitized[key] = sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} });
        } else if (typeof value === 'object') {
            sanitized[key] = sanitizeData(value);
        } else {
            sanitized[key] = value;
        }
    }
    return sanitized;
};

class RateLimiter {
  constructor() {
    this.requests = new Map();
    this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000); // Clean every 5 minutes
  }

  isAllowed(clientId, action, limit = 10, windowMs = 60000) {
    const key = `${clientId}:${action}`;
    const now = Date.now();
    
    const record = this.requests.get(key) || { count: 0, timestamp: now };

    if (now - record.timestamp > windowMs) {
      record.count = 1;
      record.timestamp = now;
      this.requests.set(key, record);
      return true;
    }

    if (record.count >= limit) {
      return false;
    }

    record.count++;
    this.requests.set(key, record);
    return true;
  }

  cleanup() {
      const now = Date.now();
      const expirationTime = 60000 * 2; // Records older than 2 minutes
      for (const [key, record] of this.requests.entries()) {
          if (now - record.timestamp > expirationTime) {
              this.requests.delete(key);
          }
      }
  }
}

const rateLimiter = new RateLimiter();

module.exports = {
  validateUsername: validation.validateUsername,
  validatePreferences: validation.validatePreferences,
  sanitizeData,
  rateLimiter
};