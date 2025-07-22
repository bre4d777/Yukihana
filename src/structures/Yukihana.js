import { Client, GatewayIntentBits as G, Collection as C, Partials as P, Options as O } from 'discord.js';
import { ClusterClient as CC, getInfo as gi } from 'discord-hybrid-sharding';
import { REST } from '@discordjs/rest';
import { Routes as R } from 'discord-api-types/v10';
import { EventLoader as EL } from './EventLoader.js';
import { CommandHandler as CH } from './CommandHandler.js';
import { logger as l } from '../utils/logger.js';
import { config as c } from '../config/config.js';
import { db } from '../database/DatabaseManager.js';
import { emoji as e } from '../config/emoji.js';

let si = null;
try {
  si = gi();
} catch (error) {
  si = null;
}
const n = Date.now;

export class Yukihana extends Client {
    constructor() {
        const clientOptions = {
            intents: [G.Guilds, G.GuildMembers, G.GuildMessages, G.GuildVoiceStates, G.GuildMessageReactions, G.MessageContent],
            partials: [P.Channel, P.GuildMember, P.Message, P.User],
            makeCache: O.cacheWithLimits({
                MessageManager: 100,
                PresenceManager: 0,
                UserManager: 100,
            }),
            failIfNotExists: false,
            allowedMentions: { parse: ['users', 'roles'], repliedUser: false },
        };

        if (si) {
            clientOptions.shards = si.SHARD_LIST;
            clientOptions.shardCount = si.TOTAL_SHARDS;
        }

        super(clientOptions);

        this.cluster = si ? new CC(this) : null;
        this.commands = new C();
        this.logger = l;
        this.config = c;
        this.emoji = e;
        this.db = db;
        
        this.commandHandler = new CH(this);
        this.eventHandler = new EL(this);

        this.startTime = n();
        this.rest = new REST({ version: '10' }).setToken(c.token);
    }

    async init() {
        this.logger.info('Yukihana', `❄️ Initializing bot...`);
        try {
            await this.eventHandler.loadAllEvents();
            await this.commandHandler.loadCommands();
            await this.login(c.token);

            this.logger.success('Yukihana', `❄️ Bot has successfully initialized. 🌸`);
        } catch (error) {
            this.logger.error('Yukihana', '❄️ Failed to initialize bot cluster:', error);
            throw error;
        }
    }
    
    async cleanup() {
        this.logger.warn('Yukihana', `❄️ Starting cleanup for bot...`);
        try {
            await this.db.closeAll();
            this.destroy();
            this.logger.success('Yukihana', '❄️ Cleanup completed successfully. 🌸');
        } catch (error) {
            this.logger.error('Yukihana', '❄️ An error occurred during cleanup:', error);
        }
    }

    get uptime() {
        return n() - this.startTime;
    }
}