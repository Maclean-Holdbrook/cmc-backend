import { Resend } from 'resend';
import { pool as prisma } from '../config/database.js';

// Trim API key to remove any whitespace
const apiKey = process.env.RESEND_API_KEY?.trim();
const resend = new Resend(apiKey);

/**
 * Send email notification to admin when a new complaint is submitted
 */
export const sendNewComplaintEmail = async (complaint) => {
  try {
    console.log('📧 Attempting to send email notification...');
    console.log('From:', process.env.RESEND_FROM_EMAIL);
    console.log('API Key configured:', !!process.env.RESEND_API_KEY);

    // Check if Resend is configured
    if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === 'your_resend_api_key_here') {
      console.log('ℹ Resend not configured. Email notification skipped.');
      console.log(`[Email] New complaint from ${complaint.staffName} - ${complaint.title}`);
      return;
    }

    // Get all active admin emails from database
    const adminsResult = await prisma.query(
      'SELECT email FROM admins WHERE "isActive" = true AND email IS NOT NULL'
    );

    if (adminsResult.rows.length === 0) {
      console.log('⚠️ No active admins with email addresses found in database');
      return;
    }

    let adminEmails = adminsResult.rows.map(admin => admin.email);

    // If using test domain, only send to verified email (Resend limitation)
    if (process.env.RESEND_FROM_EMAIL === 'onboarding@resend.dev') {
      const verifiedEmail = process.env.ADMIN_EMAIL || 'macleaann723@gmail.com';
      adminEmails = adminEmails.filter(email => email === verifiedEmail);
      if (adminEmails.length === 0) {
        console.log('⚠️ Using test domain - only verified email can receive notifications');
        console.log('⚠️ Please verify a domain at resend.com/domains to send to all admins');
        return;
      }
      console.log('ℹ️ Test domain: Sending only to verified email:', adminEmails[0]);
    }

    console.log('To:', adminEmails.join(', '));
    console.log('📤 Sending email to Resend API...');

    const emailPayload = {
      from: process.env.RESEND_FROM_EMAIL,
      to: adminEmails,
      subject: `New Complaint Submitted - ${complaint.title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">New Complaint Submitted</h2>
          <p>A new complaint has been submitted to the CMC IT SYSTEM SUPPORT.</p>

          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Complaint Details:</h3>
            <p><strong>Title:</strong> ${complaint.title}</p>
            <p><strong>Staff Name:</strong> ${complaint.staffName}</p>
            <p><strong>Department:</strong> ${complaint.department.replace(/_/g, ' ')}</p>
            ${complaint.location ? `<p><strong>Location:</strong> ${complaint.location}</p>` : ''}
            ${complaint.description ? `<p><strong>Description:</strong> ${complaint.description}</p>` : ''}
            <p><strong>Status:</strong> ${complaint.status}</p>
            <p><strong>Priority:</strong> ${complaint.priority}</p>
            <p><strong>Submitted:</strong> ${new Date(complaint.createdAt).toLocaleString()}</p>
          </div>

          <p>Please log in to the admin dashboard to review and assign this complaint.</p>

          <p style="color: #666; font-size: 12px; margin-top: 30px;">
            This is an automated notification from CMC IT SYSTEM SUPPORT.
          </p>
        </div>
      `,
    };

    console.log('Email payload:', JSON.stringify({
      from: emailPayload.from,
      to: emailPayload.to,
      subject: emailPayload.subject
    }));

    const { data, error } = await resend.emails.send(emailPayload);

    if (error) {
      console.error('❌ Resend API Error:', JSON.stringify(error, null, 2));
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      return;
    }

    console.log('✅ Email sent successfully! Resend response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('❌ Exception in sendNewComplaintEmail:', error);
    console.error('Error stack:', error.stack);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      code: error.code
    });
  }
};

/**
 * Send email notification to worker when a ticket is assigned
 */
