import axios from 'axios';
const BASE_URL = 'http://localhost:5000/api/v1';
async function testDashboardApi() {
    try {
        console.log('1. Logging in...');
        const loginRes = await axios.post(`${BASE_URL}/super-admin/login`, {
            email: 'superadmin@vtfree.com',
            password: 'password123'
        });
        const token = loginRes.data.data.token;
        console.log('✅ Login successful. Token obtained.');
        console.log('2. Fetching Dashboard Stats...');
        const dashboardRes = await axios.get(`${BASE_URL}/super-admin/dashboard`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✅ Dashboard Stats:', dashboardRes.data);
    }
    catch (error) {
        console.error('❌ API Test Failed:', error.response?.data || error.message);
    }
}
testDashboardApi();
