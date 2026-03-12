export class MultiTenantService {
    static getAppId(req) {
        // 1. Check header
        const headerAppId = req.headers['x-app-id'];
        if (headerAppId)
            return headerAppId;
        // 2. Check user token (if authenticated)
        const user = req.user;
        if (user && user.app_id)
            return user.app_id;
        // 3. Default
        return 'default_app';
    }
    static filterQuery(req, query = {}) {
        const app_id = this.getAppId(req);
        return { ...query, app_id };
    }
}
