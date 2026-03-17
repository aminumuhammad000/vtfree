import AppAdmin from '../models/app_admin.model.js';
export class AdminGenerationService {
    static async generateCredentials() {
        const password = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
        return { password };
    }
    static async createAdminAccount(data) {
        const newAdmin = new AppAdmin({
            app_id: data.app_id,
            email: data.email,
            password: data.password_hash,
            role: data.role,
            permissions: ['all'],
            status: 'active',
            created_by: data.created_by,
        });
        await newAdmin.save();
        return newAdmin;
    }
}
