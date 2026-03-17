
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const API_KEY = process.env.VTSTACK_SECRET_KEY; // I'll check this from .env later if needed

async function testVTStack() {
    console.log('Testing VTStack API...');
    const baseURL = 'https://api.vtstack.com.ng/api';
    
    // We'll try common endpoints
    const endpoints = [
        '/wallet/balance',
        '/balance',
        '/user/balance',
        '/virtual-accounts' // Just to see if any works
    ];

    if (!API_KEY) {
        console.error('VTSTACK_SECRET_KEY not found in .env');
        const fs = await import('fs');
        const envContent = fs.readFileSync('.env', 'utf8');
        const match = envContent.match(/VTSTACK_SECRET_KEY=(.*)/);
        if (match) {
            console.log('Found key in .env');
            const key = match[1].trim();
            for (const endpoint of endpoints) {
                try {
                    console.log(`Trying ${endpoint}...`);
                    const response = await axios.get(`${baseURL}${endpoint}`, {
                        headers: { 'x-api-key': key }
                    });
                    console.log(`Success ${endpoint}:`, JSON.stringify(response.data).substring(0, 100));
                } catch (err: any) {
                    console.log(`Failed ${endpoint}: ${err.response?.status} - ${JSON.stringify(err.response?.data)}`);
                }
            }
        }
    }
}

testVTStack();
