
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const CreatedAppSchema = new mongoose.Schema({
    app_id: String, app_name: String, status: String, payment_status: String, owner_id: mongoose.Schema.Types.ObjectId
}, { strict: false });
const CreatedApp = mongoose.model('CreatedApp', CreatedAppSchema, 'created_apps');

(async () => {
    try {
        console.log('Connecting to:', process.env.MONGO_URI);
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/vtfree');
        console.log('Connected.');
        const apps = await CreatedApp.find({}).sort({ _id: -1 }).limit(5);
        console.log('Apps:', apps);
    } catch (e) { console.error(e); }
    finally { mongoose.disconnect(); }
})();
