
import { ContainerBuilder, TextDisplayBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } from 'discord.js';
import { logger } from '../../utils/logger.js';
import { db } from '../../database/DatabaseManager.js';
import { cooldownManager } from '../../utils/cooldownManager.js';
import { canUseCommand, getMissingBotPermissions, inSameVoiceChannel, hasPremiumAccess } from '../../utils/permissionUtil.js';
import { config } from '../../config/config.js';


function _createCv2Reply(options) {
  const container = new ContainerBuilder().setAccentColor(options.color || 0x5865F2);

  if (options.title && options.description) {
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${options.title}\n${options.description}`));
  } else if (options.description) {
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(options.description));
  }

  if (options.actionRows) {
    options.actionRows.forEach(row => container.addActionRowComponents(row));
  }

  return { components: [container], flags: MessageFlags.IsComponentsV2, ephemeral: options.ephemeral || false };
}

async function _sendError(message, title, description) {
  const reply = _createCv2Reply({ title: `<:discotoolsxyzicon87:1347122685267939348> ${title}`, description, color: 0xED4245 });
  try {
    await message.reply(reply);
  } catch (e) {
    logger.error('MessageCreate', 'Failed to send error reply.', e);
  }
}

async function _sendPremiumError(message, type) {
  const button = new ButtonBuilder().setLabel('Support Server').setURL('https://discord.gg/XYwwyDKhec').setStyle(ButtonStyle.Link);
  const row = new ActionRowBuilder().addComponents(button);

  const reply = _createCv2Reply({
      title: `<:discotoolsxyzicon87:1347122685267939348> ${type} Required`,
      description: `**This command requires ${type}!**\n\n💎 Contact the bot owner for access`,
      color: 0xED4245,
      actionRows: [row]
  });
  
  await message.reply(reply);
}

async function _logCommandUsage(client, message, commandName, args) {
  try {
    const logChannel = await client.channels.fetch('1380533796008497312');
    if (!logChannel?.isTextBased()) return;

    const logDescription = `
**User**: ${message.author.tag} (\`${message.author.id}\`)
**Command**: \`${commandName}\`
**Args**: \`${args.join(' ') || 'None'}\`
**Server**: ${message.guild.name} (\`${message.guild.id}\`)`;
    const logReply = _createCv2Reply({ title: '🔍 Command Used', description: logDescription, color: 0x5865F2 });
    await logChannel.send(logReply);
  } catch (error) {
    logger.error('MessageCreate', 'Error logging command usage', error);
  }
}

async function _logErrorToChannel(client, error) {
  const timestamp = new Date().toISOString();
  const errorMessage = `\`\`\`[${timestamp}]\n${error.stack || error.message}\`\`\``;

  try {
    const channel = await client.channels.fetch("1380538525048508417");
    if (channel?.isTextBased()) {
      const errorReply = _createCv2Reply({
          title: '❌ Logged Error',
          description: errorMessage.substring(0, 4000),
          color: 0x992D22
      });
      await channel.send(errorReply);
    }
  } catch (fetchError) {
    logger.error('MessageCreate', 'Failed to log error to Discord channel', fetchError);
  }
}


const debugFlags = new Set(['verbose', 'debug', 'trace', 'timing', 'silent']);

function _parseCommand(message, client) {
  const content = message.content.trim();
  const guildPrefix = db.getPrefix(message.guild.id);
  const defaultPrefix = config.prefix || '!';
  const hasNoPrefix = db.hasNoPrefix(message.author.id);
  
  const mentionPrefixRegex = new RegExp(`^<@!?${client.user.id}>\\s+`);
  
  let commandText = null;
  let isPrefixCommand = false;

  const mentionMatch = content.match(mentionPrefixRegex);

  if (mentionMatch) {
    commandText = content.slice(mentionMatch[0].length).trim();
    isPrefixCommand = true;
  } else if (content.startsWith(guildPrefix)) {
    commandText = content.slice(guildPrefix.length).trim();
    isPrefixCommand = true;
  } else if (content.startsWith(defaultPrefix)) {
    commandText = content.slice(defaultPrefix.length).trim();
    isPrefixCommand = true;
  } else if (hasNoPrefix) {
    commandText = content;
    isPrefixCommand = false; 
  }

  if (commandText === null) return null;

  const parts = commandText.split(/\s+/);
  const commandName = parts.shift()?.toLowerCase();
  if (!commandName) return null;

  const flags = new Set();
  const args = [];
  
  for (const part of parts) {
    if (part.startsWith('--')) {
      const flag = part.slice(2).toLowerCase();
      if (debugFlags.has(flag)) {
        flags.add(flag);
      } else {
        args.push(part);
      }
    } else {
      args.push(part);
    }
  }

  return { commandName, args, isPrefixCommand, flags };
}

async function _checkAndRemoveNoPrefixForNonPremium(message) {
  const userId = message.author.id;
  const guildId = message.guild.id;
  
  if (!db.hasNoPrefix(userId)) return;

  const hasPremium = hasPremiumAccess(userId, guildId, 'user');
  
  if (!hasPremium) {
    db.setNoPrefix(userId, false, null);
    
    if (Math.random() < 0.3) {
      const button = new ButtonBuilder().setLabel('Get Premium').setURL('https://discord.gg/XYwwyDKhec').setStyle(ButtonStyle.Link);
      const row = new ActionRowBuilder().addComponents(button);
      const reply = _createCv2Reply({
          title: '<:discotoolsxyzicon87:1347122685267939348> No-Prefix Access Removed',
          description: `**Premium subscription expired**\n\n💎 **Get User Premium to restore access**\n🔓 **Current prefix:** \`${db.getPrefix(guildId)}\``,
          color: 0xFEE75C,
          actionRows: [row]
      });

      try {
        await message.author.send(reply);
      } catch {
        if (Math.random() < 0.2) {
          await message.reply(reply);
        }
      }
    }
  }
}

async function _isBlacklisted(message) {
  const userBlacklisted = db.isUserBlacklisted(message.author.id);
  if (userBlacklisted) {
    if (Math.random() < 0.1) {
      await _sendError(message, 'Blacklisted', `You're blacklisted: ${userBlacklisted.reason}`);
    }
    return true;
  }

  const guildBlacklisted = db.isGuildBlacklisted(message.guild.id);
  if (guildBlacklisted) {
    if (Math.random() < 0.05) {
      await _sendError(message, 'Blacklisted', `Server blacklisted: ${guildBlacklisted.reason}`);
    }
    return true;
  }
  return false;
}

export default {
  name: 'messageCreate',
  async execute(message, client) {
    if (message.author.bot || !message.guild) return;

    
    const mentionRegex = new RegExp(`^<@!?${client.user.id}>\\s*$`);
    if (mentionRegex.test(message.content.trim())) {
      const guildPrefix = db.getPrefix(message.guild.id);
      return message.reply(
        `My prefix here is **${guildPrefix}**.\n` +
        `- Use **${guildPrefix}help** for my commands.\n` +
        `- Use **${guildPrefix}ping** to test the bot.`
      );
    }

    
    const commandInfo = _parseCommand(message, client);
    if (!commandInfo) return;

    const { commandName, args, isPrefixCommand, flags } = commandInfo;

    
    if (await _isBlacklisted(message)) return;

    
    await _checkAndRemoveNoPrefixForNonPremium(message);

    
    const command = client.commandHandler.commands.get(commandName) || client.commandHandler.commands.get(client.commandHandler.aliases.get(commandName));
    if (!command) return;

    
    try {
      
      if (command.maintenance && !config.ownerIds?.includes(message.author.id)) {
        const reply = _createCv2Reply({ description: '<:byte_info:1372554308150890496> Command under maintenance.', color: 0x3498DB });
        await message.reply(reply);
        return;
      }
      
      
      if (command.ownerOnly && !config.ownerIds?.includes(message.author.id)) {
        await _sendError(message, 'Permission Denied', 'This is an owner-only command.');
        return;
      }

      
      if (command.management && !db.isManager(message.author.id)) {
        await _sendError(message, 'Permission Denied', 'Management permissions are required for this command.');
        return;
      }

      
      if (!canUseCommand(message.member, command)) {
        await _sendError(message, 'Insufficient Permissions', 'You do not have the required permissions to use this command.');
        return;
      }

      
      if (command.permissions?.length > 0) {
        const missingBotPerms = getMissingBotPermissions(message.channel, command.permissions);
        if (missingBotPerms.length > 0) {
          await _sendError(message, 'Missing Bot Permissions', `I am missing the following permissions: \`${missingBotPerms.join(', ')}\``);
          return;
        }
      }
      
      
      if (command.userPrem && !hasPremiumAccess(message.author.id, message.guild.id, 'user')) {
        await _sendPremiumError(message, 'User Premium');
        return;
      }

      if (command.guildPrem && !hasPremiumAccess(message.author.id, message.guild.id, 'guild')) {
        await _sendPremiumError(message, 'Guild Premium');
        return;
      }

      if (command.anyPrem && !hasPremiumAccess(message.author.id, message.guild.id, 'any')) {
        await _sendPremiumError(message, 'Premium');
        return;
      }

      
      const cooldownTime = cooldownManager.checkCooldown(message.author.id, command);
      if (cooldownTime) {
        await _sendError(message, 'Cooldown Active', `Please wait **${cooldownTime}** more second(s) before using this command.`);
        return;
      }

      
      if (command.voiceRequired && !message.member.voice.channel) {
        await _sendError(message, 'Voice Channel Required', 'You must be in a voice channel to use this command.');
        return;
      }

      if (command.sameVoiceRequired && message.guild.members.me.voice.channel) {
        if (!inSameVoiceChannel(message.member, message.guild.members.me)) {
          const voiceChannelName = message.guild.members.me.voice.channel.name;
          await _sendError(message, 'Different Voice Channel', `You must be in the same voice channel as me: **${voiceChannelName}**.`);
          return;
        }
      }

      
      const guildPrefix = db.getPrefix(message.guild.id);
      


      
      cooldownManager.setCooldown(message.author.id, command);
      
      await command.execute({
        client,
        message,
        args
      });

      
      if (!flags.has('silent')) {
       
      }

    } catch (error) {
      logger.error('MessageCreate', `Error executing command '${command.name}'`, error);
      await _logErrorToChannel(client, error);
      
      
      if (flags.has('trace')) {
        const traceReply = _createCv2Reply({
            title: '🔍 Command Trace',
            description: `\`\`\`\n${error.stack || error.message}\n\`\`\``,
            color: 0xE74C3C
        });
        await message.channel.send(traceReply);
      } else {
        await _sendError(message, 'Command Error', `An unexpected error occurred while running the \`${command.name}\` command.`);
      }
    }
  }
};