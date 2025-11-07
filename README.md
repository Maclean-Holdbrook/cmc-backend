# CMC IT System Support - Backend API

RESTful API for the CMC IT System Support complaint management system.

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** PostgreSQL (Supabase)
- **Database Client:** pg (node-postgres) with connection pooling
- **Authentication:** JWT
- **Email:** Resend API
- **SMS:** Twilio API
- **File Upload:** Multer
- **Deployment:** Vercel (Serverless)

## Features

- Staff complaint submission with image upload
- Admin authentication and authorization
- Worker authentication and ticket management
- Email notifications for complaints and ticket assignments
- Multi-admin email support
- Optimized database connection pooling
- JWT-based authentication
- CORS configuration for frontend integration

## Local Development Setup

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL database (Supabase recommended)
- Resend API key (for email notifications)
- Twilio account (optional, for SMS notifications)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Maclean-Holdbrook/cmc-backend.git
   cd cmc-backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```

4. Update the `.env` file with your credentials:
   - `DATABASE_URL`: Your Supabase pooler connection string
   - `JWT_SECRET`: A secure random string
   - `RESEND_API_KEY`: Your Resend API key
   - `RESEND_FROM_EMAIL`: Your sender email
   - `ADMIN_EMAIL`: Admin email for notifications
   - Other optional configurations

5. Run the database migrations:
   ```bash
   node create-tables-direct.js
   ```

6. Seed the database with an admin user:
   ```bash
   node seed-admin.js
   ```

7. Start the development server:
   ```bash
   npm run dev
   ```

The API will be available at `http://localhost:5000`

## Deployment to Vercel

### Method 1: Deploy via Vercel Dashboard

1. Push your code to GitHub
2. Go to [Vercel Dashboard](https://vercel.com/dashboard)
3. Click "Add New Project"
4. Import your backend repository
5. Configure environment variables in Vercel:
   - Add all variables from `.env.example`
   - Make sure to use production values
6. Click "Deploy"

### Method 2: Deploy via Vercel CLI

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Deploy:
   ```bash
   vercel
   ```

4. For production deployment:
   ```bash
   vercel --prod
   ```

### Environment Variables for Vercel

Add these environment variables in Vercel Project Settings:

```
NODE_ENV=production
DATABASE_URL=your_supabase_pooler_connection_string
JWT_SECRET=your_secure_jwt_secret
JWT_EXPIRE=7d
CORS_ORIGIN=https://your-frontend-app.vercel.app
RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL=onboarding@resend.dev
ADMIN_EMAIL=your-verified-email@example.com
API_VERSION=v1
```

Optional (for SMS):
```
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=your_twilio_number
```

### Important Notes for Vercel Deployment

1. **File Uploads**: Vercel's serverless functions are read-only. For production, consider using a cloud storage service like:
   - AWS S3
   - Cloudinary
   - Vercel Blob
   - Supabase Storage

2. **Database Connections**: The app uses pg connection pooling which works well with serverless. Make sure to use Supabase's transaction pooler (port 6543) for best performance.

3. **CORS**: Update the `CORS_ORIGIN` environment variable to match your frontend URL.

4. **Cold Starts**: First request after inactivity may be slower due to serverless cold starts.

## API Endpoints

### Health Check
- `GET /health` - API health check

### Staff Routes
- `POST /api/v1/staff/complaints` - Submit a complaint (with image upload)

### Admin Routes
- `POST /api/v1/admin/register` - Register new admin
- `POST /api/v1/admin/login` - Admin login
- `GET /api/v1/admin/dashboard/stats` - Get dashboard statistics
- `GET /api/v1/admin/complaints` - Get all complaints
- `GET /api/v1/admin/complaints/:id` - Get specific complaint
- `PUT /api/v1/admin/complaints/:id` - Update complaint status
- `DELETE /api/v1/admin/complaints/:id` - Delete complaint
- `POST /api/v1/admin/tickets` - Create a ticket
- `GET /api/v1/admin/tickets` - Get all tickets
- `PUT /api/v1/admin/tickets/:id` - Update ticket
- `DELETE /api/v1/admin/tickets/:id` - Delete ticket
- `GET /api/v1/admin/workers` - Get all workers
- `POST /api/v1/admin/workers` - Create worker
- `PUT /api/v1/admin/workers/:id` - Update worker
- `DELETE /api/v1/admin/workers/:id` - Delete worker
- `GET /api/v1/admin/admins` - Get all admins
- `PUT /api/v1/admin/profile` - Update admin profile

### Worker Routes
- `POST /api/v1/worker/login` - Worker login
- `GET /api/v1/worker/dashboard/stats` - Worker dashboard stats
- `GET /api/v1/worker/tickets` - Get worker's tickets
- `GET /api/v1/worker/tickets/:id` - Get specific ticket
- `PUT /api/v1/worker/tickets/:id/status` - Update ticket status
- `PUT /api/v1/worker/profile` - Update worker profile

## Scripts

- `npm run dev` - Start development server with nodemon
- `npm start` - Start production server
- `node create-tables-direct.js` - Create database tables
- `node seed-admin.js` - Seed admin user
- `node scripts/create-admin.js` - Create additional admin
- `node scripts/create-worker.js` - Create worker account
- `node scripts/clear-all-accounts.js` - Clear all accounts (development only)

## Database Schema

The application uses the following main tables:
- `complaints` - Staff complaints
- `tickets` - Assigned tickets
- `admins` - Admin users
- `workers` - Worker users

See `create-tables.sql` for complete schema.

## Support

For issues or questions, please open an issue on GitHub.

## License

MIT