export const sendTicketAssignmentEmail = async (ticket, worker, complaint) => {
  try {
    // Check if Resend is configured
    if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === 'your_resend_api_key_here') {
      console.log('ℹ Resend not configured. Email notification skipped.');
      console.log(`[Email] Ticket ${ticket.ticketNumber} assigned to ${worker.email}`);
      return;
    }

    // If using test domain, check if worker email is the verified one
    if (process.env.RESEND_FROM_EMAIL === 'onboarding@resend.dev') {
      const verifiedEmail = process.env.ADMIN_EMAIL || 'macleaann723@gmail.com';
      if (worker.email !== verifiedEmail) {
        console.log(`⚠️ Test domain: Cannot send to ${worker.email} (not verified)`);
        console.log('⚠️ Verify a domain at resend.com/domains to send to all workers');
        return;
      }
      console.log('ℹ️ Test domain: Sending to verified worker email:', worker.email);
    }

    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL,
      to: worker.email,
      subject: `New Ticket Assigned - ${ticket.ticketNumber}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">New Ticket Assigned to You</h2>
          <p>Hello ${worker.firstName} ${worker.lastName},</p>
          <p>A new ticket has been assigned to you in the CMC IT SYSTEM SUPPORT.</p>

          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Ticket Details:</h3>
            <p><strong>Ticket Number:</strong> ${ticket.ticketNumber}</p>
            <p><strong>Title:</strong> ${complaint.title}</p>
            <p><strong>Staff Name:</strong> ${complaint.staffName}</p>
            <p><strong>Department:</strong> ${complaint.department.replace(/_/g, ' ')}</p>
            ${complaint.location ? `<p><strong>Location:</strong> ${complaint.location}</p>` : ''}
            ${complaint.description ? `<p><strong>Description:</strong> ${complaint.description}</p>` : ''}
            <p><strong>Priority:</strong> ${ticket.priority}</p>
            ${ticket.notes ? `<p><strong>Notes:</strong> ${ticket.notes}</p>` : ''}
            <p><strong>Assigned:</strong> ${new Date(ticket.createdAt).toLocaleString()}</p>
          </div>

          <p>Please log in to your worker portal to view and update this ticket.</p>

          <p style="color: #666; font-size: 12px; margin-top: 30px;">
            This is an automated notification from CMC IT SYSTEM SUPPORT.
          </p>
        </div>
      `,
    });

    if (error) {
      console.error('Error sending email:', error);
      return;
    }

    console.log('✓ Email notification sent to worker:', worker.email, data);
  } catch (error) {
    console.error('Error sending ticket assignment email:', error.message);
  }
};

/**
 * Send email notification when ticket status is updated
 */
export const sendTicketUpdateEmail = async (ticket, worker, complaint, updateMessage) => {
  try {
    // Check if Resend is configured
    if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === 'your_resend_api_key_here') {
      console.log('ℹ Resend not configured. Email notification skipped.');
      console.log(`[Email] Ticket ${ticket.ticketNumber} updated`);
      return;
    }

    // Get all active admin emails from database
    const adminsResult = await prisma.query(
      'SELECT email FROM admins WHERE "isActive" = true AND email IS NOT NULL'
    );

    if (adminsResult.rows.length === 0) {
      console.log('⚠️ No active admins with email addresses found in database');
      return;
    }

    let adminEmails = adminsResult.rows.map(admin => admin.email);

    // If using test domain, only send to verified email (Resend limitation)
    if (process.env.RESEND_FROM_EMAIL === 'onboarding@resend.dev') {
      const verifiedEmail = process.env.ADMIN_EMAIL || 'macleaann723@gmail.com';
      adminEmails = adminEmails.filter(email => email === verifiedEmail);
      if (adminEmails.length === 0) {
        console.log('⚠️ Using test domain - only verified email can receive notifications');
        return;
      }
    }

    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL,
      to: adminEmails,
      subject: `Ticket Updated - ${ticket.ticketNumber}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Ticket Status Updated</h2>
          <p>A ticket has been updated in the CMC IT SYSTEM SUPPORT.</p>

          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Ticket Details:</h3>
            <p><strong>Ticket Number:</strong> ${ticket.ticketNumber}</p>
            <p><strong>Title:</strong> ${complaint.title}</p>
            <p><strong>Assigned to:</strong> ${worker.firstName} ${worker.lastName}</p>
            <p><strong>Status:</strong> ${ticket.status}</p>
            <p><strong>Update Message:</strong> ${updateMessage}</p>
            <p><strong>Updated:</strong> ${new Date().toLocaleString()}</p>
          </div>

          <p>Please log in to the admin dashboard to view the full ticket details.</p>

          <p style="color: #666; font-size: 12px; margin-top: 30px;">
            This is an automated notification from CMC IT SYSTEM SUPPORT.
          </p>
        </div>
      `,
    });

    if (error) {
      console.error('Error sending email:', error);
      return;
    }

    console.log('✓ Ticket update email notification sent to admin:', data);
  } catch (error) {
    console.error('Error sending ticket update email:', error.message);
  }
};
