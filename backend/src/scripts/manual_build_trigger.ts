
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import mongoose from 'mongoose';
import { addBuildJob } from '../queues/app_build.queue.js';

async function testTrigger() {
    console.log('Connecting to Mongo...');
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/vtfree');

    const testAppId = 'com.medidata.app';
    console.log(`Triggering build for REAL app: ${testAppId}`);

    console.log('Triggering build job...');
    try {
        const job = await addBuildJob(testAppId, {
            options: {
                app_id: testAppId,
                app_name: 'Medidata App',
                package_name: 'com.medidata.app',
                target: 'web',
                targets: ['web'],
                branding: {
                    logo_url: '',
                    primary_color: '#16a34a',
                    secondary_color: '#dcfce7'
                },
                user_email: 'aminumuhammad00015@gmail.com',
                server_url: 'http://localhost:5000'
            }
        });

        console.log(`Job added! ID: ${job.id}`);
        console.log('Watch the main server logs for worker output...');
    } catch (e: any) {
        console.error('Failed to trigger job:', e.message);
    }

    setTimeout(() => {
        process.exit(0);
    }, 2000);
}

testTrigger().catch(console.error);
