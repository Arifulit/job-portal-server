# Job Portal Server API

Express + TypeScript + MongoDB backend for a multi-role job portal application.

## Features

- Authentication with JWT and refresh token flow
- Candidate, recruiter, and admin profile management
- Job posting, application, and recruiter review workflow
- Resume upload support
- Payment, audit log, notification, and messaging modules
- Postman collection for end-to-end API testing

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

## Postman Collections

- `job-server-api-postman_collection.json`
- `job-portal-full-api-collection.postman_collection.json`

## Notes

- Use role-specific accounts when testing protected routes.
- The server now accepts multiple env aliases for database and JWT setup to reduce configuration errors.
- Some modules depend on third-party services such as Cloudinary, SMTP, Redis, and payment providers. Configure only the services you use.
