# Development Workflow Guide

## Overview
Complete development guide for working with the Yukihana Discord bot framework, including setup, development practices, and deployment procedures.

## Quick Start Development

### 1. Environment Setup
```bash
# Clone or access the project
cd your-bot-project

# Install dependencies (handled automatically in Replit)
npm install

# Set up environment variables
# Create .env file with required secrets
```

### 2. Required Environment Variables
```env
# Discord Bot Configuration
DISCORD_TOKEN=your_bot_token_here
CLIENT_ID=your_bot_client_id

# Database Configuration (SQLite - auto-configured)
DB_PATH=./database/

# Optional: Logging and Monitoring
ERROR_CHANNEL_ID=channel_id_for_error_logging
LOG_CHANNEL_ID=channel_id_for_general_logging
BACKUP_CHANNEL_ID=channel_id_for_database_backups

# Premium System (optional)
PREMIUM_ENABLED=true

# Development Settings
NODE_ENV=development
DEBUG_LEVEL=info
```

### 3. Development Commands
```bash
# Start the bot
npm start

# Start with auto-restart (development)
npm run dev

# Run tests
npm test

# Update slash commands
!updateslash  # (in Discord, owner only)
```

## Project Structure Deep Dive

```
yukihana-bot/
├── src/
│   ├── index.js              # Main entry point
│   ├── shard.js             # Sharding logic (if enabled)
│   ├── structures/          # Core framework classes
│   │   ├── Command.js       # Base command class
│   │   ├── CommandHandler.js # Command loading and management
│   │   ├── EventLoader.js   # Event system management
│   │   ├── Yukihana.js      # Extended Discord client
│   │   └── event-handlers/  # Event type handlers
│   ├── commands/            # Command modules by category
│   │   ├── admin/
│   │   ├── fun/
│   │   ├── info/
│   │   ├── moderation/
│   │   ├── settings/
│   │   └── developer/       # Owner-only commands
│   ├── events/              # Event handlers by type
│   │   ├── discord/         # Discord.js events
│   │   ├── custom/          # Custom application events
│   │   └── system/          # System/lifecycle events
│   ├── database/           # Database models and management
│   │   ├── DatabaseManager.js # Main database interface
│   │   ├── Guild.js        # Guild-specific data
│   │   ├── User.js         # User profiles and data
│   │   ├── Premium.js      # Premium subscription system
│   │   └── Management.js   # Bot management data
│   ├── config/             # Configuration files
│   │   ├── config.js       # Main bot configuration
│   │   └── emoji.js        # Emoji definitions
│   └── utils/              # Utility functions
│       ├── logger.js       # Logging system
│       ├── permissionUtil.js # Permission checks
│       ├── cooldownManager.js # Command cooldowns
│       └── formatters.js   # Data formatting utilities
├── docs/                   # Documentation
├── database/               # SQLite database files
├── package.json
└── README.md
```

## Development Workflow

### 1. Creating New Commands

#### Step 1: Choose Category and Create File
```bash
# Create command file in appropriate category
touch src/commands/utility/NewCommand.js
```

#### Step 2: Implement Command Structure
```javascript
// src/commands/utility/NewCommand.js
import { Command } from '../../structures/Command.js';
import { EmbedBuilder } from 'discord.js';

class NewCommand extends Command {
  constructor() {
    super({
      name: 'newcommand',
      description: 'Description of what the command does',
      usage: 'newcommand [arguments]',
      aliases: ['nc', 'new'],
      category: 'utility',
      cooldown: 3,
      enabledSlash: true,
      slashData: {
        name: ['utility', 'newcommand'],
        description: 'Description of what the command does',
        options: [
          // Add options as needed
        ]
      }
    });
  }

  async execute({ client, message, args }) {
    // Prefix command implementation
  }

  async slashExecute({ interaction, client }) {
    // Slash command implementation
  }

  async autocomplete({ interaction }) {
    // Autocomplete implementation (if needed)
  }
}

export default new NewCommand();
```

#### Step 3: Test Command
```bash
# Restart bot to load new command
# In Discord: !rl all  (reload all commands)
# Or: !rl command newcommand  (reload specific command)
```

#### Step 4: Register Slash Command
```bash
# In Discord (owner only): !updateslash
# This registers all slash-enabled commands with Discord
```

### 2. Creating New Events

#### Step 1: Choose Event Type and Create Handler (if needed)
```javascript
// src/structures/event-handlers/custom.js (if creating custom events)
export default class CustomHandler {
  constructor(client) {
    this.client = client;
    this.registeredEvents = new Map();
  }

  async register(event) {
    // Registration logic
  }

  async unregister(eventName) {
    // Cleanup logic
  }

  async unregisterAll() {
    // Mass cleanup
  }
}
```

