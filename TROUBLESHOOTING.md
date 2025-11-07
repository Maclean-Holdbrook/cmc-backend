# Troubleshooting Guide

## Email Notifications Not Working on Production

If admin email notifications are not being received on your Vercel deployment, follow these steps:

### 1. Verify Environment Variables in Vercel

Go to your Vercel project dashboard:
1. Click on your backend project
2. Go to **Settings** → **Environment Variables**
3. Verify these variables are set:

```
RESEND_API_KEY=re_MmQXYgVJ_3CCzVtPD9XW5ntBDPkzuUc2f
RESEND_FROM_EMAIL=onboarding@resend.dev
ADMIN_EMAIL=macleaann723@gmail.com
```

**Important:** After adding or updating environment variables, you MUST redeploy your application for changes to take effect.

### 2. Check Vercel Deployment Logs

1. Go to your Vercel project
2. Click on **Deployments**
3. Click on the latest deployment
4. Click on **Functions** tab
5. Look for logs when a complaint is submitted

Look for these log messages:
- `📧 Attempting to send email notification...`
- `From: onboarding@resend.dev`
- `API Key configured: true`
- `ℹ️ Test domain: Sending only to verified email: your-email@example.com`
- `✓ Email notification sent to admin`

### 3. Common Issues and Solutions

#### Issue: "API Key configured: false"
**Solution:**
- The `RESEND_API_KEY` environment variable is not set in Vercel
- Go to Settings → Environment Variables and add it
- Redeploy the application

#### Issue: "ℹ Resend not configured. Email notification skipped."
**Solution:**
- Either `RESEND_API_KEY` is not set, or it's set to the placeholder value `your_resend_api_key_here`
- Update the environment variable with your actual Resend API key
- Redeploy

#### Issue: "⚠️ No active admins with email addresses found in database"
**Solution:**
- Your database has no admin users with email addresses
- Log in to admin portal and update your profile to include an email address
- Or run this SQL query on your database:
  ```sql
  UPDATE admins SET email = 'macleaann723@gmail.com' WHERE id = 1;
  ```

#### Issue: "⚠️ Using test domain - only verified email can receive notifications"
**Solution:**
- You're using Resend's test domain (`onboarding@resend.dev`)
- This can only send emails to your verified Resend account email
- Make sure `ADMIN_EMAIL` in Vercel matches the email you used to sign up for Resend
- **For production:** Verify a domain at [resend.com/domains](https://resend.com/domains) and update `RESEND_FROM_EMAIL` to use your domain (e.g., `noreply@yourdomain.com`)

#### Issue: Emails not received but logs show success
**Solution:**
- Check your spam/junk folder
- If using test domain, verify you're checking the correct email (must match Resend account email)
- Try sending a test email directly from Resend dashboard to verify your API key works

### 4. Testing Email Configuration

To test if emails are working without submitting a complaint:

1. Check the Vercel function logs after a complaint submission
2. Look for the email sending logs
3. Check if there are any error messages

### 5. Verify Resend API Key

1. Go to [resend.com/api-keys](https://resend.com/api-keys)
2. Verify your API key is active
3. If needed, generate a new API key
4. Update it in Vercel's environment variables
5. Redeploy

### 6. Force Redeploy

Sometimes environment variables don't update properly. Force a redeploy:

1. Go to your project on Vercel
2. Go to **Deployments**
3. Click the three dots (...) on the latest deployment
4. Click **Redeploy**
5. Make sure "Use existing Build Cache" is **unchecked**
6. Click "Redeploy"

### 7. Database Connection

Verify your database is accessible from Vercel:

Check Vercel logs for:
- `✓ Database pool ready`
- `✓ PostgreSQL Connected via pg Pool`

If you see connection errors, verify:
- `DATABASE_URL` is set correctly in Vercel
- Your Supabase project allows connections from all IPs (or Vercel's IP ranges)
- You're using the **transaction pooler** connection string (port 6543)

### 8. Complete Environment Variables Checklist for Production

Make sure ALL these are set in Vercel:

```bash
NODE_ENV=production
PORT=5000

# Database
DATABASE_URL=postgresql://postgres.lavbryrozopzocxtwpzq:Moneyme12345@aws-1-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d

# CORS (set to your frontend URL)
CORS_ORIGIN=https://your-frontend-app.vercel.app

# Email (Resend)
RESEND_API_KEY=re_MmQXYgVJ_3CCzVtPD9XW5ntBDPkzuUc2f
RESEND_FROM_EMAIL=onboarding@resend.dev
ADMIN_EMAIL=macleaann723@gmail.com

# API
API_VERSION=v1
```

## Still Not Working?

If you've followed all the steps above and emails still aren't working:

1. **Check Resend Dashboard:**
   - Go to [resend.com/emails](https://resend.com/emails)
   - See if emails are showing up there (even if not delivered)
   - Check for any error messages

2. **Verify Admin Email in Database:**
   - Make sure the admin user in the database has the correct email address
   - SQL query: `SELECT id, email, "firstName", "lastName" FROM admins WHERE "isActive" = true;`

3. **Test with a Fresh Complaint:**
   - Submit a new complaint from the staff portal
   - Immediately check Vercel logs for the function that handled it
   - Look for email-related log messages

4. **Contact Resend Support:**
   - If you see "Email notification sent" in logs but no email arrives
   - Check Resend dashboard for delivery status
   - Contact Resend support if emails are being sent but not delivered

## Quick Checklist

- [ ] RESEND_API_KEY is set in Vercel
- [ ] RESEND_FROM_EMAIL is set to `onboarding@resend.dev`
- [ ] ADMIN_EMAIL matches your Resend account email
- [ ] Environment variables are saved in Vercel
- [ ] Application has been redeployed after setting variables
- [ ] Database has admin users with email addresses
- [ ] Resend API key is active on resend.com
- [ ] Checked spam/junk folder
- [ ] Verified Vercel deployment logs show email attempt
- [ ] DATABASE_URL is correct and database is accessible
