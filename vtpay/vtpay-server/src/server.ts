import app from './app';
import config from './config';
import { connectDatabase } from './config/database';
import { logger } from './utils/logger';

const startServer = async (): Promise<void> => {
    try {
        // Connect to MongoDB
        await connectDatabase();

        // Initialize Zainpay Service with DB settings
        try {
            const { zainpayService } = await import('./services/ZainpayService');
            await zainpayService.refreshConfig();
        } catch (err) {
            logger.warn('Failed to initialize ZainpayService config (using defaults)', err);
        }

        try {
            const { payrantService } = await import('./services/PayrantService');
            await payrantService.refreshConfig();
        } catch (err) {
            logger.warn('Failed to initialize PayrantService config (using defaults)', err);
        }

        // Initialize Cron Jobs
        const { cronService } = await import('./services/CronService');
        cronService.startDepositClearanceJob();

        // Start Express server
        app.listen(config.port, () => {
            logger.info(`🚀 VTPay Server running on port ${config.port}`);
            logger.info(`🌍 Environment: ${config.nodeEnv}`);
            logger.info(`🔗 Zainpay API: ${config.zainpay.baseUrl}`);
        });
    } catch (error) {
        logger.error('❌ Failed to start server', error);
        process.exit(1);
    }
};

// Handle graceful shutdown
process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully...');
    process.exit(0);
});

process.on('SIGINT', () => {
    logger.info('SIGINT received, shutting down gracefully...');
    process.exit(0);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection', { promise, reason });
});

// Start the server
startServer();
