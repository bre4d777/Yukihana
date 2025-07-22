# Commands Development Guide

## Overview
This guide covers how to create, structure, and implement both prefix and slash commands in the Yukihana Discord bot framework.

## Command Architecture

### Base Command Class
All commands extend from the `Command` class located in `src/structures/Command.js`:

```javascript
import { Command } from '../../structures/Command.js';

class YourCommand extends Command {
  constructor() {
    super({
      // Command properties
    });
  }

  async execute({ client, message, args }) {
    // Prefix command logic
  }

  async slashExecute({ interaction, client }) {
    // Slash command logic
  }

  async autocomplete({ interaction }) {
    // Autocomplete logic for slash commands
  }
}

export default new YourCommand();
```

## Command Properties

### Basic Properties
```javascript
{
  name: 'commandname',               // Command name (required)
  description: 'Command description', // Description text (required)
  usage: 'commandname [args]',       // Usage syntax
  aliases: ['alias1', 'alias2'],     // Alternative command names
  category: 'categoryname',          // Command category
  cooldown: 3,                       // Cooldown in seconds
  examples: ['example1', 'example2'] // Usage examples
}
```

### Permission Properties
```javascript
{
  permissions: [PermissionFlagsBits.SendMessages],     // Bot permissions required
  userPermissions: [PermissionFlagsBits.Administrator], // User permissions required
  ownerOnly: false,        // Restrict to bot owners only
  management: false,       // Require management permissions
  userPrem: false,         // Require user premium
  guildPrem: false,        // Require guild premium
  anyPrem: false          // Require any premium (user OR guild)
}
```

### Voice & State Properties
```javascript
{
  voiceRequired: false,        // User must be in voice channel
  sameVoiceRequired: false,    // User must be in same voice as bot
  maintenance: false          // Command is under maintenance
}
```

### Slash Command Properties
```javascript
{
  enabledSlash: true,         // Enable slash command support
  slashData: {
    name: ['category', 'commandname'],  // Array format for grouped commands
    description: 'Command description',
    options: [
      {
        name: 'parameter',
        description: 'Parameter description',
        type: 3,                // Discord API type (3 = STRING)
        required: false,
        autocomplete: true
      }
    ]
  }
}
```

## Discord API Option Types
```javascript
// Common types used in slash commands
1  // SUB_COMMAND
2  // SUB_COMMAND_GROUP
3  // STRING
4  // INTEGER
5  // BOOLEAN
6  // USER
7  // CHANNEL
8  // ROLE
9  // MENTIONABLE
10 // NUMBER
11 // ATTACHMENT
```

## Creating Commands

### 1. Prefix-Only Command
```javascript
import { Command } from '../../structures/Command.js';

class PingCommand extends Command {
  constructor() {
    super({
      name: 'ping',
      description: 'Check bot latency',
      usage: 'ping',
      category: 'utility',
      cooldown: 3
    });
  }

  async execute({ client, message, args }) {
    const start = Date.now();
    const msg = await message.reply('Pinging...');
    const end = Date.now();
    
    await msg.edit(`🏓 Pong! Latency: ${end - start}ms | API: ${client.ws.ping}ms`);
  }
}

export default new PingCommand();
```

