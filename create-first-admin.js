import pkg from 'pg';
const { Client } = pkg;
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import readline from 'readline';

dotenv.config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function createFirstAdmin() {
  try {
    console.log('=== Create Your First Admin Account ===\n');

    // Get admin details from user
    const firstName = await question('First Name: ');
    const lastName = await question('Last Name: ');
    const email = await question('Email: ');
    const password = await question('Password (min 6 characters): ');
    const phoneNumber = await question('Phone Number (optional, press Enter to skip): ');

    if (!firstName || !lastName || !email || !password) {
      console.log('❌ All fields except phone number are required!');
      rl.close();
      process.exit(1);
    }

    if (password.length < 6) {
      console.log('❌ Password must be at least 6 characters!');
      rl.close();
      process.exit(1);
    }

    console.log('\nConnecting to database...');
    await client.connect();
    console.log('✓ Connected!\n');

    // Check if admin with this email already exists
    const existingAdmin = await client.query('SELECT * FROM admins WHERE email = $1', [email]);

    if (existingAdmin.rows.length > 0) {
      console.log('⚠️  Admin account with this email already exists!');
      rl.close();
      await client.end();
      process.exit(1);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create admin
    await client.query(`
      INSERT INTO admins (id, email, password, "firstName", "lastName", "phoneNumber", "isActive", "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, NOW(), NOW())
    `, [email, hashedPassword, firstName, lastName, phoneNumber || null, true]);

    console.log('✅ Admin account created successfully!\n');
    console.log('📧 Login Credentials:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log('\n🔐 Please save these credentials in a secure location.');
    console.log('🌐 You can now login at the admin login page.');
    console.log('\n💡 After logging in, you can create additional admin accounts from the Settings page.');

    rl.close();
    await client.end();
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    rl.close();
    process.exit(1);
  }
}

createFirstAdmin();
