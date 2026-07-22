# Ocean Cleanup Backend

This is the Express.js backend API for the Ocean Cleanup tracking platform. It handles the core business logic, activity submissions, reviews, and data persistence.

## Features

- **Activity Tracking API**: Endpoints to create, read, review, and mint rewards for cleanup activities.
- **File System Persistence**: Lightweight local JSON data store (`data/activities.json`) for easy development and testing.
- **Upload Mocking**: Basic endpoints to handle file uploads and evidence verification.

## API Endpoints

- `GET /api/health` - Health check
- `GET /api/activities` - List all activities
- `POST /api/activities` - Submit a new activity (requires category, location, quantity, evidenceHash, etc.)
- `GET /api/activities/:id` - Get specific activity details
- `POST /api/activities/:id/review` - Review an activity (approve/reject)
- `POST /api/activities/:id/mint` - Mint reward tokens for an activity
- `POST /api/uploads` - Handle file uploads

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the server:
   ```bash
   npm start
   ```

The server will automatically find an available port and start listening. Check the console output for the specific URL.

## Architecture

- Uses standard Express middleware (`cors`, `express.json`)
- Modular routing in `src/routes/`
- Request handling logic in `src/controllers/`
- Data stored locally in the `data/` directory
