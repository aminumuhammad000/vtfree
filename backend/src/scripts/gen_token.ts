import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';

const token = jwt.sign(
    {
        id: new mongoose.Types.ObjectId(), // dummy id
        email: 'admin@testvtuapp.com',
        app_id: 'vtu_app_001',
        type: 'app_admin',
        role: 'owner'
    },
    jwtSecret,
    { expiresIn: '1d' }
);

console.log(token);
