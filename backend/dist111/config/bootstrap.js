import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
// No await loadEnv() here to avoid import hangs
// 2. Now import config (process.env is ready)
import { config } from './env.js';
// 3. Now import and create logger (config is ready)
import winston from 'winston';
const consoleFormat = winston.format.combine(winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston.format.colorize(), winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    return `${timestamp} [${level}]: ${message} ${metaStr}`;
}));
const fileFormat = winston.format.combine(winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston.format.errors({ stack: true }), winston.format.json());
export const logger = winston.createLogger({
    level: config.logLevel,
    format: fileFormat,
    transports: [
        new winston.transports.Console({ format: consoleFormat }),
        new winston.transports.File({ filename: path.join('logs', 'error.log'), level: 'error', format: fileFormat }),
        new winston.transports.File({ filename: path.join('logs', 'warn.log'), level: 'warn', format: fileFormat }),
        new winston.transports.File({ filename: path.join('logs', 'combined.log'), format: fileFormat }),
        new winston.transports.File({ filename: path.join('logs', 'requests.log'), format: fileFormat }),
    ],
    exceptionHandlers: [
        new winston.transports.File({ filename: path.join('logs', 'exceptions.log') })
    ],
    rejectionHandlers: [
        new winston.transports.File({ filename: path.join('logs', 'rejections.log') })
    ]
});
export { config };
