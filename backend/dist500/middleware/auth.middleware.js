import jwt from 'jsonwebtoken';
import { config } from '../config/bootstrap.js';
import { ApiResponse } from '../utils/response.js';
export const authMiddleware = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1] || req.query.token;
        if (!token) {
            return ApiResponse.error(res, 'No token provided', 401);
        }
        const decoded = jwt.verify(token, config.jwtSecret);
        req.user = {
            id: decoded.user_id || decoded.id,
            email: decoded.email,
            role: decoded.role,
            app_id: decoded.app_id,
            type: decoded.type
        };
        console.log(`[AuthMiddleware] Decoded user: ${JSON.stringify(req.user)}`);
        next();
    }
    catch (error) {
        return ApiResponse.error(res, 'Invalid token', 401);
    }
};
// Alias for compatibility
export const authenticate = authMiddleware;
export const authenticateSuperAdmin = (req, res, next) => {
    authMiddleware(req, res, () => {
        if (req.user?.type === 'super_admin' || req.user?.role === 'admin') {
            next();
        }
        else {
            console.warn(`[AuthMiddleware] SuperAdmin access denied. User: ${JSON.stringify(req.user)}`);
            return ApiResponse.error(res, 'Unauthorized: Super Admin access required', 403);
        }
    });
};
export const authorize = (roles) => {
    return (req, res, next) => {
        if (!req.user || (req.user.role && !roles.includes(req.user.role))) {
            return ApiResponse.error(res, 'Unauthorized access', 403);
        }
        next();
    };
};
