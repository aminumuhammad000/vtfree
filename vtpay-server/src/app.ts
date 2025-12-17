import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import {
    authRoutes,
    virtualAccountRoutes,
    walletRoutes,
    transactionRoutes,
    bankRoutes,
    webhookRoutes,
    developerRoutes,
    payoutRoutes,
    kycRoutes,
    zainboxRoutes,
    adminRoutes,
} from './routes';
import config from './config';

const app: Application = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Zainpay-Signature'],
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: {
        success: false,
        message: 'Too many requests, please try again later',
    },
});

// Apply rate limiting to all requests except webhooks
app.use('/api', (req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith('/webhooks')) {
        return next();
    }
    return limiter(req, res, next);
});

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
    });
    next();
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
    res.json({
        success: true,
        message: 'VTPay Server is running',
        environment: config.nodeEnv,
        timestamp: new Date().toISOString(),
    });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/virtual-accounts', virtualAccountRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/banks', bankRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/developer', developerRoutes);
app.use('/api/payout', payoutRoutes);
app.use('/api/kyc', kycRoutes);
app.use('/api/zainbox', zainboxRoutes);
app.use('/api/admin', adminRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint not found',
    });
});

// Global error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        ...(config.nodeEnv === 'development' && { error: err.message }),
    });
});

export default app;
