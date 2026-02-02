import CreatedApp from '../models/created_app.model.js';
import AppAdmin from '../models/app_admin.model.js';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { AdminGenerationService } from './admin_generation.service.js';
import { addBuildJob } from '../queues/app_build.queue.js';

export class AppCreationService {
    static async createNewApp(data: {
        owner_id: string;
        owner_email: string;
        app_name: string;
        package_name: string;
        platforms: { android: boolean; ios: boolean; web: boolean };
        branding: { primary_color: string; secondary_color: string; logo_url?: string };
        services: string[];
        company?: { name?: string; email?: string; phone?: string; address?: string };
        admin_credentials?: { email: string; password: string };
    }) {
        // 1. Validate Package Name
        const existingApp = await CreatedApp.findOne({ package_name: data.package_name });
        if (existingApp) {
            throw new Error('Package name already taken');
        }

        // 2. Generate App ID
        const app_id = `app_${uuidv4().split('-')[0]}`;

        // 3. Generate or Use Admin Credentials
        let adminEmail = data.owner_email;
        let adminPassword = '';

        if (data.admin_credentials && data.admin_credentials.email && data.admin_credentials.password) {
            adminEmail = data.admin_credentials.email;
            adminPassword = data.admin_credentials.password;
        } else {
            const creds = await AdminGenerationService.generateCredentials();
            adminPassword = creds.password;
        }

        const hashedPassword = await bcrypt.hash(adminPassword, 10);

        // 4. Create App Record
        const newApp = new CreatedApp({
            app_id,
            owner_id: data.owner_id,
            app_name: data.app_name,
            package_name: data.package_name,
            platforms: data.platforms,
            branding: data.branding,
            services: data.services,
            company: data.company, // Add company details
            status: 'building',
            admin_email: adminEmail,
            admin_password_hash: hashedPassword,
        });

        await newApp.save();

        // 5. Create Admin Account
        await AdminGenerationService.createAdminAccount({
            app_id,
            email: adminEmail,
            password_hash: hashedPassword,
            role: 'owner',
            created_by: data.owner_id
        });

        // 6. Trigger App Generation via Queue
        await addBuildJob(app_id, {
            appId: app_id,
            options: {
                app_id,
                app_name: data.app_name,
                package_name: data.package_name,
                branding: data.branding,
                server_url: process.env.API_BASE_URL || 'https://vua.vtfree.com/api',
                target: data.platforms.android ? 'android_apk' : (data.platforms.web ? 'web' : 'android_apk')
            }
        });

        return {
            app: newApp,
            admin_credentials: {
                email: adminEmail,
                password: adminPassword,
                login_url: `https://admin.vtfree.com/login?app=${app_id}`
            }
        };
    }
}
