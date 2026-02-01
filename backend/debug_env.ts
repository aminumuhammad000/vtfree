
import { config } from './src/config/env.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('--- ENV CHECK ---');
console.log('CWD:', process.cwd());
console.log('__dirname:', __dirname);

// Current process.env.MONGO_URI before logic
console.log('process.env.MONGO_URI (initial):', process.env.MONGO_URI);

dotenv.config(); // Loads .env in CWD
console.log('process.env.MONGO_URI (after .config()):', process.env.MONGO_URI);

dotenv.config({ path: path.resolve(__dirname, './.env') });
console.log('process.env.MONGO_URI (after .config(backend/.env)):', process.env.MONGO_URI);

console.log('Config object mongoUri:', config.mongoUri);
