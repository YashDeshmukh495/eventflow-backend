import mongoose from 'mongoose';
import dns from 'dns';

const connectDB = async () => {
  try {
    // Set public DNS servers to resolve MongoDB Atlas SRV records correctly
    dns.setServers(['8.8.8.8', '8.8.4.4']);

    const connString = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/eventflow';
    const conn = await mongoose.connect(connString);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
  }
};

export default connectDB;
