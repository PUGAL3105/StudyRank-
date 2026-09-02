# EduVision AI - System Architecture

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USERS (3 Roles)                         │
│                                                                   │
│        Student      │        Teacher      │        Admin        │
└──────────┬──────────┴──────────┬──────────┴──────────┬───────────┘
           │                     │                     │
           └─────────────────────┼─────────────────────┘
                                 │
           ┌─────────────────────▼─────────────────────┐
           │                                           │
           │      React Frontend (Vite + Tailwind)   │
           │                                           │
           │  • Landing Page                          │
           │  • Auth Pages (Login/Register)          │
           │  • Role-Specific Dashboards            │
           │  • Question Interface (Phase 2)         │
           │  • Visual Learning (Phase 4)            │
           │  • Admin Dashboard (Phase 9)            │
           │                                           │
           └─────────────────────┬─────────────────────┘
                                 │
                    ┌────────────┴────────────┐
                    │                         │
        ┌───────────▼───────────┐  ┌──────────▼──────────┐
        │                       │  │                     │
        │  Node.js + Express    │  │  Python + FastAPI  │
        │  (Backend API)        │  │  (AI/RAG Service)  │
        │                       │  │                     │
        │  • Authentication     │  │  • Text Processing │
        │  • User Management    │  │  • Embeddings      │
        │  • Book Management    │  │  • RAG Pipeline    │
        │  • Question Handling  │  │  • Diagram Gen     │
        │  • Answer Storage     │  │  • Video Gen       │
        │  • Quiz Logic         │  │  • LLM Integration │
        │  • Progress Tracking  │  │                     │
        │                       │  │                     │
        └───────────┬───────────┘  └──────────┬──────────┘
                    │                         │
                    └────────────┬────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │                         │
                    │   PostgreSQL Database   │
                    │   (Supabase)            │
                    │                         │
                    │  • Users & Auth         │
                    │  • Books & Chapters     │
                    │  • Questions & Answers  │
                    │  • Quizzes & Progress   │
                    │  • Vector Embeddings    │
                    │  • Feedback & Analytics │
                    │                         │
                    └────────────┬────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │                         │
                    │  Cloud Storage          │
                    │  (Supabase Storage)     │
                    │                         │
                    │  • Textbook PDFs        │
                    │  • Student Images       │
                    │  • Generated Diagrams   │
                    │  • Educational Videos  │
                    │                         │
                    └─────────────────────────┘
```

---

## Data Flow - Question Answering Pipeline

```
┌────────────────────────────────────────────────────────────────┐
│ PHASE 1: FOUNDATION (Authentication, Basic Structure)          │
└────────────────────────────────────────────────────────────────┘

Student ─→ Frontend ─→ Backend ─→ Database
           (React)    (Express)  (PostgreSQL)
                      ✅ Register/Login
                      ✅ Fetch Books/Chapters
                      ✅ Submit Questions

┌────────────────────────────────────────────────────────────────┐
│ PHASE 2: STUDENT MVP (Question Workflow)                       │
└────────────────────────────────────────────────────────────────┘

Student
  │
  ├─→ Select Class/Subject/Chapter
  │      │
  │      └─→ Frontend validates
  │         └─→ Backend returns chapters
  │
  ├─→ Asks a Question (text/image/voice)
  │      │
  │      ├─→ Image: OCR extraction (Phase 7)
  │      ├─→ Voice: STT conversion (Phase 7)
  │      └─→ Store in questions table
  │
  └─→ AI Processing (Mock in Phase 2, Real in Phase 3)
       │
       └─→ AI Service generates:
            ├─ Simple Explanation
            ├─ Key Points
            ├─ Source Reference
            └─ Ready for Diagram/Video

┌────────────────────────────────────────────────────────────────┐
│ PHASE 3: RAG PIPELINE (Textbook-Grounded Answers)             │
└────────────────────────────────────────────────────────────────┘

Teacher uploads Textbook PDF
  │
  ├─→ PDF Extraction → Text chunks
  │
  ├─→ Text Cleaning → Standardized format
  │
  ├─→ Chunking → Semantic segments (500 tokens each)
  │
  ├─→ Embedding → Vector representations (1536 dims)
  │
  └─→ Vector Storage → PostgreSQL + pgvector

Student asks Question
  │
  ├─→ Embed question → Vector
  │
  ├─→ Vector Search → Find similar chunks (cosine similarity)
  │
  ├─→ Retrieve Top-K chunks (e.g., 5 most relevant)
  │
  ├─→ Construct Prompt with chunks
  │
  └─→ LLM generates grounded answer
       ├─ Maintains factuality (from chunks)
       ├─ Cites sources
       └─ Simplifies language for students

┌────────────────────────────────────────────────────────────────┐
│ PHASE 4: VISUAL LEARNING (Diagrams & Examples)                │
└────────────────────────────────────────────────────────────────┘

