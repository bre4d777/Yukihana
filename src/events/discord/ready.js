
import { ActivityType } from 'discord.js';
import { logger } from '#utils/logger.js';
import { config } from '#config/config.js';
import fs from 'fs';
import path from 'path';
import { AttachmentBuilder } from 'discord.js';


export default {
  name: 'ready',
  once: true,
  async execute(client) {
    logger.info('Bot', 'Scheduling database backups every 30 minutes');
    sendDatabaseBackups(client);
    setInterval(() => sendDatabaseBackups(client), 30 * 60 * 1000);
    
    const { user, guilds } = client;
    logger.success('Bot', `Logged in as ${user.tag}`);
    logger.info('Bot', `Serving ${guilds.cache.size} guilds`);
      
    const updateStatus = () => {
      let members = guilds.cache.reduce((acc, g) => acc + g.memberCount, 0);
      user.setActivity({
        name: `is this a comeback?`,
        type: getStatusType(config.status.type),
      });
    };
  
    updateStatus();
    setInterval(updateStatus, 10 * 60 * 1000);
    user.setStatus(config.status.status || 'dnd');

 
  },
};

function getStatusType(type) {
  const types = {
    'PLAYING': ActivityType.Playing,
    'STREAMING': ActivityType.Streaming,
    'LISTENING': ActivityType.Listening,
    'WATCHING': ActivityType.Watching,
    'COMPETING': ActivityType.Competing,
    'CUSTOM': ActivityType.Custom
  };
  return types[type] || ActivityType.Custom;
}


async function sendDatabaseBackups(client) {
  try {
    const backupChannelId = '1223205399163834419';
    const channel = client.channels.cache.get(backupChannelId);
    
    if (!channel) {
      logger.error('Backup', `Backup channel ${backupChannelId} not found`);
      return;
    }
    
    const dbDirectory = path.join(process.cwd(), 'database');
    const files = fs.readdirSync(dbDirectory);
    const dbFiles = files.filter(file => file.endsWith('.db'));
    
    logger.info('Backup', `Sending ${dbFiles.length} database files to backup channel`);
    
    for (const file of dbFiles) {
      const filePath = path.join(dbDirectory, file);
      const attachment = new AttachmentBuilder(filePath, { name: file });
      await channel.send({ files: [attachment] });
    }
    
    logger.success('Backup', 'Database backup files sent successfully');
  } catch (error) {
    logger.error('Backup', 'Failed to send database backups', error);
  }
}

