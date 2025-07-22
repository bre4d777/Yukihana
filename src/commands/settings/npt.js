import { Command } from '#structures/Command.js';
import {
  ContainerBuilder,
  TextDisplayBuilder,
  SectionBuilder,
  SeparatorBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  SelectMenuBuilder,
  SelectMenuOptionBuilder,
  ThumbnailBuilder,
  MessageFlags,
  SeparatorSpacingSize,
  ButtonStyle,
} from 'discord.js';
import { db } from '#database/DatabaseManager.js';


class NoPrefixToggleCommand extends Command {
  constructor() {
    super({
      name: 'noptoggle',
      description: 'Toggle your personal no-prefix mode (Premium Only)',
      usage: 'noptoggle [on/off]',
      aliases: ['npt', 'noprefixtoggle', 'noprefix', 'nop'],
      category: 'premium',
      cooldown: 5,
      userPrem: true,
      enabledSlash: true,
      slashData: {
        name: ['premium', 'noptoggle'],
        description: 'Toggle your personal no-prefix mode (Premium Only)',
        options: [{
          name: 'action',
          description: 'Enable or disable no-prefix mode',
          type: 3,
          required: false,
          autocomplete: true
        }]
      }
    });
  }

  
  _createSeparator(spacing = SeparatorSpacingSize.Small, divider = false) {
    return new SeparatorBuilder().setSpacing(spacing).setDivider(divider);
  }

  
  buildNoPrefixContainer(client, userId, username, currentStatus, action = null) {
    const container = new ContainerBuilder()
      .setAccentColor(currentStatus ? 0x57F287 : 0xED4245); 

    
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`# 💎 No-Prefix Mode Toggle\n*Premium Feature - Personal Configuration*\n\nHello **${username}**!`)
    );

    container.addSeparatorComponents(this._createSeparator(SeparatorSpacingSize.Small, true));

    
    container.addSectionComponents(
      new SectionBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent('## Current Status'),
          new TextDisplayBuilder().setContent(`**No-Prefix Mode**: ${currentStatus ? '✅ **Enabled**' : '❌ **Disabled**'}\n**User**: ${username}\n**Premium**: 💎 Active`)
        )
        .setThumbnailAccessory(
          new ThumbnailBuilder().setURL(currentStatus ? 
            'https://cdn.discordapp.com/emojis/1347122696856539197.png' : 
            'https://cdn.discordapp.com/emojis/1347122685267939348.png')
        )
    );

    
    if (action) {
      container.addSeparatorComponents(this._createSeparator());
      container.addSectionComponents(
        new SectionBuilder()
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent('## Action Result'),
            new TextDisplayBuilder().setContent(`**Your no-prefix mode has been ${action}!**`)
          )
      );
    }

    container.addSeparatorComponents(this._createSeparator(SeparatorSpacingSize.Large, true));

    
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent('## How No-Prefix Mode Works')
    );

    if (currentStatus) {
      container.addSectionComponents(
        new SectionBuilder()
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent('**✅ Mode: ENABLED**'),
            new TextDisplayBuilder().setContent(`🎯 **You can now use commands without any prefix!**\n• Just type command names directly\n• Example: \`ping\` or \`help\`\n• Works in all servers where ${client.user.username} is present\n• Premium perk - no expiration`)
          )
      );
    } else {
      container.addSectionComponents(
        new SectionBuilder()
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent('**❌ Mode: DISABLED**'),
            new TextDisplayBuilder().setContent(`🔧 **You need to use prefixes for commands**\n• Use server prefix or mention the bot\n• Example: \`!ping\` or \`@${client.user.username} help\`\n• Standard Discord bot behavior`)
          )
      );
    }

    container.addSeparatorComponents(this._createSeparator(SeparatorSpacingSize.Large, true));

    
    container.addActionRowComponents(
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('npt_toggle')
          .setLabel(currentStatus ? 'Disable No-Prefix' : 'Enable No-Prefix')
          .setStyle(currentStatus ? ButtonStyle.Danger : ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId('npt_help')
          .setLabel('Help & Info')
          .setStyle(ButtonStyle.Secondary)
      )
    );

    
    container.addActionRowComponents(
      new ActionRowBuilder().addComponents(
        new SelectMenuBuilder()
          .setCustomId('npt_advanced')
          .setPlaceholder('Advanced options...')
          .addOptions(
            new SelectMenuOptionBuilder()
              .setLabel('View Usage Examples')
              .setValue('examples')
              .setDescription('See examples of how to use commands'),
            new SelectMenuOptionBuilder()
              .setLabel('Check Premium Status')
              .setValue('premium')
              .setDescription('View your premium subscription details'),
            new SelectMenuOptionBuilder()
              .setLabel('Reset to Default')
              .setValue('reset')
              .setDescription('Reset to server default settings')
          )
      )
    );

    
    container.addSeparatorComponents(this._createSeparator(SeparatorSpacingSize.Small, true));
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`*User ID: ${userId} • Premium Feature • Session: ${new Date().toLocaleString()}*`)
    );

    return container;
  }

  
  buildHelpContainer(client, username) {
    const container = new ContainerBuilder().setAccentColor(0x5865F2);

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`# 📚 No-Prefix Mode Help\n*Everything you need to know*`)
    );

    container.addSeparatorComponents(this._createSeparator(SeparatorSpacingSize.Small, true));

    
    container.addSectionComponents(
      new SectionBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent('## What is No-Prefix Mode?'),
          new TextDisplayBuilder().setContent('No-Prefix Mode allows premium users to use bot commands without typing a prefix. Instead of `!ping`, you can just type `ping`.')
        )
    );

    container.addSeparatorComponents(this._createSeparator());

    
    container.addSectionComponents(
      new SectionBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent('## Examples'),
          new TextDisplayBuilder().setContent('**With No-Prefix Mode:**\n• `ping`\n• `help`\n• `prefix`\n\n**Without No-Prefix Mode:**\n• `!ping`\n• `!help`\n• `!prefix`')
        )
    );

    container.addSeparatorComponents(this._createSeparator());

    
    container.addSectionComponents(
      new SectionBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent('## Premium Feature'),
          new TextDisplayBuilder().setContent('💎 **User Premium Required**\n• Personal setting that follows you\n• Works in all servers\n• No expiration\n• Toggle anytime')
        )
    );

    container.addActionRowComponents(
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('npt_back')
          .setLabel('← Back to Settings')
          .setStyle(ButtonStyle.Secondary)
      )
    );

    return container;
  }

  
  buildExamplesContainer() {
    const container = new ContainerBuilder().setAccentColor(0xFEE75C);

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent('# 💡 Usage Examples\n*See how commands work with and without prefixes*')
    );

    container.addSeparatorComponents(this._createSeparator(SeparatorSpacingSize.Small, true));

    const examples = [
      { category: 'Bot Commands', with: 'ping', without: '!ping' },
      { category: 'Moderation', with: 'ban @user spam', without: '!ban @user spam' },
      { category: 'Utility', with: 'help', without: '!help' },
      { category: 'Settings', with: 'prefix', without: '!prefix' }
    ];

    examples.forEach((example, index) => {
      container.addSectionComponents(
        new SectionBuilder()
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`**${example.category}**`),
            new TextDisplayBuilder().setContent(`✅ **With No-Prefix**: \`${example.with}\`\n❌ **Without**: \`${example.without}\``)
          )
      );
      if (index < examples.length - 1) {
        container.addSeparatorComponents(this._createSeparator());
      }
    });

    container.addActionRowComponents(
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('npt_back')
          .setLabel('← Back to Settings')
          .setStyle(ButtonStyle.Secondary)
      )
    );

    return container;
  }

  
  async execute({ message, args, client }) {
    const userId = message.author.id;
    const username = message.author.username;
    const currentStatus = db.hasNoPrefix(userId);

    let newStatus;
    let action;

    
    if (args.length > 0) {
      const arg = args[0].toLowerCase();
      if (arg === 'on' || arg === 'enable' || arg === 'true') {
        newStatus = true;
        action = 'enabled';
      } else if (arg === 'off' || arg === 'disable' || arg === 'false') {
        newStatus = false;
        action = 'disabled';
      } else {
        
        const errorContainer = new ContainerBuilder().setAccentColor(0xED4245)
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`# ❌ Invalid Option\n*Please use valid options*`)
          )
          .addSeparatorComponents(this._createSeparator(SeparatorSpacingSize.Small, true))
          .addSectionComponents(
            new SectionBuilder()
              .addTextDisplayComponents(
                new TextDisplayBuilder().setContent('## Error Details'),
                new TextDisplayBuilder().setContent(`**Invalid option**: \`${arg}\`\n\n**Valid options:**\n• \`on\` / \`enable\` - Enable no-prefix mode\n• \`off\` / \`disable\` - Disable no-prefix mode\n• No argument - Toggle current state`)
              )
          )
          .addActionRowComponents(
            new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId('npt_back')
                .setLabel('← Back to Settings')
                .setStyle(ButtonStyle.Secondary)
            )
          );

        const sent = await message.reply({ 
          components: [errorContainer], 
          flags: MessageFlags.IsComponentsV2 
        });

        
        const collector = sent.createMessageComponentCollector({ time: 60000 });
        collector.on('collect', async interaction => {
          if (interaction.user.id !== message.author.id) {
            return interaction.reply({ content: 'This is not your command!', ephemeral: true });
          }
          
          if (interaction.customId === 'npt_back') {
            await interaction.deferUpdate();
            const mainContainer = this.buildNoPrefixContainer(client, userId, username, currentStatus);
            await interaction.editReply({ components: [mainContainer], flags: MessageFlags.IsComponentsV2 });
          }
        });
        return;
      }
    } else {
      
      newStatus = !currentStatus;
      action = newStatus ? 'enabled' : 'disabled';
    }

    
    db.setNoPrefix(userId, newStatus, null);

    
    const container = this.buildNoPrefixContainer(client, userId, username, newStatus, action);

    const sent = await message.reply({ 
      components: [container], 
      flags: MessageFlags.IsComponentsV2 
    });

    
    const collector = sent.createMessageComponentCollector({ time: 300000 });

    collector.on('collect', async interaction => {
      if (interaction.user.id !== message.author.id) {
        return interaction.reply({ content: 'This is not your command!', ephemeral: true });
      }

      try {
        await interaction.deferUpdate();
        const customId = interaction.customId;

        if (customId === 'npt_toggle') {
          
          const currentStatus = db.hasNoPrefix(userId);
          const newStatus = !currentStatus;
          const action = newStatus ? 'enabled' : 'disabled';
          
          db.setNoPrefix(userId, newStatus, null);
          
          const updatedContainer = this.buildNoPrefixContainer(client, userId, username, newStatus, action);
          await interaction.editReply({ components: [updatedContainer], flags: MessageFlags.IsComponentsV2 });

        } else if (customId === 'npt_help') {
          const helpContainer = this.buildHelpContainer(client, username);
          await interaction.editReply({ components: [helpContainer], flags: MessageFlags.IsComponentsV2 });

        } else if (customId === 'npt_back') {
          const currentStatus = db.hasNoPrefix(userId);
          const mainContainer = this.buildNoPrefixContainer(client, userId, username, currentStatus);
          await interaction.editReply({ components: [mainContainer], flags: MessageFlags.IsComponentsV2 });

        } else if (customId === 'npt_advanced') {
          const value = interaction.values[0];
          
          if (value === 'examples') {
            const examplesContainer = this.buildExamplesContainer();
            await interaction.editReply({ components: [examplesContainer], flags: MessageFlags.IsComponentsV2 });
          } else if (value === 'premium') {
            await interaction.followUp({ 
              content: '💎 **Premium Status**: Active\n✅ User Premium subscription detected\n🔄 No-Prefix Mode: Available\n📅 Valid until: No expiration', 
              ephemeral: true 
            });
          } else if (value === 'reset') {
            db.setNoPrefix(userId, false, null);
            const resetContainer = this.buildNoPrefixContainer(client, userId, username, false, 'reset to default');
            await interaction.editReply({ components: [resetContainer], flags: MessageFlags.IsComponentsV2 });
          }
        }

      } catch (error) {
        console.error('NPT Interaction Error:', error);
        await interaction.followUp({ content: 'An error occurred while processing your request.', ephemeral: true });
      }
    });

    collector.on('end', async () => {
      const expiredContainer = new ContainerBuilder().setAccentColor(0x747F8D)
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent('# 💎 No-Prefix Mode Toggle\n*This command interface has expired.*\n\nRun the command again to access your settings.')
        );
      
      try {
        await sent.edit({ components: [expiredContainer], flags: MessageFlags.IsComponentsV2 });
      } catch (e) {
        
      }
    });
  }

  async slashExecute({ interaction, client }) {
    const action = interaction.options.getString('action');
    await this.execute({ client, message: interaction, args: action ? [action] : [] });
  }

  async autocomplete({ interaction }) {
    const focusedValue = interaction.options.getFocused();
    const choices = [
      { name: 'Enable no-prefix mode', value: 'on' },
      { name: 'Disable no-prefix mode', value: 'off' },
      { name: 'Toggle current state', value: 'toggle' },
      { name: 'Enable (alternative)', value: 'enable' },
      { name: 'Disable (alternative)', value: 'disable' }
    ];
    
    const filtered = choices.filter(choice => 
      choice.name.toLowerCase().includes(focusedValue.toLowerCase()) ||
      choice.value.toLowerCase().includes(focusedValue.toLowerCase())
    );
    
    await interaction.respond(
      filtered.map(choice => ({ name: choice.name, value: choice.value }))
    );
  }
}

export default new NoPrefixToggleCommand();