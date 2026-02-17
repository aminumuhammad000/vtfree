import CreatedApp from '../models/created_app.model.js';
import bcrypt from 'bcryptjs';
import { AdminGenerationService } from './admin_generation.service.js';
import { addBuildJob } from '../queues/app_build.queue.js';
export class AppCreationService {
    static async createNewApp(data) {
        // 1. Validate Package Name
        const existingApp = await CreatedApp.findOne({ package_name: data.package_name });
        if (existingApp) {
            throw new Error('Package name already taken');
        }
        // 2. Generate App ID (Use package name as requested)
        const app_id = data.package_name;
        // 3. Generate or Use Admin Credentials
        let adminEmail = data.owner_email;
        let adminPassword = '';
        if (data.admin_credentials && data.admin_credentials.email && data.admin_credentials.password) {
            adminEmail = data.admin_credentials.email;
            adminPassword = data.admin_credentials.password;
        }
        else {
            const creds = await AdminGenerationService.generateCredentials();
            adminPassword = creds.password;
        }
        const hashedPassword = await bcrypt.hash(adminPassword, 10);
        // 4. Create App Record
        const status = data.payment_status === 'pending' ? 'pending' : 'building';
        const payment_status = data.payment_status || 'paid';
        const newApp = new CreatedApp({
            app_id,
            owner_id: data.owner_id,
            app_name: data.app_name,
            package_name: data.package_name,
            platforms: data.platforms,
            branding: data.branding,
            services: data.services,
            company: data.company,
            status,
            payment_status,
            total_paid: payment_status === 'paid' ? 0 : 0, // Will be updated on actual payment
            admin_email: adminEmail,
            admin_password_hash: hashedPassword,
            publish_play_store: data.publish_play_store,
            publish_app_store: data.publish_app_store,
            publish_web: data.publish_web,
        });
        await newApp.save();
        // 5. Create Admin Account (We can create it now, it doesn't hurt)
        await AdminGenerationService.createAdminAccount({
            app_id,
            email: adminEmail,
            password_hash: hashedPassword,
            role: 'owner',
            created_by: data.owner_id
        });
        // 6. Trigger App Generation via Queue ONLY IF PAID
        if (payment_status === 'paid') {
            const targets = [];
            if (data.platforms.android)
                targets.push('android_apk');
            if (data.platforms.web)
                targets.push('web');
            if (targets.length === 0)
                targets.push('android_apk');
            await addBuildJob(app_id, {
                appId: app_id,
                options: {
                    app_id,
                    app_name: data.app_name,
                    package_name: data.package_name,
                    branding: data.branding,
                    server_url: process.env.API_BASE_URL || 'https://vua.vtfree.com/api',
                    targets,
                    target: targets[0],
                    user_email: data.owner_email
                }
            });
        }
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
