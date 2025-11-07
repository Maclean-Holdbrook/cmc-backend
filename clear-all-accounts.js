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

async function clearAccounts() {
  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('✓ Connected!');

    // Clear all admin accounts
    await client.query('DELETE FROM admins');
    console.log('✅ All admin accounts cleared!');

    // Optional: Clear all worker accounts too
    await client.query('DELETE FROM workers');
    console.log('✅ All worker accounts cleared!');

    console.log('\n📝 Database is now clean. You can create your own admin account.');
    console.log('   Use the admin registration page or run the seed-admin.js script');
    console.log('   with your own credentials.');

    await client.end();
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

clearAccounts();
