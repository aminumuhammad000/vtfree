import app from './app';
import config from './config';
import { connectDatabase } from './config/database';

const startServer = async (): Promise<void> => {
    try {
        // Connect to MongoDB
        await connectDatabase();

        // Initialize Zainpay Service with DB settings
        const { zainpayService } = await import('./services/ZainpayService');
        await zainpayService.refreshConfig();

        // Start Express server
        app.listen(config.port, () => {
            console.log('');
            console.log('╔═══════════════════════════════════════════════════════════╗');
            console.log('║                                                           ║');
            console.log('║   🚀 VTPay Server - Zainpay Payment Gateway               ║');
            console.log('║                                                           ║');
            console.log(`║   📍 Server running on port ${config.port}                        ║`);
            console.log(`║   🌍 Environment: ${config.nodeEnv.padEnd(38)}║`);
            console.log(`║   🔗 Zainpay API: ${config.zainpay.baseUrl.slice(0, 35).padEnd(38)}║`);
            console.log('║                                                           ║');
            console.log('╚═══════════════════════════════════════════════════════════╝');
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

// Handle graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully...');
    process.exit(0);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Start the server
startServer();
