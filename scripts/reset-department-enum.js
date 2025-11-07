import { PrismaClient } from '../src/generated/prisma/index.js';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Clearing database to allow enum changes...');

  try {
    // Delete all data in the correct order (respecting foreign keys)
    await prisma.ticketUpdate.deleteMany({});
    console.log('✓ Deleted ticket updates');

    await prisma.ticket.deleteMany({});
    console.log('✓ Deleted tickets');

    await prisma.complaint.deleteMany({});
    console.log('✓ Deleted complaints');

    await prisma.worker.deleteMany({});
    console.log('✓ Deleted workers');

    // Keep admins
    // await prisma.admin.deleteMany({});

    console.log('\n✅ Database cleared successfully!');
    console.log('\nNow run: npx prisma db push --accept-data-loss');
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
