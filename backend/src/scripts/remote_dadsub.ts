import axios from 'axios';

const REMOTE_URL = 'https://api.vtfree.com.ng/api/v1';
const SUPER_ADMIN_EMAIL = 'admin@vtfree.com';
const SUPER_ADMIN_PASSWORD = 'Admin@12345';

const DADSUB_APP_ID = 'DADSUB';
const DADSUB_OWNER_EMAIL = 'dadsub@gmail.com';
const DADSUB_PASSWORD = 'Admin@123456';

async function remoteManagement() {
    try {
        console.log('🚀 Starting Remote Management...');

        // 1. Login to get Super Admin Token
        console.log('🔑 Logging in to remote server...');
        const loginRes = await axios.post(`${REMOTE_URL}/super-admin/login`, {
            email: SUPER_ADMIN_EMAIL,
            password: SUPER_ADMIN_PASSWORD
        });

        const token = loginRes.data.data.token;
        const authHeaders = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
        console.log('✅ Logged in successfully.');

        // 2. Delete existing App if any
        // Note: The public route for app details works, but delete requires auth.
        // We might need to find the internal MongoDB _id or just use the app_id if the route supports it.
        // Based on routes: router.delete('/:appId', VTfreeAppController.deleteApp);
        console.log(`🗑️  Attempting to delete old app ${DADSUB_APP_ID}...`);
        try {
            await axios.delete(`${REMOTE_URL}/vtfree/apps/${DADSUB_APP_ID}`, { headers: authHeaders });
            console.log('✅ Old app deleted successfully.');
        } catch (e: any) {
            console.log(`ℹ️  Delete info: ${e.response?.data?.message || e.message}`);
        }

        // 3. Create Fresh App
        // We use the vtfree/apps/create endpoint
        console.log('🆕 Creating fresh DADSUB app...');
        const createRes = await axios.post(`${REMOTE_URL}/vtfree/apps/create`, {
            app_name: 'DADSUB',
            package_name: 'com.dadsub.app',
            platforms: { android: true, ios: false, web: true },
            branding: {
                primary_color: '#e0b105',
                secondary_color: '#F4C20D',
                app_display_name: 'DADSUB',
                app_tagline: 'Quality Data & Airtime'
            },
            services: ['airtime', 'data', 'cable', 'electricity'],
            admin_credentials: {
                email: DADSUB_OWNER_EMAIL,
                password: DADSUB_PASSWORD
            },
            payment_method: 'wallet' // Bypass payment check if balance is sufficient or handled
        }, { headers: authHeaders });

        console.log('✅ Fresh App Created:', createRes.data.success ? 'Success' : 'Failed');
        if (!createRes.data.success) {
            console.log('❌ Error Details:', createRes.data);
        }

        console.log('\n✨ REMOTE DADSUB SETUP COMPLETE ✨');

    } catch (error: any) {
        console.error('❌ Remote Management Error:', error.response?.data || error.message);
    }
}

remoteManagement();
