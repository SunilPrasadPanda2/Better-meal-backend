import mongoose from "mongoose";
import bcryptjs from "bcryptjs";
import User from "../models/User.js";
import logger from '../utils/logger.js';

const connectDB = async() => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGO_URI}/better_meal`);
        if(connectionInstance) {
            logger.info('Database connected successfully');
            await seedAdminData();
        }
    } catch (err) {
        logger.error(`MONGODB connection failed: ${err.message}`);
        process.exit(1);
    }
}

// seeding admin data
async function seedAdminData() {
    try {
        // Check if admin user already exists
        const existingAdmin = await User.findOne({ role: 'admin' });
        if (!existingAdmin) {
            const saltRounds = 10;
            const hashedPassword = await new Promise((resolve, reject) => {
                bcryptjs.hash('password', saltRounds, (err, hash) => {
                    if (err) reject(err);
                    resolve(hash);
                });
            });
            // Create admin user if not exists
            await User.create({
                name: 'Admin',
                mobile: "9999988888",
                email: "admin@gmail.com",
                password: hashedPassword,
                role: 'admin'
                // Add other admin-specific fields
            });  
            logger.info('Admin user created successfully');
        } else {
            logger.info('Admin user already exists');
        }
    } catch (error) {
        logger.error('Error seeding admin data:', error);
    }
}

export default connectDB;