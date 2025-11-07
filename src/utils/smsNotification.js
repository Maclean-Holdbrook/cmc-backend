import twilio from 'twilio';
import { pool as prisma } from '../config/database.js';

// Initialize Twilio client only if properly configured
let twilioClient = null;
const isTwilioConfigured =
  process.env.TWILIO_ACCOUNT_SID &&
  process.env.TWILIO_AUTH_TOKEN &&
  process.env.TWILIO_PHONE_NUMBER &&
  process.env.TWILIO_ACCOUNT_SID.startsWith('AC') &&
  process.env.TWILIO_ACCOUNT_SID !== 'your_twilio_account_sid';

if (isTwilioConfigured) {
  try {
    twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    console.log('✓ Twilio SMS service initialized');
  } catch (error) {
    console.warn('Failed to initialize Twilio:', error.message);
  }
} else {
  console.log('ℹ Twilio not configured. SMS notifications will be logged only.');
}

/**
 * Send SMS notification to admin
 * @param {string} phoneNumber - Admin phone number
 * @param {string} message - SMS message
 */
export const sendSMS = async (phoneNumber, message) => {
  try {
    // Check if Twilio is configured
    if (!twilioClient || !process.env.TWILIO_PHONE_NUMBER) {
      console.warn('Twilio not configured. SMS notification skipped.');
      console.log(`Would have sent SMS to ${phoneNumber}: ${message}`);
      return { success: false, message: 'Twilio not configured' };
    }

    // Send SMS
    const result = await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber
    });

    console.log(`SMS sent successfully to ${phoneNumber}:`, result.sid);
    return { success: true, messageSid: result.sid };
  } catch (error) {
    console.error('Error sending SMS:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Notify all active admins about a new complaint
 * @param {Object} complaint - The complaint object
 */
export const notifyAdminsNewComplaint = async (complaint) => {
  try {
    // Get all active admins with phone numbers using raw SQL
    const adminsResult = await prisma.query(
      'SELECT id, "firstName", "lastName", "phoneNumber" FROM admins WHERE "isActive" = true AND "phoneNumber" IS NOT NULL'
    );

    const admins = adminsResult.rows;

    if (admins.length === 0) {
      console.log('No active admins with phone numbers found');
      return;
    }

    // Prepare SMS message
    const message = `NEW COMPLAINT ALERT\n\nTitle: ${complaint.title}\nDepartment: ${complaint.department.replace(/_/g, ' ')}\nFrom: ${complaint.staffName}\n\nPlease log in to review and assign.`;

    // Send SMS to each admin
    const smsPromises = admins.map(async (admin) => {
      if (admin.phoneNumber) {
        await sendSMS(admin.phoneNumber, message);
      }
    });

    await Promise.all(smsPromises);
    console.log(`Notified ${admins.length} admin(s) about new complaint`);
  } catch (error) {
    console.error('Error notifying admins:', error.message);
  }
};

/**
 * Notify admin about ticket update
 * @param {Object} ticket - The ticket object
 * @param {string} updateMessage - Update message
 */
export const notifyAdminTicketUpdate = async (ticket, updateMessage) => {
  try {
    // Get the admin who created the ticket using raw SQL
    const adminResult = await prisma.query(
      'SELECT id, "firstName", "phoneNumber" FROM admins WHERE id = $1',
      [ticket.adminId]
    );

    const admin = adminResult.rows[0];

    if (!admin || !admin.phoneNumber) {
      console.log('Admin phone number not found');
      return;
    }

    // Prepare SMS message
    const message = `TICKET UPDATE\n\nTicket: ${ticket.ticketNumber}\nUpdate: ${updateMessage}\n\nLog in to view details.`;

    // Send SMS
    await sendSMS(admin.phoneNumber, message);
  } catch (error) {
    console.error('Error notifying admin about ticket update:', error.message);
  }
};
