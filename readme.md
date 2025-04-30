# Video Editing Platform Backend

A Node.js backend service for a web-based video editing platform that handles video uploads, trimming, subtitle addition, and rendering using FFmpeg with PostgreSQL for data storage.

## Features

- **Video Management**
  - Upload videos with automatic metadata extraction
  - List videos with pagination
  - Download processed videos

- **Editing Operations**
  - Trim videos (create trim operations and process them)
  - Add and process subtitles
  - Render videos with combined operations

## Technology Stack

- **Backend**: Node.js with Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Media Processing**: FFmpeg
- **File Handling**: Multer for uploads

## Prerequisites

- Node.js (v16+)
- PostgreSQL
- FFmpeg installed on your system
- Git

## Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/saiganesh-sristla/Video-Editing-Backend.git
   cd Video-Editing-Backend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure environment variables**

   Create a `.env` file in the root directory:

   ```
   DATABASE_URL="postgresql://user:password@localhost:5432/video_editing"
   NODE_ENV=development
   PORT=3000
   UPLOAD_DIR="uploads"
   ```

4. **Set up the database**

   ```bash
   npm run prisma:generate
   npm run prisma:migrate
   ```

5. **Create upload directories**

   ```bash
   mkdir -p uploads/original uploads/processed
   ```

6. **Start the server**

   ```bash
   npm start
   ```

## API Documentation

### Health Check

```
GET /api/health
```

Response:
```json
{
    "status": "OK",
    "message": "Server is running"
}
```

### Video Operations

#### Upload Video
```
POST /api/videos/upload
```
- **Request**: `multipart/form-data` with field `video`
- **Max Size**: 100MB

#### List Videos
```
GET /api/videos
```
- **Query Parameters**:
  - `page` (default: 1)
  - `limit` (default: 10)

#### Get Video Details
```
GET /api/videos/:id
```

#### Download Video
```
GET /api/videos/:id/download
```

### Editing Operations

#### Create Trim
```
POST /api/videos/:id/trim
```
- **Body**:
  ```json
  {
    "startTime": 10.5,
    "endTime": 30.2
  }
  ```

#### Process Trim
```
POST /api/videos/:id/trim/:trimId/process
```

#### Add Subtitles
```
POST /api/videos/:id/subtitles
```
- **Body**:
  ```json
  {
  "subtitles": [
    {
      "text": "Hello world",
      "startTime": 15.0,
      "endTime": 18.5
    },
    {
      "text": "This is a demo",
      "startTime": 20.0,
      "endTime": 25.0
    }
  ]
  }
  ```

#### Process Subtitles
```
POST /api/videos/:id/subtitles/process
```

#### Render Final Video
```
POST /api/videos/:id/render
```

## Response Formats

All API endpoints return structured JSON responses with appropriate HTTP status codes. Successful operations typically return a 200 OK status with a response body containing relevant data.

## File Structure

```
.
├── uploads/
│   ├── original/    # Original uploaded videos
│   └── processed/   # Processed videos (trimmed, subtitled, etc.)
├── src/
│   ├── controllers/ # API endpoint handlers
│   ├── services/    # Business logic
│   ├── models/      # Data models and Prisma schema
│   ├── routes/      # API routes
│   └── utils/       # Helper functions
├── .env             # Environment variables
├── package.json     # Project configuration
└── README.md        # This file
```

## Error Handling

The API implements proper error handling with appropriate status codes and error messages. Common errors include:

- 400: Bad Request (invalid parameters)
- 404: Resource Not Found
- 500: Internal Server Error