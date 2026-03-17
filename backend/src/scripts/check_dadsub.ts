import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const CreatedAppSchema = new mongoose.Schema({
    app_id: String,
    payment_settings: {
        vtstack_secret_key: String,
        vtstack_api_key: String
    }
});

const CreatedApp = mongoose.model('CreatedApp', CreatedAppSchema);

async function checkApp() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/vtfree');
        console.log('Connected to DB');
        
        const app = await CreatedApp.findOne({ app_id: 'dadsub' });
        console.log('App dadsub:', JSON.stringify(app, null, 2));
        
        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
    }
}

checkApp();
