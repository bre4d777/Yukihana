# Events Development Guide

## Overview
This guide covers the event system architecture, including how to create Discord events, custom events, and event handlers in the Yukihana bot framework.

## Event System Architecture

The Yukihana bot uses a sophisticated event system with the following components:

### 1. EventLoader (`src/structures/EventLoader.js`)
- Manages loading and organizing all events
- Supports hierarchical event structure with handlers
- Provides hot-reloading capabilities
- Handles event registration and cleanup

### 2. Event Handlers (`src/structures/event-handlers/`)
- Handle specific event types (Discord, custom, etc.)
- Provide registration and cleanup methods
- Allow for different event processing logic per type

### 3. Event Files (`src/events/`)
- Organized by event type directories
- Contain the actual event logic
- Support nested directory structures

## Directory Structure

```
src/
├── events/
│   ├── discord/         # Discord.js events
│   │   ├── ready.js
│   │   ├── Prefixcmd.js (messageCreate)
│   │   ├── slashcmd.js (interactionCreate)
│   │   └── ...
│   ├── custom/          # Custom application events
│   │   ├── userJoin.js
│   │   ├── guildLeave.js
│   │   └── ...
│   └── system/          # System events
│       ├── startup.js
│       ├── shutdown.js
│       └── ...
├── structures/
│   └── event-handlers/
│       ├── discord.js   # Discord event handler
│       ├── custom.js    # Custom event handler
│       └── system.js    # System event handler
```

## Creating Event Handlers

### Basic Event Handler Template
```javascript
// src/structures/event-handlers/example.js

export default class ExampleHandler {
  constructor(client) {
    this.client = client;
    this.registeredEvents = new Map();
  }

  async register(event) {
    try {
      // Custom registration logic
      const listener = (...args) => {
        try {
          event.execute(...args, this.client);
        } catch (error) {
          console.error(`Error in ${event.name}:`, error);
        }
      };

      // Register the event with your system
      this.registeredEvents.set(event.name, listener);
      
      return true;
    } catch (error) {
      console.error(`Failed to register event: ${event.name}`, error);
      return false;
    }
  }

  async unregister(eventName) {
    if (this.registeredEvents.has(eventName)) {
      // Cleanup logic
      this.registeredEvents.delete(eventName);
    }
  }

  async unregisterAll() {
    for (const [eventName, listener] of this.registeredEvents) {
      await this.unregister(eventName);
    }
    this.registeredEvents.clear();
  }
}
```

### Discord Event Handler
```javascript
// src/structures/event-handlers/discord.js

export default class DiscordHandler {
  constructor(client) {
    this.client = client;
    this.registeredEvents = new Map();
  }

  async register(event) {
    try {
      const listener = (...args) => {
        try {
          event.execute(...args, this.client);
        } catch (error) {
          console.error(`Error in Discord event ${event.name}:`, error);
        }
      };

      // Register with Discord.js client
      if (event.once) {
        this.client.once(event.name, listener);
      } else {
        this.client.on(event.name, listener);
      }

      this.registeredEvents.set(event.name, listener);
      return true;
    } catch (error) {
      console.error(`Failed to register Discord event: ${event.name}`, error);
      return false;
    }
  }

  async unregister(eventName) {
    if (this.registeredEvents.has(eventName)) {
      this.client.removeListener(eventName, this.registeredEvents.get(eventName));
      this.registeredEvents.delete(eventName);
    }
  }

  async unregisterAll() {
    for (const [eventName, listener] of this.registeredEvents) {
      this.client.removeListener(eventName, listener);
    }
    this.registeredEvents.clear();
  }
}
```

## Creating Discord Events

### Basic Event Structure
```javascript
// src/events/discord/eventName.js

export default {
  name: 'eventName',        // Discord.js event name
  once: false,              // true for events that should only fire once
  async execute(arg1, arg2, client) {
    // Event logic here
  }
};
```

### Common Discord Events

#### 1. Ready Event
```javascript
// src/events/discord/ready.js

import { logger } from '../../utils/logger.js';
import { ActivityType } from 'discord.js';

export default {
  name: 'ready',
  once: true,
  async execute(client) {
    logger.success('Bot', `Logged in as ${client.user.tag}`);
    logger.info('Bot', `Serving ${client.guilds.cache.size} guilds`);
    
    // Set bot activity
    client.user.setActivity({
      name: 'with Discord.js',
      type: ActivityType.Playing
    });
    
    // Initialize any startup tasks
    await initializeDatabase();
    await loadGuildSettings();
  }
};
```

#### 2. Message Create Event
```javascript
// src/events/discord/messageCreate.js

import { logger } from '../../utils/logger.js';

export default {
  name: 'messageCreate',
  async execute(message, client) {
    // Ignore bot messages
    if (message.author.bot) return;
    
    // Ignore DMs
    if (!message.guild) return;
    
    // Log message for moderation
    logger.debug('MessageCreate', `${message.author.tag}: ${message.content}`);
    
    // Handle prefix commands (usually done in a separate handler)
    // This is just an example - the actual bot uses Prefixcmd.js
  }
};
```

