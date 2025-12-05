import { Request, Response, NextFunction } from 'express';

export class MultiTenantService {
    static getAppId(req: Request): string {
        // 1. Check header
        const headerAppId = req.headers['x-app-id'] as string;
        if (headerAppId) return headerAppId;

        // 2. Check user token (if authenticated)
        const user = (req as any).user;
        if (user && user.app_id) return user.app_id;

        // 3. Default
        return 'default_app';
    }

    static filterQuery(req: Request, query: any = {}) {
        const app_id = this.getAppId(req);
        return { ...query, app_id };
    }
}
