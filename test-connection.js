import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function testConnection() {
  try {
    console.log('Attempting to connect to database...');
    console.log('Connection string:', process.env.DATABASE_URL.replace(/:([^:@]+)@/, ':****@'));

    await client.connect();
    console.log('Connected successfully!');

    const res = await client.query('SELECT NOW()');
    console.log('Database time:', res.rows[0].now);

    // Check if tables exist
    const tables = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
    `);
    console.log('Existing tables:', tables.rows.map(r => r.table_name));

    await client.end();
    console.log('Connection test successful!');
  } catch (error) {
    console.error('Connection failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

testConnection();
