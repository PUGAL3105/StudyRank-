# API Documentation - EduVision AI

## Base URL
- Local: `http://localhost:5000/api`
- Production: `https://api.eduvision-ai.com/api`

## Authentication
All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

## Endpoints

### Authentication

#### POST /auth/register
Register a new user

**Request:**
```json
{
  "email": "student@example.com",
  "name": "John Doe",
  "password": "password123",
  "role": "student"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "student@example.com",
    "name": "John Doe",
    "role": "student",
    "token": "jwt-token"
  },
  "message": "Account created successfully"
}
```

#### POST /auth/login
Login with email and password

**Request:**
```json
{
  "email": "student@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "student@example.com",
    "name": "John Doe",
    "role": "student",
    "token": "jwt-token"
  },
  "message": "Logged in successfully"
}
```

#### POST /auth/logout
Logout (client should remove token from localStorage)

#### GET /auth/me
Get current user profile

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "student@example.com",
    "name": "John Doe",
    "role": "student"
  }
}
```

### Books

#### GET /books
Get all books

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Science Textbook",
      "author": "John Smith",
      "class": "Class 8",
      "subject": "Science",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### GET /books/:id
Get specific book

#### GET /books/:id/chapters
Get chapters for a book

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "book_id": "uuid",
      "title": "Photosynthesis",
      "chapter_order": 1,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### POST /books
Create a new book (Teacher only)

**Request:**
```json
{
  "title": "Science Textbook",
  "author": "John Smith",
  "class": "Class 8",
  "subject": "Science"
}
```

### Questions

#### POST /questions
Submit a question (Student only)

**Request:**
```json
{
  "bookId": "uuid",
  "chapterId": "uuid",
  "question": "What is photosynthesis?",
  "imageUrl": "url-to-image" // optional
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "question_text": "What is photosynthesis?",
    "asked_at": "2024-01-01T00:00:00Z"
  },
  "message": "Question submitted..."
}
```

#### GET /questions/history
Get question history (Student only)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "question_text": "What is photosynthesis?",
      "asked_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### GET /questions/:id/answer
Get answer for a question

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "question_id": "uuid",
    "explanation": "Plants make their own food...",
    "key_points": ["Point 1", "Point 2"],
    "source_page": 52,
    "diagram_url": "url",
    "video_url": "url",
    "book_title": "Science Textbook",
    "chapter_title": "Photosynthesis"
  }
}
```

## Error Responses

### 400 Bad Request
```json
{
  "error": "Missing required fields"
}
```

### 401 Unauthorized
```json
{
  "error": "Invalid or expired token"
}
```

### 403 Forbidden
```json
{
  "error": "Forbidden: Insufficient permissions"
}
```

### 404 Not Found
```json
{
  "error": "Resource not found"
}
```

### 500 Server Error
```json
{
  "error": "An unexpected error occurred"
}
```

## Role-Based Access

| Endpoint | Student | Teacher | Admin |
|----------|---------|---------|-------|
| POST /auth/register | ✅ | ✅ | ❌ |
| POST /auth/login | ✅ | ✅ | ✅ |
| GET /auth/me | ✅ | ✅ | ✅ |
| GET /books | ✅ | ✅ | ✅ |
| POST /books | ❌ | ✅ | ✅ |
| POST /questions | ✅ | ❌ | ❌ |
| GET /questions/history | ✅ | ❌ | ❌ |
| GET /questions/:id/answer | ✅ | ✅ | ✅ |

## Rate Limiting

- 100 requests per minute per IP (public endpoints)
- 1000 requests per minute per IP (authenticated endpoints)

## Versioning

API version is in the URL path:
- v1: `/api/v1/...` (current)

## Pagination

List endpoints support pagination:
```
GET /books?page=1&limit=10
```

Response includes:
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "pages": 5
  }
}
```
