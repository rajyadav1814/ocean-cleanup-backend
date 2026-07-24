# Ocean Cleanup Backend

Express.js backend API for the Ocean Cleanup tracking platform.

## Features

- PostgreSQL-backed authentication, activity tracking, and dashboard stats
- Activity submission, review, and reward minting APIs
- File uploads and IPFS upload support
- Modular routes, controllers, and services

## API Endpoints

- `GET /api/health` - Health check
- `GET /api/activities` - List activities (`?status=pending|approved|rejected`)
- `POST /api/activities` - Submit a new activity
- `GET /api/activities/:id` - Get activity details
- `POST /api/activities/:id/review` - Review an activity
- `POST /api/activities/:id/mint` - Mint reward tokens for an activity
- `GET /api/dashboard/stats` - Dashboard statistics
- `POST /api/uploads` - Handle file uploads
- `POST /api/auth/signup` - Register a user
- `POST /api/auth/login` - Login
- `GET /api/auth/verify` - Verify JWT

## Environment Variables

Create a `.env` file with at least:

```env
PORT=3000
HOST=localhost
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ocean_db
JWT_SECRET=your_secret_here
```

## Database

Run the PostgreSQL schema in `db/schema.sql` before starting the server.

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Start the server:

```bash
npm start
```
