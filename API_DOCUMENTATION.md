# 📘 Career-Code API Documentation

Complete API reference for the Career-Code Job Portal Backend.

## 🌐 Base URL

```
http://localhost:5000/api/v1
```

## 🔑 Authentication

Most endpoints require authentication using JWT tokens in the Authorization header:

```http
Authorization: Bearer <access_token>
```

### Token Types

1. **Access Token**: Short-lived (15 minutes), used for API requests
2. **Refresh Token**: Long-lived (7 days), used to obtain new access tokens

---

## 📍 Endpoints

### 1. Health Check

#### Check Server Status
```http
GET /health
```

**Response:**
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2025-10-29T10:30:00.000Z"
}
```

---

### 2. Authentication Endpoints

#### 2.1 Register User

```http
POST /auth/register
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "full_name": "John Doe",
  "role": "job_seeker",
  "phone": "+1234567890",
  "company_name": "Optional for employers"
}
```

**Validation Rules:**
- Email: Valid email format
- Password: Min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
- Role: One of `admin`, `employer`, `recruiter`, `job_seeker`

**Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "full_name": "John Doe",
      "role": "job_seeker",
      "is_active": true,
      "is_verified": false,
      "created_at": "2025-10-29T10:30:00.000Z"
    },
    "tokens": {
      "accessToken": "jwt_access_token",
      "refreshToken": "jwt_refresh_token"
    }
  }
}
```

#### 2.2 Login

```http
POST /auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "full_name": "John Doe",
      "role": "job_seeker"
    },
    "tokens": {
      "accessToken": "jwt_access_token",
      "refreshToken": "jwt_refresh_token"
    }
  }
}
```

#### 2.3 Refresh Access Token

```http
POST /auth/refresh-token
```

**Request Body:**
```json
{
  "refreshToken": "your_refresh_token"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "new_jwt_access_token"
  }
}
```

#### 2.4 Logout

```http
POST /auth/logout
```

**Headers:** `Authorization: Bearer <access_token>`

