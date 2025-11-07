import { PrismaClient } from '../src/generated/prisma/index.js';
import bcrypt from 'bcryptjs';
import readline from 'readline';

const prisma = new PrismaClient();

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Promisify question method
function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function main() {
  console.log('🔐 Create New Admin Account\n');

  try {
    // Check if any admin already exists
    const existingAdmin = await prisma.admin.findFirst();
    if (existingAdmin) {
      console.log('❌ Admin account already exists!');
      console.log('📧 Email:', existingAdmin.email);
      console.log('\n💡 Options:');
      console.log('   1. Use existing admin account to log in');
      console.log('   2. Run "node scripts/clear-all-accounts.js" to clear all accounts and start over\n');
      return;
    }

    // Get admin details from user
    const email = await question('📧 Enter admin email: ');
    const password = await question('🔑 Enter admin password: ');
    const firstName = await question('👤 Enter first name: ');
    const lastName = await question('👤 Enter last name: ');
    const phoneNumber = await question('📱 Enter phone number (with country code, e.g., +1234567890): ');

    console.log('\n🔄 Creating admin account...\n');

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create admin account
    const admin = await prisma.admin.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        phoneNumber: phoneNumber || null,
        isActive: true
      }
    });

    console.log('✅ Admin account created successfully!\n');
    console.log('📋 Account Details:');
    console.log('   ID:', admin.id);
    console.log('   Email:', admin.email);
    console.log('   Name:', `${admin.firstName} ${admin.lastName}`);
    console.log('   Phone:', admin.phoneNumber || 'Not set');
    console.log('   Created:', admin.createdAt.toLocaleString());
    console.log('\n📝 Next steps:');
    console.log('   1. Start the backend server: npm run dev');
    console.log('   2. Go to http://localhost:5174 and log in as admin');
    console.log('   3. Create worker accounts from the admin dashboard\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

main();
