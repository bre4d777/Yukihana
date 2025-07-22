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

  addLikedSong(userId, trackData) {
    try {
      this.ensureUser(userId);

      const existingLike = this.get(
        "SELECT id FROM liked_songs WHERE user_id = ? AND json_extract(track_data, '$.uri') = ?",
        [userId, trackData.uri]
      );

      if (existingLike) {
        return false; 
      }

      this.exec(
        'INSERT INTO liked_songs (user_id, track_data) VALUES (?, ?)',
        [userId, JSON.stringify(trackData)]
      );

      return true;
    } catch (error) {
      logger.error('UserDatabase', `Failed to add liked song for user ${userId}`, error);
      return false;
    }
  }

  removeLikedSong(userId, trackUri) {
    try {
      this.exec(
        "DELETE FROM liked_songs WHERE user_id = ? AND json_extract(track_data, '$.uri') = ?",
        [userId, trackUri]
      );

      return true;
    } catch (error) {
      logger.error('UserDatabase', `Failed to remove liked song for user ${userId}`, error);
      return false;
    }
  }

  getLikedSongs(userId, limit = 10, offset = 0) {
    try {
      const likes = this.all(
        'SELECT track_data FROM liked_songs WHERE user_id = ? ORDER BY added_at DESC LIMIT ? OFFSET ?',
        [userId, limit, offset]
      );

      return likes.map(item => {
        try {
          return JSON.parse(item.track_data);
        } catch (parseError) {
          logger.error('UserDatabase', 'Failed to parse liked song data', parseError);
          return null;
        }
      }).filter(Boolean); 
    } catch (error) {
      logger.error('UserDatabase', `Failed to get liked songs for user ${userId}`, error);
      return [];
    }
  }

  
  countLikedSongs(userId) {
    try {
      const result = this.get(
        'SELECT COUNT(*) as count FROM liked_songs WHERE user_id = ?',
        [userId]
      );
      return result?.count || 0;
    } catch (error) {
      logger.error('UserDatabase', `Failed to count liked songs for user ${userId}`, error);
      return 0;
    }
  }

  
  addToHistory(userId, trackData) {
    try {
      
      this.ensureUser(userId);

      
      const recentTrack = this.get(
        "SELECT id, track_data FROM user_history WHERE user_id = ? ORDER BY played_at DESC LIMIT 1",
        [userId]
      );

      if (recentTrack) {
        try {
          const recentTrackData = JSON.parse(recentTrack.track_data);
          
          if (recentTrackData.uri === trackData.uri) {
           
            return true;
          }
        } catch (parseError) {
          
          logger.error('UserDatabase', 'Failed to parse recent track data', parseError);
        }
      }

      
      this.exec(
        'INSERT INTO user_history (user_id, track_data) VALUES (?, ?)',
        [userId, JSON.stringify(trackData)]
      );

      
      this.exec(`
        DELETE FROM user_history
        WHERE id IN (
          SELECT id FROM user_history
          WHERE user_id = ?
          ORDER BY played_at DESC
          LIMIT -1 OFFSET 50
        )
      `, [userId]);

      return true;
    } catch (error) {
      logger.error('UserDatabase', `Failed to add track to history for user ${userId}`, error);
      return false;
    }
  }

  
  getHistory(userId, limit = 10, offset = 0) {
    try {
      const history = this.all(
        'SELECT track_data FROM user_history WHERE user_id = ? ORDER BY played_at DESC LIMIT ? OFFSET ?',
        [userId, limit, offset]
      );

      return history.map(item => {
        try {
          return JSON.parse(item.track_data);
        } catch (parseError) {
          logger.error('UserDatabase', 'Failed to parse history track data', parseError);
          return null;
        }
      }).filter(Boolean); 
    } catch (error) {
      logger.error('UserDatabase', `Failed to get history for user ${userId}`, error);
      return [];
    }
  }

  
  countHistory(userId) {
    try {
      const result = this.get(
        'SELECT COUNT(*) as count FROM user_history WHERE user_id = ?',
        [userId]
      );
      return result?.count || 0;
    } catch (error) {
      logger.error('UserDatabase', `Failed to count history for user ${userId}`, error);
      return 0;
    }
  }

  
  isTrackLiked(userId, trackUri) {
    try {
      const result = this.get(
        "SELECT id FROM liked_songs WHERE user_id = ? AND json_extract(track_data, '$.uri') = ?",
        [userId, trackUri]
      );
      return !!result;
    } catch (error) {
      logger.error('UserDatabase', `Failed to check if track is liked by user ${userId}`, error);
      return false;
    }
  }


}