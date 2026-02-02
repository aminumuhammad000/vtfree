import { Queue } from 'bullmq';
import { redisConfig } from '../config/redis.config.js';

export const APP_BUILD_QUEUE = 'app-build-queue';

export const appBuildQueue = new Queue(APP_BUILD_QUEUE, {
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

export const addBuildJob = async (appId: string, buildData: any) => {
    return await appBuildQueue.add('build-app', { appId, ...buildData }, {
        jobId: appId, // Ensure uniqueness per app if desired, or omit for multiple builds
    });
};