From Answer, AI Service generates:
  │
  ├─→ Diagram (educational visualization)
  │    ├─ Type detection (flowchart, process, concept map, etc.)
  │    ├─ Visual generation
  │    └─ Store as image in cloud storage
  │
  └─→ Examples & Step-by-Step
       ├─ Parse answer for concepts
       ├─ Create example cards
       └─ Number steps sequentially

┌────────────────────────────────────────────────────────────────┐
│ PHASE 5: VIDEO LEARNING (Automated Educational Videos)        │
└────────────────────────────────────────────────────────────────┘

From Answer, AI Service creates:
  │
  ├─→ Storyboard generation
  │    ├─ Scene breakdown (5-7 scenes)
  │    ├─ Script writing
  │    └─ Timing calculation
  │
  ├─→ Visual asset creation
  │    ├─ Scene renders
  │    ├─ Animation setup
  │    └─ Color/styling
  │
  ├─→ Audio generation
  │    ├─ TTS of narration
  │    ├─ Multilingual support (Phase 7)
  │    └─ Captions generation
  │
  └─→ Video composition
       ├─ Audio sync
       ├─ Transitions
       └─ Storage in cloud

┌────────────────────────────────────────────────────────────────┐
│ PHASE 6: QUIZ SYSTEM (Adaptive Learning)                      │
└────────────────────────────────────────────────────────────────┘

After each answer, AI Service:
  │
  ├─→ Analyzes concepts from answer
  │
  ├─→ Generates 5 quiz questions
  │    ├─ Multiple choice format
  │    ├─ Varying difficulty
  │    ├─ Covers different aspects
  │    └─ Includes explanations
  │
  └─→ Student attempts quiz
       ├─ Submits answers
       ├─ System scores
       ├─ Shows explanations for wrong answers
       └─ Tracks progress
```

---

## Database Schema Relationships

```
users (PK: id)
  │
  ├─→ books (FK: uploaded_by)
  │    │
  │    ├─→ chapters (FK: book_id)
  │    │    │
  │    │    ├─→ questions (FK: chapter_id)
  │    │    │    │
  │    │    │    ├─→ answers (FK: question_id)
  │    │    │    │    │
  │    │    │    │    └─→ quizzes (FK: answer_id)
  │    │    │    │         │
  │    │    │    │         ├─→ quiz_questions
  │    │    │    │         └─→ quiz_attempts (FK: quiz_id, student_id)
  │    │    │    │
  │    │    │    └─→ feedback (FK: answer_id)
  │    │    │
  │    │    └─→ book_chunks (for RAG embeddings)
  │    │
  │    └─→ questions (FK: book_id)
  │
  ├─→ progress (FK: student_id) 
  │    └─ Tracks learning statistics
  │
  └─→ saved_items (FK: student_id, answer_id)
       └─ Student bookmarks
```

---

## API Communication Flow

### Frontend ↔ Backend (Express)

```
Request Format:
POST /api/auth/login
Authorization: Bearer <token>  (if authenticated)
Content-Type: application/json
{
  "email": "user@example.com",
  "password": "password"
}

Response Format:
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "student",
    "token": "jwt-token"
  },
  "message": "Success message"
}

Error Format:
{
  "error": "Error description"
}
```

### Backend ↔ AI Service (Python)

```
Request Format:
POST http://localhost:8000/ai/answer
Content-Type: application/json
{
  "question_id": "uuid",
  "question_text": "What is photosynthesis?",
  "book_chunks": ["chunk1", "chunk2", ...],
  "student_language": "en"  // Phase 7: Multilingual
}

Response Format:
{
  "answer": {
    "explanation": "Plants make...",
    "key_points": ["point1", "point2"],
    "sources": [{"book": "...", "page": 52}]
  },
  "diagram": {
    "type": "flowchart",
    "url": "storage_url",
    "alt_text": "description"
  },
  "video": {
    "url": "video_storage_url",
    "duration": 120,
    "transcription": "..."
  }
}
```

### Backend ↔ Database (PostgreSQL)

```
All queries use pg-promise for:
✅ Parameter injection (SQL injection prevention)
✅ Connection pooling
✅ Type safety with TypeScript
✅ Transaction support
✅ Error handling

