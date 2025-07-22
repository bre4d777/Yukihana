import { Guild } from './Guild.js';
import { User } from './User.js';
import { Premium } from './Premium.js';
import { logger } from '#utils/logger.js';


export class DatabaseManager {
  constructor() {
    this.initDatabases();
  }

  initDatabases() {
    try {
      this.guild = new Guild();
      this.user = new User();
      this.premium = new Premium();

      logger.success('DatabaseManager', 'All databases initialized successfully');
    } catch (error) {
      logger.error('DatabaseManager', 'Failed to initialize databases', error);
      throw error;
    }
  }

  closeAll() {
    try {
      this.guild.close();
      this.user.close();
      this.premium.close();

      logger.info('DatabaseManager', 'All database connections closed');
    } catch (error) {
      logger.error('DatabaseManager', 'Failed to close database connections', error);
    }
  }

  getPrefix(guildId) {
    return this.guild.getPrefix(guildId);
  }

  setPrefix(guildId, prefix) {
    return this.guild.setPrefix(guildId, prefix);
  }

  hasNoPrefix(userId) {
    return this.user.hasNoPrefix(userId);
  }

  setNoPrefix(userId, enabled, expiryTimestamp = null) {
    return this.user.setNoPrefix(userId, enabled, expiryTimestamp);
  }

  blacklistUser(userId, reason = 'No reason provided') {
    return this.user.blacklistUser(userId, reason);
  }

  
  unblacklistUser(userId) {
    return this.user.unblacklistUser(userId);
  }

  
  isUserBlacklisted(userId) {
    return this.user.isBlacklisted(userId);
  }

  
  blacklistGuild(guildId, reason = 'No reason provided') {
    return this.guild.blacklistGuild(guildId, reason);
  }

  
  unblacklistGuild(guildId) {
    return this.guild.unblacklistGuild(guildId);
  }

  
  isGuildBlacklisted(guildId) {
    return this.guild.isBlacklisted(guildId);
  }

  
  getAllBlacklistedGuilds() {
    return this.guild.getAllBlacklistedGuilds();
  }

  
  getUserData(userId) {
    return this.user.ensureUser(userId);
  }


  
  
  grantUserPremium(userId, grantedBy, expiresAt = null, reason = 'Premium granted') {
    return this.premium.grantUserPremium(userId, grantedBy, expiresAt, reason);
  }

  
  grantGuildPremium(guildId, grantedBy, expiresAt = null, reason = 'Premium granted') {
    return this.premium.grantGuildPremium(guildId, grantedBy, expiresAt, reason);
  }

  
  revokeUserPremium(userId) {
    return this.premium.revokeUserPremium(userId);
  }

  
  revokeGuildPremium(guildId) {
    return this.premium.revokeGuildPremium(guildId);
  }

  
  isUserPremium(userId) {
    return this.premium.isUserPremium(userId);
  }

  
  isGuildPremium(guildId) {
    return this.premium.isGuildPremium(guildId);
  }

  
  hasAnyPremium(userId, guildId) {
    return this.premium.hasAnyPremium(userId, guildId);
  }

  
  getPremiumStats() {
    return this.premium.getStats();
  }

  
  cleanupExpiredPremiums() {
    return this.premium.cleanupExpired();
  }

  
  extendPremium(type, id, additionalTime) {
    return this.premium.extendPremium(type, id, additionalTime);
  }

  
  getAllUserPremiums() {
    return this.premium.getAllUserPremiums();
  }

  
  getAllGuildPremiums() {
    return this.premium.getAllGuildPremiums();
  }
}


export const db = new DatabaseManager();