import mongoose from 'mongoose';
import { env } from './env.js';

export async function connectDB() {
    if (!env.mongoUri) {
        console.warn('⚠️  MONGODB_URI not set — skipping DB connection.');
        return null;
    }
    mongoose.set('strictQuery', true);
    await mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: 8000 });
    console.log('✔  MongoDB connected');
    return mongoose.connection;
}
