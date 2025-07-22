
import { Database } from './Database.js';
import { config } from '../config/config.js';
import { logger } from '../utils/logger.js';

export class Guild extends Database {
  constructor() {
    super(config.database.guild);
    this.initTable();
  }

  initTable() {
    this.exec(`
      CREATE TABLE IF NOT EXISTS guilds (
        id TEXT PRIMARY KEY,
        prefix TEXT DEFAULT '${config.prefix}',
        blacklisted BOOLEAN DEFAULT FALSE,
        blacklist_reason TEXT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }

  getGuild(guildId) {
    return this.get('SELECT * FROM guilds WHERE id = ?', [guildId]);
  }

  ensureGuild(guildId) {
    const guild = this.getGuild(guildId);
    if (!guild) {
      this.exec('INSERT INTO guilds (id) VALUES (?)', [guildId]);
      return this.getGuild(guildId);
    }
    return guild;
  }

  getPrefix(guildId) {
    const guild = this.ensureGuild(guildId);
    return guild.prefix;
  }

  setPrefix(guildId, prefix) {
    this.ensureGuild(guildId);
    return this.exec(
      'UPDATE guilds SET prefix = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [prefix, guildId]
    );
  }

  getAllGuilds() {
    return this.all('SELECT * FROM guilds');
  }

  updateSettings(guildId, settings) {
    this.ensureGuild(guildId);
    const keys = Object.keys(settings).filter(key =>
      ['prefix'].includes(key)
    );

    if (keys.length === 0) return null;

    const setClause = keys.map(key => `${key} = ?`).join(', ');
    const values = keys.map(key => settings[key]);
    values.push(guildId);

    return this.exec(
      `UPDATE guilds SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      values
    );
  }

  blacklistGuild(guildId, reason = 'No reason provided') {
    this.ensureGuild(guildId);
    return this.exec(
      'UPDATE guilds SET blacklisted = 1, blacklist_reason = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [reason, guildId]
    );
  }

  unblacklistGuild(guildId) {
    this.ensureGuild(guildId);
    return this.exec(
      'UPDATE guilds SET blacklisted = 0, blacklist_reason = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [guildId]
    );
  }

  isBlacklisted(guildId) {
    const guild = this.getGuild(guildId);
    if (!guild || !guild.blacklisted) return false;

    return {
      blacklisted: true,
      reason: guild.blacklist_reason || 'No reason provided'
    };
  }

  getAllBlacklistedGuilds() {
    return this.all('SELECT * FROM guilds WHERE blacklisted = 1');
  }
}