
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import dotenv from 'dotenv';
dotenv.config({ path: path.join(__dirname, '../../.env') });

const CreatedAppSchema = new mongoose.Schema({}, { strict: false });
const CreatedApp = mongoose.model('CreatedApp', CreatedAppSchema, 'created_apps');

(async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/vtfree');
        const apps = await CreatedApp.find({}).select('app_id app_name').limit(20);
        console.log(JSON.stringify(apps, null, 2));
    } catch (e) { console.error(e); }
    finally { mongoose.disconnect(); }
})();
