import dotenv from 'dotenv';
import app from './src/app.js';

// Load environment variables
dotenv.config();

// For Vercel serverless deployment, we don't need to start the server
// Vercel will handle that. We just export the app.
export default app;
