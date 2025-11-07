import { PrismaClient } from './src/generated/prisma/index.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

async function runMigration() {
  try {
    console.log('Connecting to database...');

    // Test connection
    await prisma.$connect();
    console.log('Connected successfully!');

    // Read the migration SQL
    const migrationPath = path.join(__dirname, 'prisma', 'migrations', '20251104084529_init', 'migration.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('Running migration...');

    // Split by statements and execute
    const statements = sql.split(';').filter(s => s.trim());

    for (const statement of statements) {
      if (statement.trim()) {
        await prisma.$executeRawUnsafe(statement + ';');
        console.log('Executed statement');
      }
    }

    console.log('Migration completed successfully!');

  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runMigration();
