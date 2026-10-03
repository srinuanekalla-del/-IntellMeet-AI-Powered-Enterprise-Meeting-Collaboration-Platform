import mongoose from 'mongoose';

/**
 * Connects to MongoDB using the URI from environment variables.
 * Exits the process if the connection fails, since the API is
 * useless without a database.
 */
export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`[DB] MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`[DB] Connection error: ${error.message}`);
    process.exit(1);
  }
};

mongoose.connection.on('disconnected', () => {
  console.warn('[DB] MongoDB disconnected');
});
