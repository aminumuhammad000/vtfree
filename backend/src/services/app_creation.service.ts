import CreatedApp from '../models/created_app.model.js';
import AppAdmin from '../models/app_admin.model.js';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { AdminGenerationService } from './admin_generation.service.js';

export class AppCreationService {
    static async createNewApp(data: {
        owner_id: string;
        owner_email: string;
        app_name: string;
        package_name: string;
        platforms: { android: boolean; ios: boolean; web: boolean };
        branding: { primary_color: string; secondary_color: string; logo_url?: string };
        services: string[];
    }) {
        // 1. Validate Package Name
        const existingApp = await CreatedApp.findOne({ package_name: data.package_name });
        if (existingApp) {
            throw new Error('Package name already taken');
        }

        // 2. Generate App ID
        const app_id = `app_${uuidv4().split('-')[0]}`;

        // 3. Generate Admin Credentials
        const adminCredentials = await AdminGenerationService.generateCredentials();
        const hashedPassword = await bcrypt.hash(adminCredentials.password, 10);

        // 4. Create App Record
        const newApp = new CreatedApp({
            app_id,
            owner_id: data.owner_id,
            app_name: data.app_name,
            package_name: data.package_name,
            platforms: data.platforms,
            branding: data.branding,
            services: data.services,
            status: 'pending',
            admin_email: data.owner_email,
            admin_password_hash: hashedPassword,
        });

        await newApp.save();

        // 5. Create Admin Account
        await AdminGenerationService.createAdminAccount({
            app_id,
            email: data.owner_email,
            password_hash: hashedPassword,
            role: 'owner',
            created_by: data.owner_id
        });

        return {
            app: newApp,
            admin_credentials: {
                email: data.owner_email,
                password: adminCredentials.password,
                login_url: `https://admin.vtfree.com/login?app=${app_id}`
            }
        };
    }
}