Example:
await db.one(
  'INSERT INTO questions (student_id, book_id, chapter_id, question_text)
   VALUES ($1, $2, $3, $4) RETURNING id',
  [userId, bookId, chapterId, questionText]
)
```

---

## Authentication & Authorization Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ USER REGISTRATION                                               │
└─────────────────────────────────────────────────────────────────┘

User enters: email, name, password, role (student/teacher)
                    ↓
    Frontend validation (Joi schema)
                    ↓
    Backend validation (Joi schema again)
                    ↓
    Check user doesn't exist
                    ↓
    Hash password with bcrypt (10 rounds)
                    ↓
    Store in database
                    ↓
    Generate JWT token with:
      ├─ userId
      ├─ email  
      ├─ role
      └─ expiry (24h)
                    ↓
    Return token to frontend
                    ↓
    Frontend stores in localStorage
                    ↓
    User logged in ✅

┌─────────────────────────────────────────────────────────────────┐
│ USER LOGIN                                                      │
└─────────────────────────────────────────────────────────────────┘

User enters: email, password
                    ↓
    Frontend validation
                    ↓
    Backend validation
                    ↓
    Find user by email
                    ↓
    Compare password with hash (bcrypt.compare)
                    ↓
    Generate JWT token
                    ↓
    Return token + user data
                    ↓
    User logged in ✅

┌─────────────────────────────────────────────────────────────────┐
│ PROTECTED API CALLS                                             │
└─────────────────────────────────────────────────────────────────┘

Frontend: 
  Every request includes:
    Authorization: Bearer <token>
                    ↓
Backend:
  Middleware extracts token
                    ↓
  Verifies signature (JWT_SECRET)
                    ↓
  Checks expiry
                    ↓
  Extracts user info
                    ↓
  Checks role permissions (requireRole middleware)
                    ├─ ALLOW if role matches ✅
                    └─ DENY with 403 if role doesn't match ❌
                    ↓
  Proceed with endpoint logic

┌─────────────────────────────────────────────────────────────────┐
│ ROLE-BASED ACCESS CONTROL (RBAC)                               │
└─────────────────────────────────────────────────────────────────┘

Student Can:
  ✅ Ask questions
  ✅ View answers
  ✅ Take quizzes
  ✅ Save answers
  ✅ View progress
  ❌ Upload books
  ❌ Manage system

Teacher Can:
  ✅ Upload textbooks
  ✅ Manage chapters
  ✅ View student questions
  ✅ View student progress on their content
  ❌ Access admin dashboard
  ❌ Manage other teachers

Admin Can:
  ✅ Access all data
  ✅ Manage users
  ✅ View analytics
  ✅ Monitor platform
  ❌ View passwords (never stored plain)
  ❌ View API keys (not in DB)
```

---

## Scalability Considerations

### Current (Phase 1-6)
- Single backend server
- Single PostgreSQL instance
- Suitable for 1,000-10,000 students

### Future Scaling (Phase 10+)

**Horizontal Scaling:**
```
Load Balancer
  ├─→ Backend Server 1
  ├─→ Backend Server 2
  └─→ Backend Server 3

Shared PostgreSQL (Supabase)
Shared Storage (Supabase Storage)
Cache Layer (Redis)
```

**Database Optimization:**
- Connection pooling
- Read replicas for analytics
- Partitioning for large tables
- Archive old data

**API Optimization:**
- Response caching
- Pagination (already implemented)
- Rate limiting
- CDN for static assets

---

## Security Architecture

### Authentication Security
```
✅ Passwords hashed (bcrypt)
✅ JWT tokens (time-limited)
✅ CORS configured
✅ HTTPS in production
✅ Secure headers
```

### Data Security
```
✅ SQL injection prevention (parameterized queries)
✅ XSS prevention (React auto-escaping)
✅ CSRF tokens (if using sessions)
✅ Environment variables (secrets not in code)
✅ No passwords logged
✅ Cascade delete for data consistency
```

### API Security
```
✅ Authentication check on every protected endpoint
✅ Role verification before operations
✅ Input validation (Joi schemas)
✅ Error messages don't reveal info
✅ Rate limiting (to be added in production)
```

---

## Deployment Architecture

### Development
```
Local Machine:
├─ Frontend (localhost:5173)
├─ Backend (localhost:5000)
├─ Database (localhost:5432)
└─ AI Service (localhost:8000)
```

### Production
```
                    GitHub
                       ↓
          ┌────────────┴────────────┐
          ↓                         ↓
      Vercel Deploy          Render Deploy
      (Frontend)             (Backend)
      HTTPS                  HTTPS
          ↓                         ↓
    React Bundle          Node.js Server
          │                         │
          └─────────────┬───────────┘
                        │
                        ↓
                   Supabase
                        │
              ┌─────────┼─────────┐
              ↓         ↓         ↓
         Database   Storage   pgvector
           
          Render Deploy
          (AI Service)
          Python/FastAPI
                 ↓
          Vector Processing
          LLM Calls
```

---

## Monitoring & Maintenance

### Logs & Errors
- Frontend: Browser console + error tracking (Sentry optional)
- Backend: Application logs + database logs
- Database: Query logs + slow query tracking

### Performance
- Database query optimization
- API response times
- Frontend load times
- Cache hit rates

### Backups
- Daily database backups (Supabase)
- File storage backups
- Version control on GitHub

---

## Summary

This architecture follows:
- ✅ **REST principles** for API design
- ✅ **MVC pattern** with separation of concerns
- ✅ **JWT for stateless authentication**
- ✅ **Role-based access control**
- ✅ **Normalized database schema**
- ✅ **Scalable from Phase 1 onwards**
- ✅ **Cloud-ready deployment**
- ✅ **Security best practices**

The foundation supports growth from 1,000 to 100,000+ students without architectural changes.
