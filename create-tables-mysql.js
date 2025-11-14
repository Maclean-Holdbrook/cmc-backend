import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

async function createTables() {
  let connection;

  try {
    // Parse DATABASE_URL if provided
    let dbConfig;
    if (process.env.DATABASE_URL) {
      const url = new URL(process.env.DATABASE_URL);
      dbConfig = {
        host: url.hostname,
        port: url.port || 3306,
        user: url.username,
        password: url.password,
        database: url.pathname.slice(1),
        multipleStatements: true, // Allow running multiple SQL statements
      };
    } else {
      dbConfig = {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'compliant_management',
        multipleStatements: true,
      };
    }

    console.log('Connecting to MySQL database...');
    connection = await mysql.createConnection(dbConfig);

    console.log('✓ Connected to MySQL');
    console.log('Running migration script...');

    // Read SQL file
    const sqlScript = readFileSync(join(__dirname, 'create-tables-mysql.sql'), 'utf8');

    // Execute the SQL script
    await connection.query(sqlScript);

    console.log('✓ Database tables created successfully!');
    console.log('\nNext steps:');
    console.log('1. Run: node seed-admin.js (to create an admin user)');
    console.log('2. Run: npm run dev (to start the server)');

  } catch (error) {
    console.error('✗ Error creating tables:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n✓ Database connection closed');
    }
  }
}

createTables();
