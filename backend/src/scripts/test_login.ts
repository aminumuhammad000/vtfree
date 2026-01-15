import axios from 'axios';

async function testLogin() {
    try {
        const response = await axios.post('http://localhost:5000/api/app-admin/login', {
            email: 'admin@vtuapp.com',
            password: 'Admin@123456',
            app_id: 'vtu_app_001'
        });
        console.log('Login Success:', response.data);
    } catch (error: any) {
        console.error('Login Failed:', error.response?.data || error.message);
    }
}

testLogin();