**Request Body:**
```json
{
  "refreshToken": "your_refresh_token"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

#### 2.5 Change Password

```http
POST /auth/change-password
```

**Headers:** `Authorization: Bearer <access_token>`

**Request Body:**
```json
{
  "oldPassword": "OldSecurePass123!",
  "newPassword": "NewSecurePass456!"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

#### 2.6 Get Profile

```http
GET /auth/profile
```

**Headers:** `Authorization: Bearer <access_token>`

**Response (200):**
```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "role": "job_seeker"
    }
  }
}
```

---

### 3. User Management

#### 3.1 Get My Profile

```http
GET /users/profile
```

**Headers:** `Authorization: Bearer <access_token>`

**Response (200):**
```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "full_name": "John Doe",
      "role": "job_seeker",
      "phone": "+1234567890",
      "profile_image": "https://example.com/image.jpg",
      "is_active": true,
      "is_verified": false,
      "created_at": "2025-10-29T10:30:00.000Z",
      "updated_at": "2025-10-29T10:30:00.000Z"
    }
  }
}
```

#### 3.2 Update Profile

```http
PUT /users/profile
```

**Headers:** `Authorization: Bearer <access_token>`

**Request Body:**
```json
{
  "full_name": "John Updated Doe",
  "phone": "+1234567899",
  "company_name": "New Company",
  "profile_image": "https://example.com/new-image.jpg"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "user": { /* updated user object */ }
  }
}
```

#### 3.3 Delete Account

```http
DELETE /users/account
```

**Headers:** `Authorization: Bearer <access_token>`

**Response (200):**
```json
{
  "success": true,
  "message": "Account deleted successfully"
}
```

---

### 4. Job Management

#### 4.1 Get All Jobs (Public)

```http
GET /jobs
```

**Query Parameters:**
- `search` (optional): Search in title and description
- `location` (optional): Filter by location
- `job_type` (optional): Filter by job type

**Example:**
```http
GET /jobs?search=developer&location=Remote&job_type=full_time
```

**Response (200):**
```json
{
  "success": true,
  "message": "Jobs retrieved successfully",
  "data": {
    "jobs": [
      {
        "id": "uuid",
        "title": "Senior Developer",
        "description": "Job description",
        "requirements": ["Requirement 1", "Requirement 2"],
        "job_type": "full_time",
        "location": "Remote",
        "salary_min": 80000,
        "salary_max": 120000,
        "status": "active",
        "views_count": 150,
        "applications_count": 25,
        "created_at": "2025-10-29T10:30:00.000Z"
      }
    ],
    "count": 1
  }
}
```

#### 4.2 Get Job by ID

```http
GET /jobs/:id
```

**Response (200):**
```json
{
  "success": true,
  "message": "Job retrieved successfully",
  "data": {
    "job": { /* job object */ }
  }
}
```

#### 4.3 Create Job

```http
POST /jobs
```

**Headers:** `Authorization: Bearer <access_token>`

**Roles:** `employer`, `admin`

**Request Body:**
```json
{
  "title": "Senior Full Stack Developer",
  "description": "Detailed job description",
  "requirements": [
    "5+ years experience",
    "TypeScript proficiency",
    "React and Node.js"
  ],
  "job_type": "full_time",
  "location": "Remote",
  "salary_min": 80000,
  "salary_max": 120000,
  "deadline": "2025-12-31T23:59:59Z",
  "company_logo": "https://example.com/logo.png"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Job created successfully",
  "data": {
    "job": { /* created job object */ }
  }
}
```

#### 4.4 Get My Jobs

```http
GET /jobs/my/jobs
```

**Headers:** `Authorization: Bearer <access_token>`

**Roles:** `employer`, `admin`

**Response (200):**
```json
{
  "success": true,
  "message": "Jobs retrieved successfully",
  "data": {
    "jobs": [ /* array of employer's jobs */ ],
    "count": 5
  }
}
```

#### 4.5 Update Job

```http
PUT /jobs/:id
```

**Headers:** `Authorization: Bearer <access_token>`

**Roles:** `employer`, `admin`

**Request Body:**
```json
{
  "title": "Updated Job Title",
  "status": "paused",
  "salary_max": 130000
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Job updated successfully",
  "data": {
    "job": { /* updated job object */ }
  }
}
```

#### 4.6 Delete Job

```http
DELETE /jobs/:id
```

**Headers:** `Authorization: Bearer <access_token>`

**Roles:** `employer`, `admin`

**Response (200):**
```json
{
  "success": true,
  "message": "Job deleted successfully"
}
```

---

### 5. Application Management

#### 5.1 Apply for Job

```http
POST /applications/jobs/:jobId/apply
```

**Headers:** `Authorization: Bearer <access_token>`

**Roles:** `job_seeker`

**Request Body:**
```json
{
  "resume_url": "https://example.com/resume.pdf",
  "cover_letter": "I am very interested in this position..."
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Application submitted successfully",
  "data": {
    "application": {
      "id": "uuid",
      "job_id": "uuid",
      "applicant_id": "uuid",
      "status": "applied",
      "resume_url": "https://example.com/resume.pdf",
      "cover_letter": "Cover letter text",
      "applied_at": "2025-10-29T10:30:00.000Z"
    }
  }
}
```

#### 5.2 Get My Applications

```http
GET /applications/my
```

**Headers:** `Authorization: Bearer <access_token>`

**Roles:** `job_seeker`

**Response (200):**
```json
{
  "success": true,
  "message": "Applications retrieved successfully",
  "data": {
    "applications": [
      {
        "id": "uuid",
        "status": "shortlisted",
        "applied_at": "2025-10-29T10:30:00.000Z",
        "job": {
          "id": "uuid",
          "title": "Senior Developer",
          "location": "Remote",
          "status": "active"
        }
      }
    ],
    "count": 3
  }
}
```

#### 5.3 Get Applications for Job

```http
GET /applications/jobs/:jobId
```

**Headers:** `Authorization: Bearer <access_token>`

**Roles:** `employer`, `recruiter`, `admin`

**Response (200):**
```json
{
  "success": true,
  "message": "Applications retrieved successfully",
  "data": {
    "applications": [
      {
        "id": "uuid",
        "status": "applied",
        "resume_url": "https://example.com/resume.pdf",
        "applied_at": "2025-10-29T10:30:00.000Z",
        "applicant": {
          "id": "uuid",
          "full_name": "John Doe",
          "email": "john@example.com",
          "phone": "+1234567890"
        }
      }
    ],
    "count": 15
  }
}
```

#### 5.4 Update Application Status

```http
PUT /applications/:id/status
```

**Headers:** `Authorization: Bearer <access_token>`

**Roles:** `employer`, `recruiter`, `admin`

**Request Body:**
```json
{
  "status": "shortlisted"
}
```

**Valid Statuses:**
- `applied`
- `reviewing`
- `shortlisted`
- `interviewed`
- `offered`
- `hired`
- `rejected`

**Response (200):**
```json
{
  "success": true,
  "message": "Application status updated successfully",
  "data": {
    "application": { /* updated application */ }
  }
}
```

#### 5.5 Delete Application

```http
DELETE /applications/:id
```

**Headers:** `Authorization: Bearer <access_token>`

**Roles:** `job_seeker`

**Response (200):**
```json
{
  "success": true,
  "message": "Application deleted successfully"
}
```

---

### 6. Admin Management

#### 6.1 Get Dashboard Statistics

```http
GET /admin/dashboard
```

**Headers:** `Authorization: Bearer <access_token>`

**Roles:** `admin`

**Response (200):**
```json
{
  "success": true,
  "message": "Dashboard stats retrieved successfully",
  "data": {
    "users": {
      "total": 1250,
      "byRole": {
        "admin": 5,
        "employer": 150,
        "recruiter": 45,
        "job_seeker": 1050
      }
    },
    "jobs": {
      "total": 450,
      "byStatus": {
        "active": 300,
        "paused": 50,
        "closed": 100
      }
    },
    "applications": {
      "total": 3500,
      "byStatus": {
        "applied": 1200,
        "shortlisted": 800,
        "hired": 350,
        "rejected": 1150
      }
    }
  }
}
```

#### 6.2 Get All Users

```http
GET /admin/users
```

**Headers:** `Authorization: Bearer <access_token>`

**Roles:** `admin`

**Query Parameters:**
- `role` (optional): Filter by role
- `is_active` (optional): Filter by active status

**Example:**
```http
GET /admin/users?role=employer&is_active=true
```

**Response (200):**
```json
{
  "success": true,
  "message": "Users retrieved successfully",
  "data": {
    "users": [ /* array of user objects */ ],
    "count": 150
  }
}
```

#### 6.3 Update User Status

```http
PUT /admin/users/:userId/status
```

**Headers:** `Authorization: Bearer <access_token>`

**Roles:** `admin`

**Request Body:**
```json
{
  "isActive": false
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "User status updated successfully",
  "data": {
    "user": { /* updated user */ }
  }
}
```

#### 6.4 Delete User

```http
DELETE /admin/users/:userId
```

**Headers:** `Authorization: Bearer <access_token>`

**Roles:** `admin`

**Response (200):**
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

#### 6.5 Get All Jobs (Admin)

```http
GET /admin/jobs
```

**Headers:** `Authorization: Bearer <access_token>`

**Roles:** `admin`

**Response (200):**
```json
{
  "success": true,
  "message": "Jobs retrieved successfully",
  "data": {
    "jobs": [
      {
        "id": "uuid",
        "title": "Job Title",
        "status": "active",
        "employer": {
          "id": "uuid",
          "full_name": "Employer Name",
          "company_name": "Company Inc"
        }
      }
    ],
    "count": 450
  }
}
```

#### 6.6 Get All Applications (Admin)

```http
GET /admin/applications
```

**Headers:** `Authorization: Bearer <access_token>`

**Roles:** `admin`

**Response (200):**
```json
{
  "success": true,
  "message": "Applications retrieved successfully",
  "data": {
    "applications": [ /* all applications with job and applicant info */ ],
    "count": 3500
  }
}
```

---

## ❌ Error Responses

### Standard Error Format

```json
{
  "success": false,
  "message": "Error message",
  "error": "Detailed error (development only)"
}
```

### Common HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request / Validation Error |
| 401 | Unauthorized (invalid/missing token) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not Found |
| 409 | Conflict (e.g., duplicate application) |
| 500 | Internal Server Error |

### Example Error Responses

**Validation Error (400):**
```json
{
  "success": false,
  "message": "Validation failed",
  "error": "body.email: Invalid email address"
}
```

**Unauthorized (401):**
```json
{
  "success": false,
  "message": "Invalid or expired access token"
}
```

**Forbidden (403):**
```json
{
  "success": false,
  "message": "Access denied. Required roles: employer, admin"
}
```

**Not Found (404):**
```json
{
  "success": false,
  "message": "Job not found"
}
```

---

## 🔐 Security Notes

1. **Always use HTTPS in production**
2. **Store tokens securely** (not in localStorage for web apps)
3. **Implement token refresh** before access token expires
4. **Rate limiting** is active: 100 requests per 15 minutes
5. **Password requirements** are strictly enforced
6. **CORS** is configured - update for production domain

---

## 📊 Rate Limiting

- **Window**: 15 minutes (900,000ms)
- **Max Requests**: 100 per window
- **Applies to**: All `/api/*` routes

**Rate Limit Exceeded Response:**
```json
{
  "message": "Too many requests from this IP, please try again later"
}
```

---

## 🎯 Quick Testing Flow

1. **Register** as an employer: `POST /auth/register`
2. **Login**: `POST /auth/login` (save tokens)
3. **Create Job**: `POST /jobs`
4. **Register** as a job seeker (new account)
5. **Apply**: `POST /applications/jobs/:jobId/apply`
6. **Check Applications** (as employer): `GET /applications/jobs/:jobId`
7. **Update Status**: `PUT /applications/:id/status`

---

**For full examples, import the Postman collection provided in the project.**
