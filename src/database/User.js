import { Database } from './Database.js';
import { config } from '#config/config.js';
import { logger } from '#utils/logger.js';

export class User extends Database {
  constructor() {
    super(config.database.user);
    this.initTable();
  }

  initTable() {
    this.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        no_prefix BOOLEAN DEFAULT FALSE,
        no_prefix_expiry INTEGER DEFAULT NULL,
        blacklisted BOOLEAN DEFAULT FALSE,
        blacklist_reason TEXT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    logger.info('UserDatabase', 'User tables initialized');
  }

  getUser(userId) {
    return this.get('SELECT * FROM users WHERE id = ?', [userId]);
  }

  ensureUser(userId) {
    const user = this.getUser(userId);

    if (!user) {
      this.exec('INSERT INTO users (id) VALUES (?)', [userId]);
      return this.getUser(userId);
    }

    return user;
  }

  setNoPrefix(userId, enabled, expiryTimestamp = null) {
    this.ensureUser(userId);

    return this.exec(
      'UPDATE users SET no_prefix = ?, no_prefix_expiry = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [enabled ? 1 : 0, expiryTimestamp, userId]
    );
  }

  hasNoPrefix(userId) {
    const user = this.getUser(userId);
    if (!user) return false;

    if (user.no_prefix) {
      if (!user.no_prefix_expiry) return true; 

      const now = Date.now();
      if (user.no_prefix_expiry > now) {
        return true;
      } else {
        this.setNoPrefix(userId, false, null);
        return false;
      }
    }

    return false;
  }

  blacklistUser(userId, reason = 'No reason provided') {
    this.ensureUser(userId);

    return this.exec(
      'UPDATE users SET blacklisted = 1, blacklist_reason = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [reason, userId]
    );
  }

  unblacklistUser(userId) {
    this.ensureUser(userId);

    return this.exec(
      'UPDATE users SET blacklisted = 0, blacklist_reason = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [userId]
    );
  }

  isBlacklisted(userId) {
    const user = this.getUser(userId);
    if (!user || !user.blacklisted) return false;

    return {
      blacklisted: true,
      reason: user.blacklist_reason || 'No reason provided'
    };
  }
}