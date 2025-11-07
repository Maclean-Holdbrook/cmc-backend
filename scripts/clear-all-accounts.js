import { PrismaClient } from '../src/generated/prisma/index.js';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Clearing all accounts and data...\n');

  try {
    // Delete all data in the correct order (respecting foreign keys)
    console.log('Deleting notifications...');
    await prisma.notification.deleteMany({});

    console.log('Deleting ticket updates...');
    await prisma.ticketUpdate.deleteMany({});

    console.log('Deleting tickets...');
    await prisma.ticket.deleteMany({});

    console.log('Deleting complaints...');
    await prisma.complaint.deleteMany({});

    console.log('Deleting workers...');
    await prisma.worker.deleteMany({});

    console.log('Deleting admins...');
    await prisma.admin.deleteMany({});

    console.log('\n✅ All accounts and data cleared successfully!\n');
    console.log('📝 Next steps:');
    console.log('   1. Create a new admin account via the admin registration endpoint');
    console.log('   2. Log in as admin');
    console.log('   3. Create worker accounts from the admin dashboard\n');
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
