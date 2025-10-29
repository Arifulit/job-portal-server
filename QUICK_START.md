# ⚡ Quick Start Guide - Career-Code Backend

Get your Job Portal backend running in under 5 minutes!

## 🎯 Prerequisites

- Node.js 18+ installed
- npm 9+ installed
- Supabase account (already configured)

## 🚀 Installation Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Setup

The `.env` file is already configured with Supabase credentials. Verify it contains:

```bash
NODE_ENV=development
PORT=5000

SUPABASE_URL=<your-url>
SUPABASE_ANON_KEY=<your-key>

JWT_ACCESS_SECRET=<change-in-production>
JWT_REFRESH_SECRET=<change-in-production>
```

### 3. Database Verification

The database schema is already created with these tables:
- ✅ `users` - User accounts
- ✅ `refresh_tokens` - JWT tokens
- ✅ `jobs` - Job postings
- ✅ `applications` - Job applications

### 4. Start Development Server

```bash
npm run dev
```

You should see:
```
✅ Database initialized successfully
🚀 Server running in development mode on port 5000
📍 API Base URL: http://localhost:5000/api/v1
💚 Health Check: http://localhost:5000/api/v1/health
```

## 🧪 Test the API

### Option 1: Using Postman

1. Open Postman
2. Import `Career-Code-API.postman_collection.json`
3. Start with **Register Job Seeker** request
4. Tokens are automatically saved for subsequent requests

### Option 2: Using cURL

**Test Health Check:**
```bash
curl http://localhost:5000/api/v1/health
```

**Register a User:**
```bash
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!",
    "full_name": "Test User",
    "role": "job_seeker"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!"
  }'
```

## 📋 Common Tasks

### Build for Production

```bash
npm run build
```

### Start Production Server

```bash
npm start
```

### View Logs

Development server shows live logs in console.

## 🔐 Creating Test Users

### Admin User
```json
{
  "email": "admin@careercode.com",
  "password": "AdminPass123!",
  "full_name": "Admin User",
  "role": "admin"
}
```

### Employer User
```json
{
  "email": "employer@company.com",
  "password": "EmployerPass123!",
  "full_name": "Jane Smith",
  "role": "employer",
  "company_name": "TechCorp Inc"
}
```

### Job Seeker User
```json
{
  "email": "jobseeker@example.com",
  "password": "SeekerPass123!",
  "full_name": "John Doe",
  "role": "job_seeker"
}
```

### Recruiter User
```json
{
  "email": "recruiter@agency.com",
  "password": "RecruiterPass123!",
  "full_name": "Sarah Johnson",
  "role": "recruiter"
}
```

## 🎮 Testing Workflow

### 1. Register Users
Create one user for each role using the Postman collection.

### 2. Create a Job (as Employer)
```bash
POST /api/v1/jobs
Authorization: Bearer <employer_access_token>

{
  "title": "Senior Developer",
  "description": "We're hiring!",
  "requirements": ["5+ years experience"],
  "job_type": "full_time",
  "location": "Remote",
  "salary_min": 80000,
  "salary_max": 120000
}
```

### 3. Apply for Job (as Job Seeker)
```bash
POST /api/v1/applications/jobs/{jobId}/apply
Authorization: Bearer <jobseeker_access_token>

{
  "resume_url": "https://example.com/resume.pdf",
  "cover_letter": "I'm interested in this position"
}
```

### 4. View Applications (as Employer)
```bash
GET /api/v1/applications/jobs/{jobId}
Authorization: Bearer <employer_access_token>
```

### 5. Update Application Status (as Employer)
```bash
PUT /api/v1/applications/{applicationId}/status
Authorization: Bearer <employer_access_token>

{
  "status": "shortlisted"
}
```

## 📊 Available Endpoints

### Public Routes
- `GET /api/v1/health` - Server health check
- `GET /api/v1/jobs` - List all active jobs
- `GET /api/v1/jobs/:id` - Get job details

### Authentication Routes
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/refresh-token` - Refresh access token
- `POST /api/v1/auth/logout` - Logout
- `POST /api/v1/auth/change-password` - Change password

### User Routes (Authenticated)
- `GET /api/v1/users/profile` - Get my profile
- `PUT /api/v1/users/profile` - Update profile
- `DELETE /api/v1/users/account` - Delete account

### Job Routes (Employer/Admin)
- `POST /api/v1/jobs` - Create job
- `GET /api/v1/jobs/my/jobs` - Get my jobs
- `PUT /api/v1/jobs/:id` - Update job
- `DELETE /api/v1/jobs/:id` - Delete job

### Application Routes
- `POST /api/v1/applications/jobs/:jobId/apply` - Apply for job
- `GET /api/v1/applications/my` - Get my applications
- `GET /api/v1/applications/jobs/:jobId` - Get job applications
- `PUT /api/v1/applications/:id/status` - Update status
- `DELETE /api/v1/applications/:id` - Delete application

### Admin Routes (Admin Only)
- `GET /api/v1/admin/dashboard` - Dashboard stats
- `GET /api/v1/admin/users` - All users
- `PUT /api/v1/admin/users/:id/status` - Update user status
- `DELETE /api/v1/admin/users/:id` - Delete user
- `GET /api/v1/admin/jobs` - All jobs
- `GET /api/v1/admin/applications` - All applications

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9
```

### Database Connection Error
- Verify Supabase credentials in `.env`
- Check internet connection
- Verify Supabase project is active

### JWT Token Errors
- Ensure JWT secrets are at least 32 characters
- Check token expiry hasn't passed
- Verify Authorization header format: `Bearer <token>`

### Build Errors
```bash
# Clear cache and rebuild
rm -rf dist node_modules package-lock.json
npm install
npm run build
```

## 📚 Next Steps

1. **Read Full Documentation**: Check `README.md` for detailed information
2. **API Reference**: See `API_DOCUMENTATION.md` for complete endpoint details
3. **Deploy to Production**: Follow `DEPLOYMENT.md` for deployment guide
4. **Test Everything**: Use Postman collection for comprehensive testing

## 🎉 You're All Set!

Your Career-Code backend is now running at:
```
http://localhost:5000/api/v1
```

**Happy Coding! 🚀**
