import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/mediassistai";
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000 // Timeout after 5s instead of hanging
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.warn(`\x1b[33m%s\x1b[0m`, `⚠️  MongoDB Connection Error: ${error.message}`);
    console.warn(`\x1b[36m%s\x1b[0m`, "💡 The server is still running. Note that database-dependent features will fail.");
    // No longer exiting process - allowing other services (like AI) to function.
  }
};

export default connectDB;