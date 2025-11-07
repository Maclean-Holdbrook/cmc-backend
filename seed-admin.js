import pkg from 'pg';
const { Client } = pkg;
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function seedAdmin() {
  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('✓ Connected!');

    // Create default admin account
    const email = 'admin@complaintmanagement.com';
    const password = 'admin123';
    const hashedPassword = await bcrypt.hash(password, 10);

    // Check if admin already exists
    const existingAdmin = await client.query('SELECT * FROM admins WHERE email = $1', [email]);

    if (existingAdmin.rows.length > 0) {
      console.log('⚠️  Admin account already exists!');
    } else {
      await client.query(`
        INSERT INTO admins (id, email, password, "firstName", "lastName", "phoneNumber", "isActive", "createdAt", "updatedAt")
        VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, NOW(), NOW())
      `, [email, hashedPassword, 'System', 'Administrator', null, true]);

      console.log('✅ Admin account created successfully!');
      console.log('\n📧 Login Credentials:');
      console.log(`   Email: ${email}`);
      console.log(`   Password: ${password}`);
    }

    await client.end();
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

seedAdmin();
