import { Queue } from 'bullmq';
import { redisConfig } from '../config/redis.config.js';

export const APP_BUILD_QUEUE = 'app-build-queue';

let _appBuildQueue: Queue | null = null;

export const getAppBuildQueue = () => {
    if (!_appBuildQueue) {
        _appBuildQueue = new Queue(APP_BUILD_QUEUE, {
            connection: redisConfig,
            defaultJobOptions: {
                attempts: 3,
                backoff: {
                    type: 'exponential',
                    delay: 5000,
                },
                removeOnComplete: true,
                removeOnFail: false,
            },
        });

        _appBuildQueue.on('error', (err) => {
            console.error('Redis Queue Error:', err.message);
        });
    }
    return _appBuildQueue;
};

export const addBuildJob = async (appId: string, buildData: any) => {
    const queue = getAppBuildQueue();
    return await queue.add('build-app', { appId, ...buildData }, {
        jobId: appId,
    });
};
