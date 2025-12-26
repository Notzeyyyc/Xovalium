import mongoose from 'mongoose';
import { config } from '../config/settings.js';

const connectDB = async () => {
    try {
        const uri = config.db.mongodb_uri;
        if (!uri || uri.includes("admin:password")) {
            console.warn('⚠️ Warning: MongoDB URI is using default placeholder or not defined.');
        }
        
        await mongoose.connect(uri);
        console.log('✅ MongoDB Connected Successfully');
    } catch (error) {
        console.error('❌ MongoDB Connection Error:', error.message);
        // Don't exit process in dev if possible, but for a backend it's usually critical
        // process.exit(1);
    }
};

export default connectDB;
