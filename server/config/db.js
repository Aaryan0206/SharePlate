const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const connUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/shareplate';
    console.log(`[Database] Connecting to MongoDB: ${connUri.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@')}`);

    const conn = await mongoose.connect(connUri, {
      serverSelectionTimeoutMS: 5000,
    });

    console.log(`[Database] MongoDB Connected: ${conn.connection.host}:${conn.connection.port}/${conn.connection.name}`);

    mongoose.connection.on('error', (err) => {
      console.error(`[Database Error] MongoDB connection issue: ${err.message}`);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('[Database Warning] MongoDB disconnected. Attempting reconnect...');
    });

    return conn;
  } catch (error) {
    console.error(`[Database Critical Error] Failed to connect to MongoDB: ${error.message}`);
    console.error('[Database Guide] Please ensure your MongoDB server is running (e.g. at 127.0.0.1:27017 or as managed via MongoDB Compass).');
    process.exit(1);
  }
};

module.exports = connectDB;
