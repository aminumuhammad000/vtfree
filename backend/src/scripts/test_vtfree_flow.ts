import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api/v1';
let vtfreeToken = '';
let appAdminToken = '';
let appId = '';

async function testFlow() {
    try {
        console.log('🚀 Starting VTfree Platform Integration Test...\n');

        // 1. Register VTfree User
        console.log('1️⃣  Registering VTfree User...');
        const userEmail = `testuser_${Date.now()}@example.com`;
        const registerRes = await axios.post(`${BASE_URL}/vtfree/auth/register`, {
            email: userEmail,
            password: 'password123',
            first_name: 'Test',
            last_name: 'User',
            phone_number: `080${Date.now().toString().slice(-8)}`,
            company_name: 'Test Corp'
        });
        vtfreeToken = registerRes.data.data.token;
        console.log('✅ Registration Successful');
        console.log(`   User: ${userEmail}`);
        console.log(`   Token: ${vtfreeToken.substring(0, 20)}...\n`);

        // 2. Create New App
        console.log('2️⃣  Creating New App...');
        const appName = `Test App ${Date.now()}`;
        const packageName = `com.testapp.${Date.now()}`;
        const createRes = await axios.post(
            `${BASE_URL}/vtfree/apps/create`,
            {
                app_name: appName,
                package_name: packageName,
                platforms: { android: true, ios: false, web: true },
                branding: { primary_color: '#000000', secondary_color: '#ffffff' }
            },
            { headers: { Authorization: `Bearer ${vtfreeToken}` } }
        );
        appId = createRes.data.data.app.app_id;
        const adminEmail = createRes.data.data.admin_credentials.email;
        const adminPassword = createRes.data.data.admin_credentials.password;
        console.log('✅ App Creation Successful');
        console.log(`   App ID: ${appId}`);
        console.log(`   Admin Email: ${adminEmail}`);
        console.log(`   Admin Password: ${adminPassword}\n`);

        // 3. Login as App Admin
        console.log('3️⃣  Logging in as App Admin...');
        const loginRes = await axios.post(`${BASE_URL}/app-admin/login`, {
            app_id: appId,
            email: adminEmail,
            password: adminPassword
        });
        appAdminToken = loginRes.data.data.token;
        console.log('✅ App Admin Login Successful');
        console.log(`   Token: ${appAdminToken.substring(0, 20)}...\n`);

        // 4. Access App Dashboard
        console.log('4️⃣  Accessing App Dashboard...');
        const dashboardRes = await axios.get(`${BASE_URL}/app-admin/dashboard`, {
            headers: { Authorization: `Bearer ${appAdminToken}` }
        });
        console.log('✅ Dashboard Access Successful');
        console.log('   Stats:', dashboardRes.data.data.stats, '\n');

        console.log('🎉 All Tests Passed Successfully!');
    } catch (error: any) {
        console.error('❌ Test Failed:', error.response?.data || error.message);
    }
}

testFlow();
