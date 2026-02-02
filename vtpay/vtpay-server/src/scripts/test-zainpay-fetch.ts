
import { connectDatabase } from '../config/database';
import { SystemSetting } from '../models';

const testFetch = async () => {
    await connectDatabase();
    const settings = await SystemSetting.findOne();
    const apiKey = settings?.integrations?.zainpay?.apiKey;

    if (!apiKey) {
        console.error('No API Key found in DB');
        process.exit(1);
    }

    console.log('Testing Fetch to https://api.zainpay.ng/zainbox/list');
    try {
        const response = await fetch('https://api.zainpay.ng/zainbox/list', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'User-Agent': 'VTPay/1.0.0'
            }
        });

        console.log(`Status: ${response.status} ${response.statusText}`);
        if (response.ok) {
            const data = await response.json();
            console.log('Success! Data length:', Array.isArray((data as any).data) ? (data as any).data.length : 'Not array');
        } else {
            console.log('Failed!');
            const text = await response.text();
            console.log('Body:', text);
        }
    } catch (error) {
        console.error('Fetch Error:', error);
    }
    process.exit(0);
};

testFetch();
