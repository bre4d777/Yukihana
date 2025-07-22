
import { InteractionType, ContainerBuilder, TextDisplayBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } from 'discord.js';
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

  
  return { components: [container], flags: MessageFlags.IsComponentsV2, ephemeral: options.ephemeral !== false };
}


async function _sendError(interaction, title, description) {
  const reply = _createCv2Reply({ title: `<:discotoolsxyzicon87:1347122685267939348> ${title}`, description, color: 0xED4245 });
  try {
    if (interaction.deferred || interaction.replied) {
      await interaction.followUp(reply);
    } else {
      await interaction.reply(reply);
    }
  } catch (e) {
    logger.error('InteractionCreate', 'Failed to send error reply.', e);
  }
}


async function _sendPremiumError(interaction, type) {
  const button = new ButtonBuilder().setLabel('Support Server').setURL('https://discord.gg/XYwwyDKhec').setStyle(ButtonStyle.Link);
  const row = new ActionRowBuilder().addComponents(button);

  const reply = _createCv2Reply({
      title: `<:discotoolsxyzicon87:1347122685267939348> ${type} Required`,
      description: `**This command requires ${type}!**\n\n虫 Contact the bot owner for access`,
      color: 0xED4245,
      actionRows: [row]
  });

  if (interaction.deferred || interaction.replied) {
    await interaction.followUp(reply);
  } else {
    await interaction.reply(reply);
  }
}


async function _logErrorToChannel(client, error, interaction) {
  const timestamp = new Date().toISOString();
  const commandName = `/${interaction.commandName}${interaction.options.getSubcommand(false) ? ' ' + interaction.options.getSubcommand(false) : ''}`;
  const errorMessage = `**Command**: \`${commandName}\`\n**User**: ${interaction.user.tag} (\`${interaction.user.id}\`)\n**Guild**: ${interaction.guild.name} (\`${interaction.guild.id}\`)\n\`\`\`[${timestamp}]\n${error.stack || error.message}\`\`\``;

  try {
    const channel = await client.channels.fetch("1380538525048508417");
    if (channel?.isTextBased()) {
      const errorReply = _createCv2Reply({
          title: '笶 Logged Interaction Error',
          description: errorMessage.substring(0, 4000),
          color: 0x992D22,
          ephemeral: false
      });
      await channel.send(errorReply);
    }
  } catch (fetchError) {
    logger.error('InteractionCreate', 'Failed to log error to Discord channel', fetchError);
  }
}


function getCommandFile(interaction, client) {
    const commandName = interaction.commandName;
    const subCommandName = interaction.options.getSubcommand(false);
    const key = subCommandName ? [commandName, subCommandName].toString() : commandName;
    return client.commandHandler.slashCommandFiles.get(key);
}




export default {
  name: 'interactionCreate',
  async execute(interaction, client) {
    if (interaction.type === InteractionType.ApplicationCommand) {
      await handleChatInputCommand(interaction, client);
    } else if (interaction.type === InteractionType.ApplicationCommandAutocomplete) {
      await handleAutocomplete(interaction, client);
    }
  },
};


async function handleChatInputCommand(interaction, client) {
  if (!interaction.inGuild()) {
    return interaction.reply({ content: 'Commands can only be used in a server.', ephemeral: true });
  }

  const commandToExecute = getCommandFile(interaction, client);

  if (!commandToExecute) {
    logger.warn('InteractionCreate', `No command file found for interaction: /${interaction.commandName}${interaction.options.getSubcommand(false) ? ' ' + interaction.options.getSubcommand(false) : ''}`);
    return interaction.reply({ content: 'This command seems to be outdated or improperly configured.', ephemeral: true });
  }

  try {
    

    
    if (db.isUserBlacklisted(interaction.user.id) || db.isGuildBlacklisted(interaction.guild.id)) {
      return _sendError(interaction, 'Access Denied', 'You are not permitted to use this bot.');
    }

    
    if (commandToExecute.maintenance && !config.ownerIds?.includes(interaction.user.id)) {
      return _sendError(interaction, 'Under Maintenance', 'This command is currently under maintenance. Please try again later.');
    }

    
    if (commandToExecute.ownerOnly && !config.ownerIds?.includes(interaction.user.id)) {
      return _sendError(interaction, 'Permission Denied', 'This is an owner-only command.');
    }

    
    if (commandToExecute.management && !db.isManager(interaction.user.id)) {
      return _sendError(interaction, 'Permission Denied', 'Management permissions are required for this command.');
    }

    
    if (!canUseCommand(interaction.member, commandToExecute)) {
      const missingPerms = commandToExecute.userPermissions.filter(p => !interaction.member.permissions.has(p));
      return _sendError(interaction, 'Insufficient Permissions', `You are missing the following permissions: \`${missingPerms.join(', ')}\``);
    }

    
    if (commandToExecute.permissions?.length > 0) {
      const missingBotPerms = getMissingBotPermissions(interaction.channel, commandToExecute.permissions);
      if (missingBotPerms.length > 0) {
        return _sendError(interaction, 'Missing Bot Permissions', `I am missing the following permissions: \`${missingBotPerms.join(', ')}\``);
      }
    }

    
    if (commandToExecute.userPrem && !hasPremiumAccess(interaction.user.id, interaction.guild.id, 'user')) return _sendPremiumError(interaction, 'User Premium');
    if (commandToExecute.guildPrem && !hasPremiumAccess(interaction.user.id, interaction.guild.id, 'guild')) return _sendPremiumError(interaction, 'Guild Premium');
    if (commandToExecute.anyPrem && !hasPremiumAccess(interaction.user.id, interaction.guild.id, 'any')) return _sendPremiumError(interaction, 'Premium');

    
    const cooldownTime = cooldownManager.checkCooldown(interaction.user.id, commandToExecute);
    if (cooldownTime) {
      return _sendError(interaction, 'Cooldown Active', `Please wait **${cooldownTime}** more second(s) before using this command.`);
    }

    
    if (commandToExecute.voiceRequired && !interaction.member.voice.channel) {
      return _sendError(interaction, 'Voice Channel Required', 'You must be in a voice channel to use this command.');
    }
    if (commandToExecute.sameVoiceRequired && interaction.guild.members.me.voice.channel) {
      if (!inSameVoiceChannel(interaction.member, interaction.guild.members.me)) {
        return _sendError(interaction, 'Different Voice Channel', `You must be in the same voice channel as me: **${interaction.guild.members.me.voice.channel.name}**.`);
      }
    }


    
    cooldownManager.setCooldown(interaction.user.id, commandToExecute);
    await commandToExecute.slashExecute({ interaction, client });

  } catch (error) {
    const commandName = commandToExecute.slashData.name.toString();
    logger.error('InteractionCreate', `Error executing slash command '${commandName}'`, error);
    await _logErrorToChannel(client, error, interaction);
    await _sendError(interaction, 'Command Error', `An unexpected error occurred while running the command.`);
  }
}


async function handleAutocomplete(interaction, client) {
  const commandToExecute = getCommandFile(interaction, client);
  if (!commandToExecute || !commandToExecute.autocomplete) return;

  try {
    await commandToExecute.autocomplete({ interaction, client });
  } catch (error) {
    logger.error('InteractionCreate', `Error handling autocomplete for '${interaction.commandName}'`, error);
  }
}
