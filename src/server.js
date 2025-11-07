import dotenv from 'dotenv';
import app from './app.js';
import connectDB from './config/database.js';
import { scheduleCleanupJobs } from './utils/cleanupJobs.js';

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

// Schedule cleanup jobs (delete complaints older than 1 month)
scheduleCleanupJobs();

// Start server
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Server is running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  console.log(`CMC IT SYSTEM SUPPORT API ready at http://localhost:${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error(`Unhandled Rejection: ${err.message}`);
  server.close(() => process.exit(1));
});
