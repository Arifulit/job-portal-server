# Job Portal Server API

Express + TypeScript + MongoDB backend for a multi-role job portal application.

## Features

- Authentication with JWT and refresh token flow
- Candidate, recruiter, and admin profile management
- Job posting, application, and recruiter review workflow
- Resume upload support
- Payment, audit log, notification, and messaging modules
- Postman collection for end-to-end API testing workflow

## Tech Stack

- Node.js
- Express 5
- TypeScript
- MongoDB with Mongoose
- JWT authentication
- Multer / Cloudinary

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Create environment file

Copy `.env.example` to `.env` and update the values.

### 3. Run in development

```bash
npm run dev
```

### 4. Build for production

```bash
npm run build
npm start
```

## Available Scripts

- `npm run dev`: start the development server with hot reload
- `npm run build`: compile TypeScript into `dist`
- `npm run typecheck`: run TypeScript type checking without emitting files
- `npm run lint`: lint the source tree
- `npm test`: currently mapped to `typecheck`

## Core Environment Variables

- `PORT`: application port
- `DB_URL`: preferred MongoDB connection string
- `DB_URI`: supported alias for MongoDB connection string
- `MONGODB_URI`: supported alias for MongoDB connection string
- `JWT_SECRET`: preferred JWT signing secret
- `JWT_ACCESS_SECRET`: supported alias for JWT secret
- `FRONTEND_URL`: frontend origin for CORS
- `CLIENT_URL`: supported alias for frontend origin
- `GOOGLE_CLIENT_ID`: Google OAuth client ID
- `GOOGLE_CLIENT_SECRET`: Google OAuth client secret
- `GOOGLE_CALLBACK_URL`: OAuth callback URL (default: `http://localhost:5000/api/v1/auth/google/callback`)

## Health Endpoints

- `GET /health`
- `GET /api/v1/health`

## API Base URL

```text
http://localhost:5000/api/v1
```

## Main Route Groups

- `/auth`
- `/candidate`
- `/recruiter`
- `/admin`
- `/jobs`
- `/applications`
- `/payments`
- `/audit`
- `/company`
- `/agency`
- `/messages`
- `/notifications`

## Google OAuth Login

Endpoints:

- `GET /api/v1/auth/google`: starts Google OAuth flow
- `GET /api/v1/auth/google?redirect=/dashboard`: starts Google OAuth flow and sends the user back to a custom frontend path after login
- `GET /api/v1/auth/google/callback`: handles callback, logs user in or creates a new user
- `GET /api/v1/auth/google/callback?mode=json`: returns the auth payload as JSON instead of redirecting

Behavior:

- Existing user with same email: user is logged in
- New email: user is created with only `email`, `name`, and `avatar`
- No Google password is stored
- The callback issues the same access token and refresh token pair used by normal login
- If no frontend redirect path is supplied, the user is sent to the frontend root path

## Profile Image Upload

Profile images are uploaded through the existing profile update routes using `multipart/form-data`.

Supported endpoints:

- `PUT /api/v1/candidate` for candidate profile updates
- `PUT /api/v1/recruiter/profile` for recruiter profile updates
- `PUT /api/v1/admin` for admin profile updates

Accepted file field names:

- `avatar`
- `profilePicture`
- `image`
- `file`

Rules:

- Image only: `jpg`, `jpeg`, `png`, `webp`, `gif`
- Maximum size: `3MB`
- Send the image together with any other profile fields in the same request

## Postman Collections

- `job-server-api-postman_collection.json`
- `job-portal-full-api-collection.postman_collection.json`

## Vercel Deployment

This repository is configured for API-only deployment on Vercel through [`api/index.ts`](api/index.ts) and [`vercel.json`](vercel.json).

Note: Socket.IO/realtime features are not supported on Vercel serverless functions. Use the Vercel deployment only for the REST API.

## Notes

- Use role-specific accounts when testing protected routes.
- The server now accepts multiple env aliases for database and JWT setup to reduce configuration errors.
- Some modules depend on third-party services such as Cloudinary, SMTP, Redis, and payment providers. Configure only the services you use.