### 2. Hybrid Command (Prefix + Slash)
```javascript
import { Command } from '../../structures/Command.js';
import { EmbedBuilder } from 'discord.js';

class UserInfoCommand extends Command {
  constructor() {
    super({
      name: 'userinfo',
      description: 'Get information about a user',
      usage: 'userinfo [@user]',
      aliases: ['ui', 'user'],
      category: 'info',
      cooldown: 5,
      enabledSlash: true,
      slashData: {
        name: ['info', 'user'],
        description: 'Get information about a user',
        options: [{
          name: 'target',
          description: 'The user to get info about',
          type: 6, // USER type
          required: false
        }]
      }
    });
  }

  async execute({ client, message, args }) {
    const user = message.mentions.users.first() || 
                 await client.users.fetch(args[0]).catch(() => null) || 
                 message.author;
    
    const member = message.guild.members.cache.get(user.id);
    const embed = this.createUserEmbed(user, member);
    
    return message.reply({ embeds: [embed] });
  }

  async slashExecute({ interaction, client }) {
    const user = interaction.options.getUser('target') || interaction.user;
    const member = interaction.guild.members.cache.get(user.id);
    const embed = this.createUserEmbed(user, member);
    
    return interaction.reply({ embeds: [embed] });
  }

  createUserEmbed(user, member) {
    const embed = new EmbedBuilder()
      .setTitle(`User Info: ${user.tag}`)
      .setThumbnail(user.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: 'ID', value: user.id, inline: true },
        { name: 'Created', value: `<t:${Math.floor(user.createdTimestamp / 1000)}:R>`, inline: true }
      );

    if (member) {
      embed.addFields(
        { name: 'Joined', value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>`, inline: true },
        { name: 'Roles', value: member.roles.cache.size.toString(), inline: true }
      );
    }

    return embed;
  }
}

export default new UserInfoCommand();
```

### 3. Command with Autocomplete
```javascript
import { Command } from '../../structures/Command.js';

class ConfigCommand extends Command {
  constructor() {
    super({
      name: 'config',
      description: 'Manage server configuration',
      usage: 'config <setting> [value]',
      category: 'admin',
      cooldown: 3,
      enabledSlash: true,
      slashData: {
        name: ['admin', 'config'],
        description: 'Manage server configuration',
        options: [
          {
            name: 'setting',
            description: 'The setting to modify',
            type: 3,
            required: true,
            autocomplete: true
          },
          {
            name: 'value',
            description: 'The new value for the setting',
            type: 3,
            required: false
          }
        ]
      }
    });
  }

  async execute({ client, message, args }) {
    const setting = args[0];
    const value = args.slice(1).join(' ');
    
    // Implementation logic
  }

  async slashExecute({ interaction, client }) {
    const setting = interaction.options.getString('setting');
    const value = interaction.options.getString('value');
    
    // Implementation logic
  }

  async autocomplete({ interaction }) {
    const focusedValue = interaction.options.getFocused();
    const choices = [
      { name: 'Welcome Channel', value: 'welcome_channel' },
      { name: 'Log Channel', value: 'log_channel' },
      { name: 'Auto Role', value: 'auto_role' },
      { name: 'Prefix', value: 'prefix' }
    ];
    
    const filtered = choices.filter(choice => 
      choice.name.toLowerCase().includes(focusedValue.toLowerCase())
    );
    
    await interaction.respond(
      filtered.map(choice => ({ name: choice.name, value: choice.value }))
    );
  }
}

export default new ConfigCommand();
```

## Command Organization

### Directory Structure
```
src/commands/
├── admin/          # Administration commands
├── fun/            # Fun/entertainment commands  
├── info/           # Information commands
├── moderation/     # Moderation commands
├── music/          # Music commands
├── utility/        # Utility commands
├── developer/      # Developer/owner only commands
└── settings/       # Settings/configuration commands
```

### File Naming Convention
- Use PascalCase for file names: `UserInfo.js`, `BanUser.js`
- File names should match the main command name
- Use descriptive names that indicate functionality

## Advanced Features

### Components v2 Integration
```javascript
import {
  ContainerBuilder,
  TextDisplayBuilder,
  ButtonBuilder,
  ActionRowBuilder,
  MessageFlags,
  ButtonStyle
} from 'discord.js';

