# 💼 Career-Code: Professional Job Portal Backend

A **production-ready**, **enterprise-grade** Node.js + Express + TypeScript server application for a comprehensive Job Portal system with role-based access control, JWT authentication, and Supabase database integration.

## 🏗️ **System Architecture**

This is a **modular, scalable backend** designed following industry best practices:

- **Modular Architecture**: Feature-based organization (controllers, services, routes, models, middleware)
- **TypeScript**: Full type safety and modern JavaScript features
- **Security First**: JWT authentication, password hashing, input validation, rate limiting
- **Database**: Supabase (PostgreSQL) with Row Level Security
- **Professional Error Handling**: Centralized error management with custom error classes
- **Production Ready**: Environment-based configuration, logging, compression, CORS

---

## 📋 **Table of Contents**

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [Testing with Postman](#testing-with-postman)
- [Role-Based Access Control](#role-based-access-control)
- [Security Features](#security-features)

---

## ✨ **Features**

### **Authentication & Authorization**
- ✅ User registration with role selection (Admin, Employer, Recruiter, Job Seeker)
- ✅ Secure login with JWT access tokens and refresh tokens
- ✅ Password hashing with bcrypt
- ✅ Role-based access control (RBAC)
- ✅ Token refresh mechanism
- ✅ Password change functionality
- ✅ Profile management

### **Job Management**
- ✅ Create, read, update, delete job postings (Employer/Admin)
- ✅ Public job listing with search and filters
- ✅ Job status management (Active, Paused, Closed, Draft)
- ✅ Job type categorization (Full-time, Part-time, Contract, Internship, Freelance)
- ✅ View count tracking
- ✅ Application count tracking

### **Application Management**
- ✅ Job seekers can apply to jobs
- ✅ Resume and cover letter submission
- ✅ Application status tracking (Applied, Reviewing, Shortlisted, Interviewed, Offered, Hired, Rejected)
- ✅ Employers can view and manage applications
- ✅ Recruiters can update application status
- ✅ Prevent duplicate applications

### **Admin Dashboard**
- ✅ User management (view, activate/deactivate, delete)
- ✅ System-wide statistics and analytics
- ✅ View all jobs and applications
- ✅ Filter users by role and status

---

## 🛠️ **Tech Stack**

| **Technology** | **Purpose** |
|----------------|-------------|
| **Node.js** | Runtime environment |
| **Express** | Web framework |
| **TypeScript** | Type-safe development |
| **Supabase** | PostgreSQL database with real-time capabilities |
| **JWT** | Authentication tokens |
| **Bcrypt** | Password hashing |
| **Zod** | Schema validation |
| **Winston** | Logging |
| **Helmet** | Security headers |
| **CORS** | Cross-origin resource sharing |
| **Rate Limit** | API rate limiting |
| **Morgan** | HTTP request logging |
| **Compression** | Response compression |

---

## 📁 **Project Structure**

```
career-code-server/
│
├── src/
│   ├── config/                    # Configuration files
│   │   ├── env.ts                 # Environment validation
│   │   └── database.ts            # Supabase client setup
│   │
│   ├── modules/                   # Feature modules
│   │   ├── auth/                  # Authentication module
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.routes.ts
│   │   │   └── auth.validation.ts
│   │   │
│   │   ├── user/                  # User management
│   │   │   ├── user.controller.ts
│   │   │   ├── user.service.ts
│   │   │   └── user.routes.ts
│   │   │
│   │   ├── job/                   # Job management
│   │   │   ├── job.controller.ts
│   │   │   ├── job.service.ts
│   │   │   ├── job.routes.ts
│   │   │   └── job.validation.ts
│   │   │
│   │   ├── application/           # Application management
│   │   │   ├── application.controller.ts
│   │   │   ├── application.service.ts
│   │   │   └── application.routes.ts
│   │   │
│   │   └── admin/                 # Admin operations
│   │       ├── admin.controller.ts
│   │       ├── admin.service.ts
│   │       └── admin.routes.ts
│   │
│   ├── middleware/                # Express middleware
│   │   ├── auth.ts                # Authentication & authorization
│   │   ├── validate.ts            # Request validation
│   │   └── errorHandler.ts       # Error handling
│   │
│   ├── utils/                     # Utility functions
│   │   ├── logger.ts              # Winston logger
│   │   ├── response.ts            # Standard API responses
│   │   ├── errors.ts              # Custom error classes
│   │   ├── jwt.ts                 # JWT utilities
│   │   └── password.ts            # Password utilities
│   │
│   ├── types/                     # TypeScript types
│   │   └── index.ts               # Shared type definitions
│   │
│   ├── routes/                    # Route aggregation
│   │   └── index.ts               # Main router
│   │
│   ├── app.ts                     # Express app configuration
│   └── server.ts                  # Server entry point
│
├── .env                           # Environment variables
├── .env.example                   # Environment template
├── .gitignore                     # Git ignore rules
├── package.json                   # Dependencies
├── tsconfig.json                  # TypeScript config
├── Career-Code-API.postman_collection.json  # Postman collection
└── README.md                      # Documentation
```

---

## 🚀 **Installation**

### **Prerequisites**
- Node.js >= 18.0.0
- npm >= 9.0.0
- Supabase account (database already provisioned)

### **Steps**

1. **Install Dependencies**
```bash
npm install
```

2. **Configure Environment Variables**
```bash
cp .env.example .env
```

Edit `.env` with your actual values (Supabase credentials are already configured).

3. **Database Setup**

The database schema has been automatically created with these tables:
- `users` - User accounts with role-based access
- `refresh_tokens` - JWT refresh token storage
- `jobs` - Job postings
- `applications` - Job applications

All tables have Row Level Security (RLS) enabled.

---

## 🔐 **Environment Variables**

```bash
# Application
NODE_ENV=development
PORT=5000

# Supabase Database
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_key  # Optional

# JWT Configuration
JWT_ACCESS_SECRET=your_32_char_secret
JWT_REFRESH_SECRET=your_32_char_secret
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Security
BCRYPT_ROUNDS=10
CORS_ORIGIN=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
```

---

## 🗄️ **Database Setup**

The database has been initialized with the following schema:

### **Tables**

#### **users**
- User authentication and profile information
- Roles: `admin`, `employer`, `recruiter`, `job_seeker`
- Password stored as bcrypt hash

#### **refresh_tokens**
- JWT refresh token management
- Automatic expiration tracking

#### **jobs**
- Job posting information
- Status: `active`, `paused`, `closed`, `draft`
- Types: `full_time`, `part_time`, `contract`, `internship`, `freelance`

#### **applications**
- Job application tracking
- Status pipeline: `applied` → `reviewing` → `shortlisted` → `interviewed` → `offered` → `hired`/`rejected`

### **Row Level Security (RLS)**

All tables have RLS enabled with secure policies:
- Users can only access their own data
- Employers can manage their jobs and view applications
- Recruiters can update application statuses
- Admins have full access to all resources

---

## 🏃 **Running the Application**

### **Development Mode**
```bash
npm run dev
```
Server runs on `http://localhost:5000` with hot-reload enabled.

### **Build for Production**
```bash
npm run build
```
Compiles TypeScript to JavaScript in the `dist/` directory.

### **Start Production Server**
```bash
npm start
```
Runs the compiled JavaScript from `dist/`.

---

## 📚 **API Documentation**

### **Base URL**
```
http://localhost:5000/api/v1
```

### **Authentication**

All protected routes require the `Authorization` header:
```
Authorization: Bearer <access_token>
```

### **API Endpoints**

#### **Health Check**
```http
GET /health
```

#### **Authentication**
```http
POST   /auth/register          # Register new user
POST   /auth/login             # Login
POST   /auth/refresh-token     # Refresh access token
POST   /auth/logout            # Logout (requires auth)
POST   /auth/change-password   # Change password (requires auth)
GET    /auth/profile           # Get current user (requires auth)
```

#### **User Management**
```http
GET    /users/profile          # Get my profile (requires auth)
PUT    /users/profile          # Update my profile (requires auth)
DELETE /users/account          # Delete my account (requires auth)
```

#### **Jobs**
```http
GET    /jobs                   # Get all active jobs (public)
GET    /jobs/:id               # Get job by ID (public)
POST   /jobs                   # Create job (Employer/Admin only)
GET    /jobs/my/jobs           # Get my jobs (Employer/Admin only)
PUT    /jobs/:id               # Update job (Employer/Admin only)
DELETE /jobs/:id               # Delete job (Employer/Admin only)
```

#### **Applications**
```http
POST   /applications/jobs/:jobId/apply    # Apply to job (Job Seeker only)
GET    /applications/my                    # Get my applications (Job Seeker)
GET    /applications/jobs/:jobId           # Get applications for job (Employer/Recruiter/Admin)
PUT    /applications/:id/status            # Update application status (Employer/Recruiter/Admin)
DELETE /applications/:id                   # Delete application (Job Seeker)
```

#### **Admin**
```http
GET    /admin/dashboard         # Get dashboard statistics (Admin only)
GET    /admin/users             # Get all users (Admin only)
PUT    /admin/users/:id/status  # Update user status (Admin only)
DELETE /admin/users/:id          # Delete user (Admin only)
GET    /admin/jobs              # Get all jobs (Admin only)
GET    /admin/applications      # Get all applications (Admin only)
```

---

## 🧪 **Testing with Postman**

### **Import Collection**

1. Open Postman
2. Click **Import**
3. Select `Career-Code-API.postman_collection.json`
4. The collection includes:
   - Pre-configured requests for all endpoints
   - Automatic token management
   - Environment variables
   - Test scripts

### **Usage Flow**

1. **Register** a user (Admin, Employer, or Job Seeker)
2. **Login** - Tokens are automatically saved
3. **Create** resources based on your role
4. All subsequent requests use the saved token automatically

### **Collection Variables**

The collection automatically manages:
- `access_token` - JWT access token
- `refresh_token` - JWT refresh token
- `job_id` - Created job ID
- `application_id` - Created application ID
- `user_id` - User ID

---

## 👥 **Role-Based Access Control**

### **Admin**
- Full system access
- User management (CRUD)
- View all jobs and applications
- System analytics

### **Employer**
- Create and manage job postings
- View and manage applications for their jobs
- Update application statuses
- View company analytics

### **Recruiter**
- View assigned applications
- Update application statuses
- Manage recruitment pipeline
- Cannot create jobs

### **Job Seeker**
- Browse and search jobs
- Apply to jobs
- View own applications
- Manage profile

---

## 🔒 **Security Features**

### **Implemented Security Measures**

| **Feature** | **Implementation** |
|-------------|-------------------|
| **Password Security** | Bcrypt hashing with 10 rounds |
| **JWT Tokens** | Separate access (15m) and refresh (7d) tokens |
| **Input Validation** | Zod schema validation on all requests |
| **SQL Injection** | Parameterized queries via Supabase client |
| **XSS Protection** | Helmet middleware |
| **CORS** | Configured origin whitelist |
| **Rate Limiting** | 100 requests per 15 minutes |
| **HTTPS** | Recommended for production |
| **Row Level Security** | Database-level access control |
| **Error Handling** | No sensitive data in error responses |

### **Password Requirements**
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

---

## 📝 **Error Handling**

### **Standard Error Response**
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message (development only)"
}
```

### **HTTP Status Codes**
- `200` - Success
- `201` - Created
- `400` - Bad Request / Validation Error
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `500` - Internal Server Error

---

## 🚀 **Production Deployment**

### **Pre-Deployment Checklist**

- [ ] Update JWT secrets with strong, random strings
- [ ] Set `NODE_ENV=production`
- [ ] Configure production database credentials
- [ ] Enable HTTPS
- [ ] Set up logging service
- [ ] Configure CORS for production domain
- [ ] Set up process manager (PM2)
- [ ] Enable database backups
- [ ] Set up monitoring

### **Environment Variables for Production**

Ensure all sensitive keys are securely stored and not committed to version control.

---

## 📊 **Logging**

The application uses **Winston** for structured logging:

- **Development**: Colorized console output
- **Production**: JSON formatted logs
- **Levels**: error, warn, info, debug

---

## 🤝 **Contributing**

This is a final-year project. For academic or professional inquiries, please contact the project maintainer.

---

## 📄 **License**

MIT License - Free to use for educational and commercial purposes.

---

## 🎓 **Academic Information**

**Project**: Career-Code Job Portal Backend
**Type**: Final Year Project
**Architecture**: Modular TypeScript + Express + Supabase
**Features**: Complete CRUD operations, Authentication, Authorization, Database Integration

---

## 📞 **Support**

For issues or questions:
1. Check the Postman collection for API examples
2. Review the error messages in the response
3. Check the server logs for detailed information
4. Verify environment variables are correctly configured

---

## 🎯 **Quick Start Summary**

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your credentials

# 3. Run development server
npm run dev

# 4. Import Postman collection
# File: Career-Code-API.postman_collection.json

# 5. Test the API
# Start with /auth/register endpoint
```

**Server will be running at**: `http://localhost:5000/api/v1`

---

**🎉 Your professional job portal backend is ready for production!**
