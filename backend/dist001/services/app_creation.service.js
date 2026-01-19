import CreatedApp from '../models/created_app.model.js';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { AdminGenerationService } from './admin_generation.service.js';
import { AppGeneratorService } from './app_generator.service.js';
export class AppCreationService {
    static async createNewApp(data) {
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
        }
        else {
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
        // 6. Trigger App Generation (Async)
        // We don't await this to keep the API response fast, but we should log errors.
        AppGeneratorService.generateSourceCode({
            app_id,
            app_name: data.app_name,
            package_name: data.package_name,
            branding: data.branding,
            owner_id: data.owner_id
        }).then(async () => {
            console.log(`[AppCreation] App generated for ${app_id}`);
            // Update status to live or provisioned
            newApp.status = 'live'; // or 'provisioned'
            await newApp.save();
        }).catch(async (err) => {
            console.error(`[AppCreation] Generation failed for ${app_id}:`, err);
            newApp.status = 'suspended'; // failed state
            await newApp.save();
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
