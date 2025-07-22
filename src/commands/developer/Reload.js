import { Command } from '../../structures/Command.js';
import {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  MessageFlags,
  SeparatorSpacingSize,
} from 'discord.js';

class ReloadCommand extends Command {
  constructor() {
    super({
      name: 'rl',
      description: 'Reloads a command, a category, or all commands.',
      usage: 'reload <all | category | command> [name]',
      category: 'Owner',
      ownerOnly: true,
    });
  }

  async execute({ client, message, args }) {
    const type = args[0]?.toLowerCase();
    const name = args.slice(1).join(' ');

    if (!type) {
      return this.sendError(message, `Invalid usage. Correct usage: \`${this.usage}\``);
    }

    let result;
    let title;

    switch (type) {
      case 'all':
        title = 'Reloading All Commands';
        result = await client.commandHandler.reloadAllCommands();
        break;

      case 'command':
        if (!name) return this.sendError(message, 'Please provide a command name to reload.');
        title = `Reloading Command: ${name}`;
        result = await client.commandHandler.reloadCommand(name);
        break;

      default:
        return this.sendError(message, `Invalid type specified. Use 'all' or 'command'.`);
    }

    const container = new ContainerBuilder();
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${title}`));
    container.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true));

    if (result.success) {
      container.setAccentColor(0x57F287);
      container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`✅ **Success**: ${result.message}`));
    } else {
      container.setAccentColor(0xED4245);
      container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`❌ **Failure**: ${result.message}`));
      if (result.error) {
        container.addTextDisplayComponents(new TextDisplayBuilder().setContent('### Error Details\n```\n' + result.error.substring(0, 1000) + '\n```'));
      }
    }

    await message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
  }

  async sendError(message, error) {
    const container = new ContainerBuilder()
      .setAccentColor(0xED4245)
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(`❌ **Error**: ${error}`));
    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
  }
}

export default new ReloadCommand();