import cron from 'node-cron';
import { pool as prisma } from '../config/database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Delete complaints older than 1 month (30 days)
export const deleteOldComplaints = async () => {
  try {
    const oneMonthAgo = new Date();
    oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);

    // Find complaints to delete using raw SQL
    const oldComplaintsResult = await prisma.query(
      'SELECT * FROM complaints WHERE "createdAt" < $1',
      [oneMonthAgo]
    );

    const oldComplaints = oldComplaintsResult.rows;

    // Delete associated images
    for (const complaint of oldComplaints) {
      if (complaint.images && complaint.images.length > 0) {
        for (const imagePath of complaint.images) {
          try {
            const fullPath = path.join(__dirname, '../../', imagePath);
            if (fs.existsSync(fullPath)) {
              fs.unlinkSync(fullPath);
            }
          } catch (err) {
            console.error(`Error deleting image ${imagePath}:`, err.message);
          }
        }
      }
    }

    // Delete complaints (cascades to tickets and updates) using raw SQL
    const deleteResult = await prisma.query(
      'DELETE FROM complaints WHERE "createdAt" < $1',
      [oneMonthAgo]
    );

    console.log(`[${new Date().toISOString()}] Deleted ${deleteResult.rowCount} complaints older than 30 days`);
  } catch (error) {
    console.error('Error in deleteOldComplaints job:', error.message);
  }
};

// Schedule cleanup job to run daily at midnight
export const scheduleCleanupJobs = () => {
  // Run every day at midnight (0 0 * * *)
  cron.schedule('0 0 * * *', () => {
    console.log('[Cron] Running daily cleanup job...');
    deleteOldComplaints();
  });

  console.log('[Cron] Cleanup jobs scheduled');

  // Run immediately on startup (optional)
  // deleteOldComplaints();
};
