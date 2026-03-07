import CreatedApp from '../models/created_app.model.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
await mongoose.connect(process.env.MONGODB_URI);
const apps = await CreatedApp.find();
console.log(JSON.stringify(apps));
process.exit(0);