#### Step 2: Create Event File
```javascript
// src/events/discord/newEvent.js
import { logger } from '../../utils/logger.js';

export default {
  name: 'guildMemberAdd',  // Discord.js event name
  async execute(member, client) {
    logger.info('MemberJoin', `${member.user.tag} joined ${member.guild.name}`);
    
    // Event logic here
  }
};
```

#### Step 3: Test Event
```bash
# Events are auto-loaded on bot restart
# Trigger the event in Discord to test
```

### 3. Database Development

#### Working with Guild Data
```javascript
import { db } from '../../database/DatabaseManager.js';

// Create/update guild data
db.guild.createGuildData(guildId, {
  name: guildName,
  prefix: '!',
  settings: {}
});

// Get guild data
const guildData = db.guild.getGuildData(guildId);

// Update specific setting
db.guild.updateGuildData(guildId, { prefix: '?' });
```

#### Working with User Data
```javascript
// Create user profile
db.user.createUserData(userId, {
  tag: userTag,
  joinedAt: Date.now(),
  level: 1
});

// Get user data
const userData = db.user.getUserData(userId);

// Update user stats
db.user.updateUserData(userId, { level: 2 });
```

#### Working with Premium System
```javascript
// Grant user premium
db.premium.grantUserPremium(userId, grantedBy, expiresAt, reason);

// Check premium status
const hasPremium = db.premium.hasUserPremium(userId);

// Get premium stats
const stats = db.premium.getStats();
```

### 4. Components v2 Development

#### Creating Interactive Components
```javascript
import {
  ContainerBuilder,
  TextDisplayBuilder,
  ButtonBuilder,
  ActionRowBuilder,
  MessageFlags,
  ButtonStyle
} from 'discord.js';

// Build container with components
const container = new ContainerBuilder()
  .setAccentColor(0x5865F2)
  .addTextDisplayComponents(
    new TextDisplayBuilder().setContent('# Interactive Message\nClick the buttons below!')
  )
  .addActionRowComponents(
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('example_confirm')
        .setLabel('Confirm')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('example_cancel')
        .setLabel('Cancel')
        .setStyle(ButtonStyle.Danger)
    )
  );

// Send message with components
const sent = await message.reply({ 
  components: [container], 
  flags: MessageFlags.IsComponentsV2 
});

// Handle interactions
const collector = sent.createMessageComponentCollector({ time: 60000 });
collector.on('collect', async interaction => {
  // Handle button clicks
});
```

## Testing and Quality Assurance

### 1. Manual Testing Checklist
- [ ] Command loads without errors
- [ ] Prefix version works correctly
- [ ] Slash version works correctly
- [ ] Autocomplete functions properly
- [ ] Permissions are enforced
- [ ] Cooldowns work as expected
- [ ] Database operations succeed
- [ ] Error handling works
- [ ] Components interact properly

### 2. Debugging Tools

#### Console Logging
```javascript
// Add to commands/events for debugging
console.log('Debug info:', {
  command: this.name,
  user: message.author.tag,
  args: args,
  timestamp: new Date().toISOString()
});
```

#### Debug Flags
Use debug flags in commands for detailed information:
```bash
# In Discord
!command --debug --trace --timing
```

#### Bot Owner Commands
```bash
# Reload commands
!rl all                    # Reload all commands
!rl command commandname    # Reload specific command

# Update slash commands
!updateslash              # Register slash commands with Discord

# Premium management
!premium grant user 123456789 30d    # Grant user premium
!premium stats                       # View premium statistics

# Database management (via custom commands if implemented)
!backup                   # Manual database backup
!dbstats                 # Database statistics
```

### 3. Error Monitoring

#### Error Logging
The bot automatically logs errors to:
- Console output
- Error logging channel (if configured)
- Log files (if file logging enabled)

#### Common Error Patterns
```javascript
// Wrap risky operations
try {
  await riskyOperation();
} catch (error) {
  logger.error('CommandName', 'Operation failed', error);
  
  // User-friendly error message
  return message.reply('Something went wrong! Please try again.');
}
```

## Performance Optimization

### 1. Command Performance
```javascript
// Measure command execution time
const startTime = Date.now();
await commandLogic();
const duration = Date.now() - startTime;

if (duration > 1000) {
  logger.warn('Performance', `Command ${this.name} took ${duration}ms`);
}
```

### 2. Database Optimization
```javascript
// Batch database operations
const batch = db.user.prepare(`
  INSERT OR REPLACE INTO users (id, data) 
  VALUES (?, ?)
