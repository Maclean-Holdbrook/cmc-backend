import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function createTables() {
  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('✓ Connected successfully!');

    // Read and execute the SQL file
    const sql = fs.readFileSync('./create-tables.sql', 'utf8');

    console.log('Creating database schema...');
    await client.query(sql);

    console.log('✓ All tables created successfully!');

    // Verify tables
    const result = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    console.log('\n📊 Created tables:');
    result.rows.forEach(row => console.log(`  - ${row.table_name}`));

    await client.end();
    console.log('\n✅ Database setup complete!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

createTables();
