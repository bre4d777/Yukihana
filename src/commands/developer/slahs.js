import { Command } from '#structures/Command.js';
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v10';
import { config } from '#config/config.js';
import { logger } from '#utils/logger.js';
import { ContainerBuilder, TextDisplayBuilder, MessageFlags } from 'discord.js';

class UpdateSlashCommand extends Command {
  constructor() {
    super({
      name: 'updateslash',
      description: 'Registers or updates all slash commands with Discord.',
      category: 'Owner',
      ownerOnly: true,
      enabledSlash: false,
    });
  }

  async execute({ client, message }) {
    const replyContainer = new ContainerBuilder()
        .setAccentColor(0x5865F2)
        .addTextDisplayComponents(new TextDisplayBuilder().setContent('🔄 **Updating Slash Commands...**'));

    const msg = await message.reply({ components: [replyContainer], flags: MessageFlags.IsComponentsV2 });

    try {
      const slashCommandsData = client.commandHandler.getSlashCommandsData();
      
      if (!slashCommandsData || slashCommandsData.length === 0) {
        replyContainer.setAccentColor(0xFEE75C);
        replyContainer.components[0].setContent('🤔 **No Slash Commands Found**\nNo slash-enabled commands were found to register.');
        return msg.edit({ components: [replyContainer] });
      }

      replyContainer.components[0].setContent(`Found **${slashCommandsData.length}** slash commands. Attempting to register them globally...`);
      await msg.edit({ components: [replyContainer] });

      const rest = new REST({ version: '10' }).setToken(config.token);

      await rest.put(
        Routes.applicationCommands(client.user.id),
        { body: slashCommandsData },
      );

      replyContainer.setAccentColor(0x57F287);
      replyContainer.components[0].setContent(`✅ **Success!**\nSuccessfully registered **${slashCommandsData.length}** application (/) commands globally.`);
      await msg.edit({ components: [replyContainer] });
      
      logger.success('UpdateSlash', `Registered ${slashCommandsData.length} commands.`);

    } catch (error) {
      logger.error('UpdateSlash', 'Failed to register slash commands', error);
      replyContainer.setAccentColor(0xED4245);
      replyContainer.components[0].setContent(`❌ **Failed to Register**\nAn error occurred. Check the console for details.`);
      await msg.edit({ components: [replyContainer] });
    }
  }
}

export default new UpdateSlashCommand();