`);

for (const user of users) {
  batch.run(user.id, JSON.stringify(user.data));
}
```

### 3. Memory Management
```javascript
// Clean up large objects and collections periodically
setInterval(() => {
  // Clear expired cooldowns
  cooldownManager.cleanup();
  
  // Clear old user states
  this.userStates.clear();
}, 10 * 60 * 1000); // Every 10 minutes
```

## Security Best Practices

### 1. Input Validation
```javascript
// Always validate user inputs
async execute({ client, message, args }) {
  // Validate argument count
  if (args.length < 1) {
    return message.reply('Please provide required arguments!');
  }

  // Validate user mentions
  const user = message.mentions.users.first();
  if (!user || user.bot) {
    return message.reply('Please mention a valid user!');
  }

  // Validate numeric inputs
  const amount = parseInt(args[0]);
  if (isNaN(amount) || amount < 1 || amount > 100) {
    return message.reply('Amount must be between 1 and 100!');
  }
}
```

### 2. Permission Checks
```javascript
// Always check permissions before dangerous operations
if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
  return message.reply('You need administrator permissions!');
}

if (!message.guild.members.me.permissions.has(PermissionFlagsBits.ManageMessages)) {
  return message.reply('I need Manage Messages permission!');
}
```

### 3. Rate Limiting
```javascript
// Implement custom rate limiting for sensitive operations
const rateLimitMap = new Map();

async execute({ client, message, args }) {
  const userId = message.author.id;
  const now = Date.now();
  const userLimit = rateLimitMap.get(userId);

  if (userLimit && now - userLimit < 60000) {
    return message.reply('Please wait before using this command again!');
  }

  rateLimitMap.set(userId, now);
  // Command logic
}
```

## Deployment Preparation

### 1. Environment Configuration
```javascript
// config/config.js - Production settings
export const config = {
  token: process.env.DISCORD_TOKEN,
  clientId: process.env.CLIENT_ID,
  
  // Production settings
  environment: process.env.NODE_ENV || 'development',
  logLevel: process.env.DEBUG_LEVEL || 'info',
  
  // Feature flags
  sharding: process.env.SHARDING_ENABLED === 'true',
  premium: process.env.PREMIUM_ENABLED === 'true',
  
  // Owner permissions
  ownerIds: (process.env.OWNER_IDS || '').split(',').filter(Boolean)
};
```

### 2. Database Migrations
```javascript
// Implement migration system for database schema changes
async function runMigrations() {
  const currentVersion = db.getSchemaVersion();
  const targetVersion = 5; // Update as needed

  if (currentVersion < targetVersion) {
    await runMigration(currentVersion, targetVersion);
  }
}
```

### 3. Health Monitoring
```javascript
// Add health check endpoint or command
class HealthCommand extends Command {
  async execute({ client, message }) {
    const health = {
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      guilds: client.guilds.cache.size,
      users: client.users.cache.size,
      ping: client.ws.ping
    };

    // Return health status
  }
}
```

## Continuous Integration

### 1. Pre-deployment Checklist
- [ ] All tests pass
- [ ] No console errors on startup
- [ ] Database migrations complete
- [ ] Environment variables configured
- [ ] Slash commands registered
- [ ] Permissions tested
- [ ] Error handling verified
- [ ] Documentation updated

### 2. Monitoring Setup
```javascript
// Add monitoring hooks
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Process', 'Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  logger.error('Process', 'Uncaught Exception:', error);
  process.exit(1);
});
```

### 3. Backup Procedures
```javascript
// Automated backup system (already implemented)
setInterval(async () => {
  await createDatabaseBackup();
}, 30 * 60 * 1000); // Every 30 minutes
```

## Advanced Development Topics

### 1. Custom Event System
Extend the event system for application-specific events:
```javascript
// Emit custom events
client.eventLoader.handlers.get('custom')?.emit('userLevelUp', userId, guildId, newLevel);
```

### 2. Plugin System
Create a plugin architecture for modular features:
```javascript
// Plugin loader
class PluginManager {
  async loadPlugin(pluginPath) {
    const plugin = await import(pluginPath);
    await plugin.initialize(client);
  }
}
```

### 3. API Integration
Add external API integrations:
```javascript
// API service wrapper
class APIService {
  async makeRequest(endpoint, options = {}) {
    try {
      const response = await fetch(endpoint, options);
      return await response.json();
    } catch (error) {
      logger.error('API', `Request failed: ${endpoint}`, error);
      throw error;
    }
  }
}
```

This comprehensive development workflow ensures maintainable, scalable, and professional Discord bot development with the Yukihana framework.