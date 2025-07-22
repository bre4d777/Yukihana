
import { Yukihana } from '#structures/Yukihana.js';
import { logger } from '#utils/logger.js';

const client = new Yukihana();

const main = async () => {
    try {
        await client.init();
        logger.success('Main', `Bot is fully initialized and running.`);
    } catch (error) {
        logger.error('Init', 'A critical error occurred during bot initialization:', error);
        process.exit(1);
    }
};

const shutdown = async (signal) => {
    logger.warn('Shutdown', `Received ${signal}. Starting graceful shutdown...`);
    try {
        await client.cleanup();
        logger.success('Shutdown', 'Cleanup complete. Exiting.');
        process.exit(0);
    } catch (error) {
        logger.error('Shutdown', 'Error during cleanup:', error);
        process.exit(1);
    }
};

process.on('unhandledRejection', (reason, promise) => {
    logger.error('UnhandledRejection', 'An unhandled promise rejection was caught:', reason);
    console.error(promise);
});

process.on('uncaughtException', (error, origin) => {
    logger.error('UncaughtException', `An uncaught exception was caught at: ${origin}`, error);
    shutdown('uncaughtException');
});

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

main();

export default client;
