# Job Portal Server API

Production-ready backend API for a multi-role job portal platform, built with Express 5, TypeScript, and MongoDB.

## Overview

This service powers candidate, recruiter, and admin workflows, including authentication, job lifecycle management, applications, messaging, notifications, analytics, and resume processing.

## Key Features

- JWT-based authentication with refresh token support
- Role-based access for candidate, recruiter, and admin users
- Job posting and application workflow
- Resume upload and resume-related APIs
- Messaging, notifications, audit logs, and analytics endpoints
- Google OAuth login flow
- Postman collections for manual API testing

## Technology Stack

- Node.js (supported: 20 or 22)
- Express 5
- TypeScript
- MongoDB + Mongoose
- Passport (Google OAuth)
- Multer + Cloudinary
- Redis (optional, for cache/queue related workflows)

## Project Structure

- `src/server.ts`: server bootstrap
- `src/app.ts`: middleware, CORS, health checks, and route mounting
- `src/app/routes/index.ts`: API route composition for `/api/v1`
- `src/app/modules/*`: domain modules (auth, job, application, profile, etc.)
- `src/app/config/*`: environment, DB, JWT, mail, and integration configs
- `api/index.ts`: Vercel serverless entry

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Create `.env` from `.env.example` and update values for your environment.

```bash
copy .env.example .env
```

### 3. Run development server

```bash
npm run dev
```

### 4. Build and run production mode

```bash
npm run build
npm start
```

## NPM Scripts

- `npm run dev`: run with hot reload using ts-node-dev
- `npm run build`: compile TypeScript to `dist`
- `npm run typecheck`: run TypeScript checks without emitting files
- `npm run lint`: lint source files in `src`
- `npm test`: currently mapped to `npm run typecheck`

## Environment Variables

The app accepts aliases for a few variables to reduce configuration mistakes.

| Variable | Required | Purpose |
| --- | --- | --- |
| `NODE_ENV` | No | Runtime mode (`development` by default) |
| `PORT` | No | HTTP port (default: `5000`) |
| `DB_URL` | Yes | Primary MongoDB connection string |
| `DB_URI` | No | Alias of `DB_URL` |
| `MONGODB_URI` | No | Alias of `DB_URL` |
| `JWT_SECRET` | Yes | Access token signing secret |
| `JWT_ACCESS_SECRET` | No | Alias of `JWT_SECRET` |
| `JWT_REFRESH_SECRET` | Yes | Refresh token signing secret |
| `FRONTEND_URL` | Yes | Main frontend origin for CORS |
| `CLIENT_URL` | No | Alias of `FRONTEND_URL` |
| `EXPRESS_SESSION_SECRET` | Yes | Session middleware secret |
| `GOOGLE_CLIENT_ID` | Optional | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Optional | Google OAuth client secret |
| `GOOGLE_CALLBACK_URL` | Optional | OAuth callback URL |
| `CLOUDINARY_CLOUD_NAME` | Optional | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Optional | Cloudinary key |
| `CLOUDINARY_API_SECRET` | Optional | Cloudinary secret |
| `SMTP_HOST` | Optional | SMTP host |
| `SMTP_PORT` | Optional | SMTP port |
| `SMTP_USER` | Optional | SMTP username |
| `SMTP_PASS` | Optional | SMTP password |
| `SMTP_FROM` | Optional | Default sender email |
| `REDIS_HOST` | Optional | Redis host |
| `REDIS_PORT` | Optional | Redis port |
| `REDIS_PASSWORD` | Optional | Redis password |

See `.env.example` for the complete list, including payment provider keys and optional admin bootstrap variables.

## Base URL and Health Checks

- Base API URL: `http://localhost:5000/api/v1`
- Health endpoint: `GET /health`
- Versioned health endpoint: `GET /api/v1/health`

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
- `/salary`
- `/messages`
- `/notifications`
- `/resume`
- `/career-resources`
- `/analytics`

## Google OAuth

- `GET /api/v1/auth/google`: start OAuth flow
- `GET /api/v1/auth/google?redirect=/dashboard`: start flow with frontend redirect hint
- `GET /api/v1/auth/google/callback`: handle callback and sign in/up user
- `GET /api/v1/auth/google/callback?mode=json`: return payload as JSON instead of redirect

## File Upload Notes

Profile image updates are supported through profile update routes with `multipart/form-data`.

- Candidate: `PUT /api/v1/candidate`
- Recruiter: `PUT /api/v1/recruiter/profile`
- Admin: `PUT /api/v1/admin`

Accepted image field names:

- `avatar`
- `profilePicture`
- `image`
- `file`

Constraints:

- Allowed formats: `jpg`, `jpeg`, `png`, `webp`, `gif`
- Maximum size: `3MB`

## Postman Collections

- `job-portal-full-api-collection.postman_collection.json`
- `RESUME_UPLOAD_TESTS.postman_collection.json`

## Deployment

This repository supports API-only deployment on Vercel using `api/index.ts` and `vercel.json`.

Important: Socket.IO and long-lived realtime connections are not supported on standard Vercel serverless functions. Use dedicated infrastructure for realtime workloads.

## Operational Notes

- Use role-specific test accounts for protected endpoints.
- Configure only the external integrations you need (Cloudinary, SMTP, Redis, payment providers).
- Keep production secrets out of version control and rotate credentials periodically.
