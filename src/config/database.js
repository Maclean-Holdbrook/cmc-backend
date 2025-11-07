import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

// Create a connection pool to Supabase database with optimized settings
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  // Connection pool optimization
  max: 20, // Maximum number of clients in the pool
  min: 2, // Minimum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 10000, // Return an error after 10 seconds if connection cannot be established
  allowExitOnIdle: false // Keep pool alive even when idle
});

// Only log connection on first connect (reduce noise)
let firstConnect = true;
pool.on('connect', () => {
  if (firstConnect) {
    console.log('✓ Database pool ready');
    firstConnect = false;
  }
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

// For backwards compatibility with Prisma imports
const prisma = pool;

const connectDB = async () => {
  // Don't block server startup - connection will be established when needed
  console.log('Database pool initialized. Connection will be established on first query.');

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    await pool.end();
    console.log('Database pool closed through app termination');
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    await pool.end();
    console.log('Database pool closed through app termination');
    process.exit(0);
  });

  // Try to connect in background (non-blocking)
  setTimeout(async () => {
    try {
      const client = await pool.connect();
      console.log('✓ PostgreSQL Connected via pg Pool');
      client.release();
    } catch (error) {
      console.error(`Database connection warning: ${error.message}`);
      console.log('Server will retry connection on first database query');
    }
  }, 1000);
};

export { pool, pool as prisma, connectDB };
export default connectDB;
