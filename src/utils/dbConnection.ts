import mongoose from "mongoose";

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI as string);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
        return conn.connection.db;

    } catch (error: any) {
        console.error(`Error in Database connection: ${error.message}`);
        process.exit(1);
    }
};

export default connectDB;