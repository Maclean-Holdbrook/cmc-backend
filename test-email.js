import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

const testEmail = async () => {
  console.log('🧪 Testing Resend Email Configuration...\n');

  // Check environment variables
  console.log('Environment Check:');
  console.log('- RESEND_API_KEY:', process.env.RESEND_API_KEY ? `${process.env.RESEND_API_KEY.substring(0, 10)}... (${process.env.RESEND_API_KEY.length} chars)` : 'NOT SET');
  console.log('- RESEND_FROM_EMAIL:', process.env.RESEND_FROM_EMAIL || 'NOT SET');
  console.log('- ADMIN_EMAIL:', process.env.ADMIN_EMAIL || 'NOT SET');
  console.log();

  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === 'your_resend_api_key_here') {
    console.error('❌ RESEND_API_KEY is not configured!');
    console.log('Please set RESEND_API_KEY in your .env file');
    process.exit(1);
  }

  if (!process.env.RESEND_FROM_EMAIL) {
    console.error('❌ RESEND_FROM_EMAIL is not configured!');
    console.log('Please set RESEND_FROM_EMAIL in your .env file');
    process.exit(1);
  }

  if (!process.env.ADMIN_EMAIL) {
    console.error('❌ ADMIN_EMAIL is not configured!');
    console.log('Please set ADMIN_EMAIL in your .env file');
    process.exit(1);
  }

  // Trim API key to remove any whitespace
  const apiKey = process.env.RESEND_API_KEY.trim();
  const resend = new Resend(apiKey);

  console.log('📤 Sending test email...\n');

  try {
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL,
      to: process.env.ADMIN_EMAIL,
      subject: 'Test Email from CMC IT System Support',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Test Email</h2>
          <p>This is a test email from your CMC IT System Support backend.</p>
          <p>If you're receiving this, your Resend configuration is working correctly!</p>

          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Configuration Details:</strong></p>
            <ul>
              <li>From: ${process.env.RESEND_FROM_EMAIL}</li>
              <li>To: ${process.env.ADMIN_EMAIL}</li>
              <li>Timestamp: ${new Date().toLocaleString()}</li>
            </ul>
          </div>

          <p style="color: #666; font-size: 12px; margin-top: 30px;">
            Sent from CMC IT System Support Test Script
          </p>
        </div>
      `,
    });

    if (error) {
      console.error('❌ Resend API returned an error:');
      console.error(JSON.stringify(error, null, 2));
      console.log('\nPossible causes:');
      console.log('- Invalid API key');
      console.log('- Test domain limitation (onboarding@resend.dev can only send to your Resend account email)');
      console.log('- Rate limiting');
      console.log('\nPlease check:');
      console.log('1. Your API key is correct at https://resend.com/api-keys');
      console.log('2. If using onboarding@resend.dev, ADMIN_EMAIL must match your Resend account email');
      console.log('3. Check your Resend dashboard at https://resend.com/emails');
      process.exit(1);
    }

    console.log('✅ Email sent successfully!');
    console.log('\nResponse from Resend:');
    console.log(JSON.stringify(data, null, 2));
    console.log('\n✅ Check your email inbox:', process.env.ADMIN_EMAIL);
    console.log('✅ Also check Resend dashboard: https://resend.com/emails');
    console.log('\nIf email was sent successfully but not received:');
    console.log('- Check your spam/junk folder');
    console.log('- If using test domain (onboarding@resend.dev), verify email must match your Resend account');
    console.log('- For production, verify a domain at https://resend.com/domains');

  } catch (error) {
    console.error('❌ Exception occurred:');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.log('\nThis could be:');
    console.log('- Network connectivity issue');
    console.log('- Invalid Resend API key format');
    console.log('- Resend service issue');
    process.exit(1);
  }
};

testEmail();
