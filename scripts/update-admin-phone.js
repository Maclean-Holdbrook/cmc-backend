import { PrismaClient } from '../src/generated/prisma/index.js';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Updating admin phone number...');

  try {
    const admin = await prisma.admin.update({
      where: { email: 'admin@complaintmanagement.com' },
      data: {
        phoneNumber: '+1234567890' // Replace with actual admin phone number
      }
    });

    console.log('✅ Admin phone number updated successfully!');
    console.log(`Admin: ${admin.firstName} ${admin.lastName}`);
    console.log(`Phone: ${admin.phoneNumber}`);
    console.log('\n📝 Note: Update the phone number in .env with your actual Twilio credentials');
    console.log('   and update the admin phone number in the admin profile page.');
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
