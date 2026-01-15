import mongoose from 'mongoose';
import { config } from '../config/bootstrap.js';
import AppAdmin from '../models/app_admin.model.js';
import CreatedApp from '../models/created_app.model.js';

async function checkAdmins() {
    try {
        await mongoose.connect(config.mongoUri);
        console.log('Connected to MongoDB');

        const apps = await CreatedApp.find({});
        console.log('\n--- Created Apps ---');
        apps.forEach(app => {
            console.log(`Name: ${app.app_name}, AppID: ${app.app_id}`);
        });

        const admins = await AppAdmin.find({});
        console.log('\n--- App Admins ---');
        admins.forEach(admin => {
            console.log(`Email: ${admin.email}, AppID: ${admin.app_id}, Role: ${admin.role}`);
        });

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

checkAdmins();
