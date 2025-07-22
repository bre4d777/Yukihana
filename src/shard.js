
import { ClusterManager, HeartbeatManager } from 'discord-hybrid-sharding';
import { config } from '#config/config.js';

const manager = new ClusterManager('./src/index.js', {
    totalShards: 'auto',
    shardsPerClusters: 2,
    mode: 'process',
    token: config.token,
    respawn: true,
    restartMode: 'gracefulSwitch',
});

manager.extend(
    new HeartbeatManager({
        interval: 2000,
        maxMissedHeartbeats: 5,
    })
);

manager.on('clusterCreate', cluster => {
    console.log(`[Manager] ==> Launched Cluster ${cluster.id} [${cluster.shardList.join(', ')}]`);
    cluster.on('ready', () => console.log(`[Cluster ${cluster.id}] ==> Ready`));
    cluster.on('reconnecting', () => console.warn(`[Cluster ${cluster.id}] ==> Reconnecting...`));
    cluster.on('death', (p, code) => console.error(`[Cluster ${cluster.id}] ==> Died with exit code ${code}. Respawning...`));
    cluster.on('error', (e) => console.error(`[Cluster ${cluster.id}] ==> An error occurred:`, e));
});

manager.on('debug', msg => {
    if (!msg.includes('Heartbeat')) {
        console.log(`[Manager Debug] ${msg}`);
    }
});

const shutdown = () => {
    console.log('[Manager] ==> Shutting down all clusters...');
    process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

manager.spawn({ timeout: -1 })
    .then(() => console.log('[Manager] ==> All clusters are being launched.'))
    .catch(e => console.error('[Manager] ==> Error during spawn:', e));
