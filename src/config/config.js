import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export const config = {
  // Bot Configuration
  token: process.env.DISCORD_TOKEN || process.env.token,
  clientId: process.env.CLIENT_ID,
  prefix: process.env.PREFIX || '.',
  ownerIds: (process.env.OWNER_IDS || '931059762173464597,937380760875302974,1052620216443601076,958583892326117437,785708354445508649').split(',').filter(Boolean),

  // Environment
  environment: process.env.NODE_ENV || 'development',
  debug: process.env.DEBUG === 'true' || process.env.NODE_ENV === 'development',

  // Database Configuration
  database: {
    guild: './database/guild.db',
    user: './database/user.db',
    premium: './database/premium.db',
  },

  // Bot Status
  status: {
    text: process.env.STATUS_TEXT || '!help | Discord Bot',
    status: process.env.STATUS_TYPE || 'dnd',
    type: 'CUSTOM'
  },

  // Colors
  colors: {
    info: '#3498db',
    success: '#2ecc71',
    warning: '#f39c12',
    error: '#e74c3c'
  },

  // Logging Channels
  channels: {
    error: process.env.ERROR_CHANNEL_ID || '1380538525048508417',
    logs: process.env.LOG_CHANNEL_ID || '1380533796008497312',
    backup: process.env.BACKUP_CHANNEL_ID || '1223205399163834419'
  },

  // Features
  features: {
    backup: process.env.BACKUP_ENABLED !== 'false'
  },

  // Metadata
  watermark: 'coded by bre4d',
  version: '2.0.0'
};