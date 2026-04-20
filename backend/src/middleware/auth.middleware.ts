// middleware/auth.middleware.ts
import { NextFunction, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/bootstrap.js';
import { AuthRequest } from '../types/index.js';
import { ApiResponse } from '../utils/response.js';

export const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1] || (req.query.token as string);

    if (!token) {
      return ApiResponse.error(res, 'No token provided', 401);
    }

    const decoded = jwt.verify(token, config.jwtSecret) as any;
    req.user = {
      id: decoded.user_id || decoded.id,
      email: decoded.email,
      role: decoded.role,
      app_id: decoded.app_id,
      type: decoded.type
    };



    console.log(`[AuthMiddleware] Decoded user: ${JSON.stringify(req.user)}`);
    next();
  } catch (error) {
    return ApiResponse.error(res, 'Invalid token', 401);
  }
};

// Alias for compatibility
export const authenticate = authMiddleware;



export const authenticateSuperAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  authMiddleware(req, res, () => {
    if (req.user?.type === 'super_admin' || req.user?.role === 'admin') {
      next();
    } else {
      console.warn(`[AuthMiddleware] SuperAdmin access denied. User: ${JSON.stringify(req.user)}`);
      return ApiResponse.error(res, 'Unauthorized: Super Admin access required', 403);
    }
  });
};

export const authorize = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || (req.user.role && !roles.includes(req.user.role))) {
      return ApiResponse.error(res, 'Unauthorized access', 403);
    }
    next();
  };
};