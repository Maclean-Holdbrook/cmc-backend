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
  console.log('👷 Create New Worker Account\n');

  try {
    // Get worker details from user
    const email = await question('📧 Enter worker email: ');

    // Check if worker with this email already exists
    const existingWorker = await prisma.worker.findUnique({
      where: { email }
    });

    if (existingWorker) {
      console.log(`\n❌ Worker with email "${email}" already exists!\n`);
      return;
    }

    const password = await question('🔑 Enter worker password: ');
    const firstName = await question('👤 Enter first name: ');
    const lastName = await question('👤 Enter last name: ');
    const phoneNumber = await question('📱 Enter phone number (optional, press Enter to skip): ');

    // Show available departments
    console.log('\n📋 Available Departments:');
    console.log('   1. HR_MAIN');
    console.log('   2. HR_MANAGER');
    console.log('   3. WPO_MAIN');
    console.log('   4. WPO_MANAGER');
    console.log('   5. SHIPPING_MAIN');
    console.log('   6. SHIPPING_MANAGER');
    console.log('   7. CASH_OFFICE');
    console.log('   8. ACCOUNTS');
    console.log('   9. SALES');
    console.log('   10. AUDIT');
    console.log('   11. E_COLLECTION');
    console.log('   12. TRANSPORT');
    console.log('   13. TRADING_ROOM');
    console.log('   14. MARKETING');
    console.log('   15. RISK');
    console.log('   16. LBC');
    console.log('   17. PROCUREMENT');
    console.log('   0. Skip (no department)\n');

    const deptChoice = await question('🏢 Select department (enter number, or 0 to skip): ');

    const departments = [
      null, 'HR_MAIN', 'HR_MANAGER', 'WPO_MAIN', 'WPO_MANAGER',
      'SHIPPING_MAIN', 'SHIPPING_MANAGER', 'CASH_OFFICE', 'ACCOUNTS',
      'SALES', 'AUDIT', 'E_COLLECTION', 'TRANSPORT', 'TRADING_ROOM',
      'MARKETING', 'RISK', 'LBC', 'PROCUREMENT'
    ];

    const department = departments[parseInt(deptChoice)] || null;

    const specialization = await question('🎯 Enter specialization (optional, press Enter to skip): ');

    console.log('\n🔄 Creating worker account...\n');

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create worker account
    const worker = await prisma.worker.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        phoneNumber: phoneNumber || null,
        department: department || null,
        specialization: specialization || null,
        isActive: true
      }
    });

    console.log('✅ Worker account created successfully!\n');
    console.log('📋 Account Details:');
    console.log('   ID:', worker.id);
    console.log('   Email:', worker.email);
    console.log('   Name:', `${worker.firstName} ${worker.lastName}`);
    console.log('   Phone:', worker.phoneNumber || 'Not set');
    console.log('   Department:', worker.department || 'Not set');
    console.log('   Specialization:', worker.specialization || 'Not set');
    console.log('   Created:', worker.createdAt.toLocaleString());
    console.log('\n📝 Worker can now log in at: http://localhost:5174/worker/login\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

main();
