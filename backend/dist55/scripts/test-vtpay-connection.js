import mongoose from 'mongoose';
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();
// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/vtfree';
async function testVTStack() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('Connected.');
        // Fetch Secret Key
        const ConfigSchema = new mongoose.Schema({ key: String, value: String }, { strict: false });
        // Explicitly point to the collection 'systemconfigs' (case sensitive check usually needed, but mongoose tries plural)
        const SystemConfig = mongoose.model('SystemConfig', ConfigSchema);
        const config = await SystemConfig.findOne({ key: 'VTSTACK_SECRET_KEY' });
        if (!config || !config.value) {
            console.error('❌ VTSTACK_SECRET_KEY not found in database!');
            process.exit(1);
        }
        const secretKey = config.value;
        // Mask key for log
        console.log(`🔑 Found Secret Key: ${secretKey.substring(0, 8)}...`);
        const baseURL = 'https://vtstackapi.vtfree.com.ng/api'; // Hardcoded base URL to be sure
        console.log(`📡 Testing Direct Connection to: ${baseURL}/wallet/balance`);
        try {
            const response = await axios.get(`${baseURL}/wallet/balance`, {
                headers: {
                    'x-api-key': secretKey,
                    'Content-Type': 'application/json'
                }
            });
            console.log('✅ SUCCESS! Connection Established.');
            console.log('Response Status:', response.status);
            console.log('Response Data:', JSON.stringify(response.data, null, 2));
        }
        catch (apiError) {
            console.error('❌ API Request Failed');
            if (apiError.response) {
                console.error(`Status: ${apiError.response.status}`);
                console.error('Data:', JSON.stringify(apiError.response.data, null, 2));
                console.error('Headers:', JSON.stringify(apiError.response.headers, null, 2));
            }
            else {
                console.error('Error:', apiError.message);
            }
        }
        console.log('---------------------------------------------------');
        console.log('📡 Testing POST /virtual-accounts (Dry Run/Bad Request Check)');
        // We expect this might fail validation, but we want to see IF it reaches the server 
        // and returns a VTStack error (which means auth works) vs a 500/401.
        try {
            // Sending dummy data to check connectivity/auth specifically
            const response = await axios.post(`${baseURL}/virtual-accounts`, {
                accountName: "Test Connection",
                email: "test@example.com",
                phone: "08012345678",
                bankType: "moniepoint" // Assuming this exists
            }, {
                headers: {
                    'x-api-key': secretKey,
                    'Content-Type': 'application/json'
                }
            });
            console.log('✅ POST Success (Unexpected for dummy data but connection verified)');
            console.log(response.data);
        }
        catch (postError) {
            if (postError.response) {
                console.log(`ℹ️ POST Endpoint Reached (Status ${postError.response.status}). This confirms connectivity.`);
                console.log('Response:', JSON.stringify(postError.response.data, null, 2));
                if (postError.response.status === 401 || postError.response.status === 403) {
                    console.log('❌ Auth Failed on POST. Key might be invalid for this endpoint.');
                }
                else if (postError.response.status === 500) {
                    console.log('❌ Server Error 500 on VTStack side.');
                }
                else {
                    console.log('✅ Connection Valid (received application-level error as expected).');
                }
            }
            else {
                console.error('❌ Network Error on POST:', postError.message);
            }
        }
    }
    catch (err) {
        console.error('Script Error:', err);
    }
    finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}
testVTStack();