class ExampleCommand extends Command {
  async execute({ client, message, args }) {
    const container = new ContainerBuilder()
      .setAccentColor(0x5865F2)
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent('# Example Command\nThis uses Components v2!')
      )
      .addActionRowComponents(
        new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('example_button')
            .setLabel('Click Me')
            .setStyle(ButtonStyle.Primary)
        )
      );

    const sent = await message.reply({ 
      components: [container], 
      flags: MessageFlags.IsComponentsV2 
    });

    // Set up interaction collector
    const collector = sent.createMessageComponentCollector({ time: 60000 });
    
    collector.on('collect', async interaction => {
      if (interaction.user.id !== message.author.id) {
        return interaction.reply({ content: 'Not your command!', ephemeral: true });
      }
      
      await interaction.reply({ content: 'Button clicked!', ephemeral: true });
    });
  }
}
```

### Error Handling
```javascript
async execute({ client, message, args }) {
  try {
    // Command logic here
  } catch (error) {
    console.error(`Error in ${this.name} command:`, error);
    
    const errorEmbed = new EmbedBuilder()
      .setColor(0xED4245)
      .setTitle('Command Error')
      .setDescription('An error occurred while executing this command.')
      .setTimestamp();
    
    return message.reply({ embeds: [errorEmbed] });
  }
}
```

### Database Integration
```javascript
import { db } from '../../database/DatabaseManager.js';

async execute({ client, message, args }) {
  // Get user data
  const userData = db.user.getUserData(message.author.id);
  
  // Update guild settings
  db.guild.updateGuildData(message.guild.id, {
    setting: 'value'
  });
  
  // Check premium status
  const hasPremium = db.premium.hasUserPremium(message.author.id);
}
```

## Command Validation

### Input Validation
```javascript
async execute({ client, message, args }) {
  // Check argument count
  if (args.length < 1) {
    return message.reply('Please provide required arguments!');
  }
  
  // Validate user mention
  const user = message.mentions.users.first();
  if (!user) {
    return message.reply('Please mention a valid user!');
  }
  
  // Validate numeric input
  const amount = parseInt(args[0]);
  if (isNaN(amount) || amount < 1 || amount > 100) {
    return message.reply('Please provide a number between 1 and 100!');
  }
}
```

### Permission Validation
```javascript
async execute({ client, message, args }) {
  // Check user permissions
  if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
    return message.reply('You need Manage Messages permission!');
  }
  
  // Check bot permissions
  if (!message.guild.members.me.permissions.has(PermissionFlagsBits.BanMembers)) {
    return message.reply('I need Ban Members permission!');
  }
}
```

## Best Practices

1. **Always use try-catch blocks** for error handling
2. **Validate all user inputs** before processing
3. **Use descriptive variable names** and comments
4. **Implement both prefix and slash versions** for better UX
5. **Use autocomplete** for better slash command experience  
6. **Follow the permission system** for security
7. **Use database transactions** for data integrity
8. **Implement proper cooldowns** to prevent spam
9. **Use Components v2** for modern UI elements
10. **Test commands thoroughly** in development

## Debugging Commands

### Console Logging
```javascript
async execute({ client, message, args }) {
  console.log(`Command: ${this.name}`);
  console.log(`User: ${message.author.tag} (${message.author.id})`);
  console.log(`Guild: ${message.guild.name} (${message.guild.id})`);
  console.log(`Args:`, args);
  
  // Command logic
}
```

### Debug Flags
The bot supports debug flags that can be added to commands:
- `--verbose`: Enable verbose logging
- `--debug`: Enable debug mode
- `--trace`: Show stack traces on errors
- `--timing`: Show execution timing
- `--silent`: Suppress normal logging

Usage: `!command --debug --trace`

## Command Testing

### Manual Testing Checklist
- [ ] Command executes without errors
- [ ] All arguments are properly validated
- [ ] Permissions are correctly enforced
- [ ] Cooldowns work as expected
- [ ] Both prefix and slash versions work
- [ ] Autocomplete functions properly
- [ ] Error messages are user-friendly
- [ ] Database operations are successful
- [ ] Components/buttons work correctly

### Load Testing
Use the `--timing` flag to measure command performance and optimize slow operations.

## Troubleshooting

### Common Issues
1. **Command not loading**: Check file exports and syntax
2. **Slash command not registering**: Verify slashData format
3. **Permissions denied**: Check bot and user permission requirements
4. **Database errors**: Verify database schema and connections
5. **Autocomplete not working**: Check option type and autocomplete property

### Getting Help
- Check the logs in the workflow console
- Use debug flags for detailed error information
- Refer to the Discord.js documentation
- Check the bot's error logging channel