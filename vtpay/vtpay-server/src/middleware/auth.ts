import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config';
import { User } from '../models';

export interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        email: string;
    };
}

/**
 * JWT Authentication Middleware
 */
export const authenticate = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;
        const apiKey = req.headers['x-api-key'] as string;

        // 1. Check for API Key first
        if (apiKey) {
            const user = await User.findOne({ apiKey });
            if (!user) {
                res.status(401).json({
                    success: false,
                    message: 'Invalid API Key',
                });
                return;
            }

            if (user.status !== 'active') {
                res.status(403).json({
                    success: false,
                    message: 'Account is not active',
                });
                return;
            }

            req.user = {
                id: user._id.toString(),
                email: user.email,
            };
            next();
            return;
        }

        // 2. Check for Bearer Token
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({
                success: false,
                message: 'No token or API key provided',
            });
            return;
        }

        const token = authHeader.split(' ')[1];

        try {
            const decoded = jwt.verify(token, config.jwt.secret) as { id: string; email: string };

            // Verify user still exists and is active
            const user = await User.findById(decoded.id);
            if (!user) {
                res.status(401).json({
                    success: false,
                    message: 'User not found',
                });
                return;
            }

            if (user.status !== 'active') {
                res.status(403).json({
                    success: false,
                    message: 'Account is not active',
                });
                return;
            }

            req.user = {
                id: decoded.id,
                email: decoded.email,
            };

            next();
        } catch (jwtError) {
            res.status(401).json({
                success: false,
                message: 'Invalid token',
            });
            return;
        }
    } catch (error) {
        console.error('Authentication error:', error);
        res.status(500).json({
            success: false,
            message: 'Authentication error',
        });
    }
};

/**
 * Generate JWT token
 */
export const generateToken = (userId: string, email: string): string => {
    return jwt.sign(
        { id: userId, email },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn as any }
    );
};

/**
 * Optional authentication - doesn't fail if no token
 */
export const optionalAuth = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;

        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];

            try {
                const decoded = jwt.verify(token, config.jwt.secret) as { id: string; email: string };
                req.user = {
                    id: decoded.id,
                    email: decoded.email,
                };
            } catch {
                // Token invalid, but continue without user
            }
        }

        next();
    } catch (error) {
        next();
    }
};

export default authenticate;
