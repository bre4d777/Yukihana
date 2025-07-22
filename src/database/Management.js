
import { Database } from './Database.js';
import { config } from '../config/config.js';
import { logger } from '../utils/logger.js';


export class Management extends Database {
  constructor() {
    super(config.database.management || 'database/management.db');
    this.initTables();
  }

  initTables() {
    this.exec(`
      CREATE TABLE IF NOT EXISTS managers (
        user_id TEXT PRIMARY KEY,
        added_by TEXT NOT NULL,
        added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        reason TEXT DEFAULT 'No reason provided',
        active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    logger.success('ManagementDatabase', 'Management tables initialized successfully');
  }

  addManager(userId, addedBy, reason = 'No reason provided') {
    return this.exec(
      `INSERT OR REPLACE INTO managers 
       (user_id, added_by, reason, active, updated_at) 
       VALUES (?, ?, ?, 1, CURRENT_TIMESTAMP)`,
      [userId, addedBy, reason]
    );
  }

  removeManager(userId) {
    return this.exec(
      'UPDATE managers SET active = 0, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?',
      [userId]
    );
  }

  isManager(userId) {
    const manager = this.get(
      'SELECT * FROM managers WHERE user_id = ? AND active = 1',
      [userId]
    );

    if (!manager) return false;

    return {
      userId: manager.user_id,
      addedBy: manager.added_by,
      addedAt: manager.added_at,
      reason: manager.reason
    };
  }

  getAllManagers() {
    return this.all(
      'SELECT * FROM managers WHERE active = 1 ORDER BY added_at DESC'
    );
  }

  getAllManagersIncludingInactive() {
    return this.all(
      'SELECT * FROM managers ORDER BY added_at DESC'
    );
  }

  getStats() {
    const activeManagers = this.get(
      'SELECT COUNT(*) as count FROM managers WHERE active = 1'
    ).count;

    const totalManagers = this.get('SELECT COUNT(*) as count FROM managers').count;

    return {
      active: activeManagers,
      total: totalManagers,
      inactive: totalManagers - activeManagers
    };
  }

  managerExists(userId) {
    const manager = this.get(
      'SELECT user_id FROM managers WHERE user_id = ?',
      [userId]
    );
    return !!manager;
  }

  reactivateManager(userId, reactivatedBy) {
    return this.exec(
      'UPDATE managers SET active = 1, added_by = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?',
      [reactivatedBy, userId]
    );
  }
}