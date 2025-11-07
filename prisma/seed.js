import { PrismaClient } from '../src/generated/prisma/index.js';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create default admin account
  const hashedPassword = await bcrypt.hash('admin123', 10);

  const admin = await prisma.admin.upsert({
    where: { email: 'admin@complaintmanagement.com' },
    update: {},
    create: {
      email: 'admin@complaintmanagement.com',
      password: hashedPassword,
      firstName: 'System',
      lastName: 'Administrator',
      phoneNumber: '+1234567890', // Replace with actual admin phone number
      isActive: true
    }
  });

  console.log('✅ Default admin created:', {
    email: admin.email,
    password: 'admin123' // Display for development
  });

  // Optionally create some sample workers for testing
  const sampleWorkers = [
    {
      email: 'worker.wpo@complaintmanagement.com',
      password: await bcrypt.hash('worker123', 10),
      firstName: 'John',
      lastName: 'Smith',
      phoneNumber: '+1234567890',
      department: 'WPO_MAIN',
      specialization: 'Warehouse Operations'
    },
    {
      email: 'worker.marketing@complaintmanagement.com',
      password: await bcrypt.hash('worker123', 10),
      firstName: 'Jane',
      lastName: 'Doe',
      phoneNumber: '+1234567891',
      department: 'MARKETING',
      specialization: 'Marketing Support'
    }
  ];

  for (const workerData of sampleWorkers) {
    await prisma.worker.upsert({
      where: { email: workerData.email },
      update: {},
      create: workerData
    });
  }

  console.log('✅ Sample workers created');
  console.log('\n📋 Login Credentials:');
  console.log('Admin: admin@complaintmanagement.com / admin123');
  console.log('Worker (WPO_MAIN): worker.wpo@complaintmanagement.com / worker123');
  console.log('Worker (MARKETING): worker.marketing@complaintmanagement.com / worker123');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