#### 3. Guild Join Event
```javascript
// src/events/discord/guildCreate.js

import { EmbedBuilder } from 'discord.js';
import { logger } from '../../utils/logger.js';
import { db } from '../../database/DatabaseManager.js';

export default {
  name: 'guildCreate',
  async execute(guild, client) {
    logger.info('GuildCreate', `Joined guild: ${guild.name} (${guild.id})`);
    
    // Initialize guild in database
    db.guild.createGuildData(guild.id, {
      name: guild.name,
      memberCount: guild.memberCount,
      joinedAt: Date.now()
    });
    
    // Send welcome message to system channel
    if (guild.systemChannel) {
      const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle('Thanks for adding me!')
        .setDescription('Use `/help` to see what I can do!')
        .setTimestamp();
        
      try {
        await guild.systemChannel.send({ embeds: [embed] });
      } catch (error) {
        logger.warn('GuildCreate', 'Could not send welcome message');
      }
    }
  }
};
```

#### 4. Interaction Create Event
```javascript
// src/events/discord/interactionCreate.js

import { logger } from '../../utils/logger.js';

export default {
  name: 'interactionCreate',
  async execute(interaction, client) {
    // Handle different interaction types
    if (interaction.isChatInputCommand()) {
      await handleChatInputCommand(interaction, client);
    } else if (interaction.isAutocomplete()) {
      await handleAutocomplete(interaction, client);
    } else if (interaction.isButton()) {
      await handleButton(interaction, client);
    } else if (interaction.isStringSelectMenu()) {
      await handleSelectMenu(interaction, client);
    }
  }
};

async function handleChatInputCommand(interaction, client) {
  // Slash command handling logic
}

async function handleAutocomplete(interaction, client) {
  // Autocomplete handling logic
}

async function handleButton(interaction, client) {
  // Button interaction handling logic
}

async function handleSelectMenu(interaction, client) {
  // Select menu handling logic
}
```

### Advanced Event Examples

#### Error Handling Event
```javascript
// src/events/discord/error.js

import { logger } from '../../utils/logger.js';

export default {
  name: 'error',
  async execute(error, client) {
    logger.error('Discord', 'Discord client error', error);
    
    // Send error to logging channel
    try {
      const errorChannel = await client.channels.fetch(process.env.ERROR_CHANNEL_ID);
      if (errorChannel) {
        await errorChannel.send({
          content: `\`\`\`js\n${error.stack || error.message}\`\`\``
        });
      }
    } catch (logError) {
      logger.error('Discord', 'Failed to log error to channel', logError);
    }
  }
};
```

#### Voice State Update Event
```javascript
// src/events/discord/voiceStateUpdate.js

import { logger } from '../../utils/logger.js';

export default {
  name: 'voiceStateUpdate',
  async execute(oldState, newState, client) {
    // User joined a voice channel
    if (!oldState.channel && newState.channel) {
      logger.debug('Voice', `${newState.member.user.tag} joined ${newState.channel.name}`);
      
      // Handle voice join logic
      await handleVoiceJoin(newState, client);
    }
    
    // User left a voice channel
    if (oldState.channel && !newState.channel) {
      logger.debug('Voice', `${oldState.member.user.tag} left ${oldState.channel.name}`);
      
      // Handle voice leave logic
      await handleVoiceLeave(oldState, client);
    }
    
    // User switched channels
    if (oldState.channel && newState.channel && oldState.channel.id !== newState.channel.id) {
      logger.debug('Voice', `${newState.member.user.tag} moved from ${oldState.channel.name} to ${newState.channel.name}`);
    }
  }
};

async function handleVoiceJoin(voiceState, client) {
  // Voice join logic
}

async function handleVoiceLeave(voiceState, client) {
  // Voice leave logic
}
```

## Creating Custom Events

### Custom Event Handler
```javascript
// src/structures/event-handlers/custom.js

export default class CustomHandler {
  constructor(client) {
    this.client = client;
    this.registeredEvents = new Map();
    this.eventEmitter = new EventEmitter();
  }

  async register(event) {
    try {
      const listener = (...args) => {
        try {
          event.execute(...args, this.client);
        } catch (error) {
          console.error(`Error in custom event ${event.name}:`, error);
        }
      };

      this.eventEmitter.on(event.name, listener);
      this.registeredEvents.set(event.name, listener);
      
      return true;
    } catch (error) {
      console.error(`Failed to register custom event: ${event.name}`, error);
      return false;
    }
  }

  // Emit custom events
  emit(eventName, ...args) {
    this.eventEmitter.emit(eventName, ...args);
  }

  async unregister(eventName) {
    if (this.registeredEvents.has(eventName)) {
      this.eventEmitter.removeListener(eventName, this.registeredEvents.get(eventName));
      this.registeredEvents.delete(eventName);
    }
  }

  async unregisterAll() {
    for (const [eventName, listener] of this.registeredEvents) {
      this.eventEmitter.removeListener(eventName, listener);
    }
    this.registeredEvents.clear();
  }
}
```

### Custom Event Examples
```javascript
// src/events/custom/userLevelUp.js

