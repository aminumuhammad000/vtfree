import { Queue } from 'bullmq';
import { redisConfig } from '../config/redis.config.js';
export const APP_BUILD_QUEUE = 'app-build-queue';
let _appBuildQueue = null;
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
import CreatedApp from '../models/created_app.model.js';
export const addBuildJob = async (appId, buildData) => {
    const queue = getAppBuildQueue();
    // Check queue stats to inform the user
    const counts = await queue.getJobCounts('waiting', 'active');
    const position = counts.waiting + (counts.active > 0 ? 1 : 0);
    // Update app status to queued
    await CreatedApp.updateOne({ app_id: appId }, {
        status: 'pending',
        build_status_full: 'queued',
        build_stage: position > 0 ? `Waiting in queue (Position #${position})` : 'Initializing build...'
    });
    return await queue.add('build-app', { appId, ...buildData }, {
        jobId: appId,
        removeOnComplete: true,
        removeOnFail: false,
    });
};
