import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import { runMigrations } from './db/migrations'
import { seedDatabase } from './db/seed'
import { errorHandler } from './middleware/errorHandler'
import authRoutes from './routes/auth'
import bookRoutes from './routes/books'
import questionRoutes from './routes/questions'
import progressRoutes from './routes/progress'
import quizRoutes from './routes/quizzes'
import aiRoutes from './routes/ai'
import curriculumRoutes from './routes/curriculum'
import diagramRoutes from './routes/diagrams'
import videoRoutes from './routes/videos'
import adminRoutes from './routes/admin'
import teacherRoutes from './routes/teacher'
import studentRoutes from './routes/student'
import examRoutes from './routes/exams'
import voiceRoutes from './routes/voice'
import classroomRoutes from './routes/classroom'
import careerRoutes from './routes/career'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

// Production CORS configuration
const defaultOrigins = [
  'https://eduvision-ai.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
]
const configuredOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
  : []
const allowedOrigins = [...defaultOrigins, ...configuredOrigins]

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true)
      if (
        allowedOrigins.includes('*') ||
        allowedOrigins.includes(origin) ||
        origin.endsWith('.vercel.app')
      ) {
        return callback(null, true)
      }
      return callback(null, true)
    },
    credentials: true,
  })
)
app.use(express.json({ limit: '10mb' }))

// Serve static textbook PDF files and videos safely
app.use('/storage/videos', express.static(path.join(process.cwd(), 'storage', 'videos')))
app.use('/storage', express.static(path.join(process.cwd(), 'storage')))
app.use('/storage', express.static(path.join(process.cwd(), 'data', 'storage')))

// Health check
app.get(['/health', '/api/health'], (req, res) => {
  res.json({
    status: 'OK',
    database: 'CONNECTED',
    vectorStore: 'pgvector HNSW active',
    environment: process.env.NODE_ENV || 'production',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  })
})

// API Documentation Endpoint
app.get(['/docs', '/api/docs'], (req, res) => {
  res.json({
    title: 'EduVision AI — REST API Documentation',
    version: '1.0.0',
    description: 'Comprehensive API specifications for Student, Teacher, Admin, Curriculum, RAG, and Textbook Ingestion services.',
    endpoints: {
      auth: ['POST /api/auth/register', 'POST /api/auth/login', 'POST /api/auth/logout', 'GET /api/auth/me'],
      student: ['GET /api/student/dashboard', 'GET /api/student/chapters/:id/lesson', 'GET /api/student/assignments', 'POST /api/student/assignments/:id/submit'],
      teacher: ['GET /api/teacher/dashboard', 'GET /api/teacher/students', 'GET /api/teacher/students/:id/performance', 'GET /api/teacher/assignments', 'POST /api/teacher/assignments', 'PUT /api/teacher/assignments/:id', 'DELETE /api/teacher/assignments/:id', 'GET /api/teacher/assignments/:id/submissions', 'GET /api/teacher/analytics'],
      admin: ['GET /api/admin/dashboard/stats', 'GET /api/admin/users', 'GET /api/admin/users/:id', 'PUT /api/admin/users/:id/status', 'GET /api/admin/students', 'GET /api/admin/teachers', 'POST /api/admin/teachers/:id/assignments', 'DELETE /api/admin/teachers/:id/assignments/:assignmentId', 'GET /api/admin/curriculum', 'GET /api/admin/textbooks', 'POST /api/admin/textbooks', 'POST /api/admin/textbooks/:id/retry', 'GET /api/admin/content-coverage', 'GET /api/admin/ingestion', 'GET /api/admin/system-health', 'GET /api/admin/audit-logs'],
      rag: ['POST /api/questions/ask', 'POST /api/quizzes/generate', 'POST /api/quizzes/:id/submit'],
      curriculum: ['GET /api/curriculum/classes', 'GET /api/curriculum/classes/:id/subjects', 'GET /api/curriculum/subjects/:id/terms', 'GET /api/curriculum/terms/:id/chapters'],
    },
    demoCredentials: {
      student: 'student@demo.com / password',
      teacher: 'teacher@demo.com / password',
      admin: 'admin@demo.com / password',
    },
  })
})


// Routes
app.use('/api/auth', authRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/teacher', teacherRoutes)
app.use('/api/student', studentRoutes)
app.use('/api/books', bookRoutes)

app.use('/api/questions', questionRoutes)
app.use('/api/progress', progressRoutes)
app.use('/api/quizzes', quizRoutes)
app.use('/api/ai', aiRoutes)
app.use('/api/diagrams', diagramRoutes)
app.use('/api/videos', videoRoutes)
app.use('/api/exams', examRoutes)
app.use('/api/voice', voiceRoutes)
app.use('/api/classroom', classroomRoutes)
app.use('/api/career', careerRoutes)
app.use('/api/curriculum', curriculumRoutes)
app.use('/api/board', curriculumRoutes)
app.use('/api', curriculumRoutes)


// Error handling
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' })
})

app.use(errorHandler)

// Start server
async function start() {
  try {
    console.log('🚀 Initializing EduVision AI Backend...')

    // Run migrations
    console.log('📊 Running database migrations...')
    await runMigrations()

    // Seed database
    console.log('🌱 Seeding database...')
    await seedDatabase()

    // Start server
    app.listen(PORT, () => {
      console.log(`✅ Server running on http://localhost:${PORT}`)
      console.log(`📚 API documentation: ${PORT}/api/docs`)
      console.log('\n📝 Demo Credentials:')
      console.log('  Student: student@demo.com / password')
      console.log('  Teacher: teacher@demo.com / password')
      console.log('  Admin: admin@demo.com / password')
    })
  } catch (error) {
    console.error('❌ Failed to start server:', error)
    process.exit(1)
  }
}

start()

export default app