import { EmbedBuilder } from 'discord.js';
import { db } from '../../database/DatabaseManager.js';

export default {
  name: 'userLevelUp',
  async execute(userId, guildId, newLevel, client) {
    const user = await client.users.fetch(userId);
    const guild = client.guilds.cache.get(guildId);
    
    if (!user || !guild) return;
    
    // Create level up embed
    const embed = new EmbedBuilder()
      .setColor(0x00FF00)
      .setTitle('🎉 Level Up!')
      .setDescription(`${user.tag} reached level ${newLevel}!`)
      .setThumbnail(user.displayAvatarURL())
      .setTimestamp();
    
    // Find announcement channel
    const announceChannel = guild.channels.cache.find(
      ch => ch.name.includes('level') || ch.name.includes('announce')
    );
    
    if (announceChannel) {
      await announceChannel.send({ embeds: [embed] });
    }
    
    // Give rewards for certain levels
    if ([5, 10, 25, 50, 100].includes(newLevel)) {
      await giveRewards(userId, guildId, newLevel);
    }
  }
};
```

## Event Management

### Loading Events
```javascript
// The EventLoader automatically loads events on bot startup
// Events are loaded by scanning the events directory

// Manual loading example:
const eventLoader = new EventLoader(client);
await eventLoader.loadAllEvents();
```

### Reloading Events
```javascript
// Reload all events
await client.eventLoader.reloadEvents();

// Reload specific event type
await client.eventLoader.reloadEventType('discord');

// Reload specific event
await client.eventLoader.reloadSpecificEvent('ready', 'discord');
```

### Event Information
```javascript
// Get loaded events
const loadedEvents = client.eventLoader.getLoadedEvents();

// Get available handlers
const handlers = client.eventLoader.getHandlers();

// Get available event types
const eventTypes = client.eventLoader.getAvailableEventTypes();
```

## Best Practices

### 1. Error Handling
Always wrap event logic in try-catch blocks:
```javascript
export default {
  name: 'eventName',
  async execute(arg1, arg2, client) {
    try {
      // Event logic here
    } catch (error) {
      console.error(`Error in ${this.name} event:`, error);
      // Log to error channel if needed
    }
  }
};
```

### 2. Performance Considerations
- Avoid blocking operations in events
- Use async/await for database operations
- Implement rate limiting for frequent events

```javascript
export default {
  name: 'messageCreate',
  async execute(message, client) {
    // Use non-blocking operations
    setImmediate(async () => {
      await processMessage(message);
    });
  }
};
```

### 3. Event Organization
- Group related events in subdirectories
- Use descriptive file names
- Keep events focused on single responsibilities

### 4. Database Integration
```javascript
import { db } from '../../database/DatabaseManager.js';

export default {
  name: 'guildMemberAdd',
  async execute(member, client) {
    // Update member count
    await db.guild.updateGuildData(member.guild.id, {
      memberCount: member.guild.memberCount
    });
    
    // Log member join
    await db.user.createUserData(member.id, {
      joinedAt: Date.now(),
      guildId: member.guild.id
    });
  }
};
```

### 5. Logging
Use the logger utility for consistent logging:
```javascript
import { logger } from '../../utils/logger.js';

export default {
  name: 'eventName',
  async execute(client) {
    logger.info('EventName', 'Event executed successfully');
    logger.debug('EventName', 'Debug information');
    logger.warn('EventName', 'Warning message');
    logger.error('EventName', 'Error occurred', error);
  }
};
```

## Debugging Events

### Event Monitoring
```javascript
// Add to any event for debugging
export default {
  name: 'messageCreate',
  async execute(message, client) {
    console.log('Event triggered:', {
      eventName: 'messageCreate',
      user: message.author.tag,
      guild: message.guild?.name,
      timestamp: new Date().toISOString()
    });
    
    // Event logic
  }
};
```

### Performance Monitoring
```javascript
export default {
  name: 'eventName',
  async execute(client) {
    const start = Date.now();
    
    try {
      // Event logic
    } finally {
      const duration = Date.now() - start;
      if (duration > 100) {
        logger.warn('Performance', `Event ${this.name} took ${duration}ms`);
      }
    }
  }
};
```

## Troubleshooting

### Common Issues
1. **Event not firing**: Check event name matches Discord.js event names
2. **Handler not found**: Ensure handler file exists in event-handlers directory
3. **Event loading failed**: Check file exports and syntax
4. **Memory leaks**: Ensure proper event cleanup in unregister methods

### Testing Events
```javascript
// Create test events for development
export default {
  name: 'ready',
  once: true,
  async execute(client) {
    if (process.env.NODE_ENV === 'development') {
      // Emit test events
      setTimeout(() => {
        client.eventLoader.handlers.get('custom')?.emit('testEvent', 'data');
      }, 5000);
    }
  }
};
```

## Event System Integration

The event system integrates seamlessly with:
- **Command System**: Events can trigger command-like responses
- **Database System**: Events can update database records
- **Logging System**: All events can be logged and monitored
- **Premium System**: Events can check premium status
- **Permission System**: Events can enforce permissions

This comprehensive event system provides flexibility and maintainability for complex Discord bot functionality.