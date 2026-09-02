import db from './connection'

export async function runMigrations() {
  try {
    console.log('Running database migrations & performance indexing...')

    // Phase 6 — Tamil Nadu State Board schema additions (run first, safe if tables exist)
    await db.none(`
      -- Tamil Nadu State Board table
      CREATE TABLE IF NOT EXISTS boards (
        id VARCHAR(50) PRIMARY KEY,
        board_name VARCHAR(255) UNIQUE NOT NULL,
        short_name VARCHAR(50) NOT NULL,
        state VARCHAR(100),
        country VARCHAR(100) DEFAULT 'India',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Terms table (per subject, e.g. Term 1/2/3 or Semester 1/2)
      CREATE TABLE IF NOT EXISTS terms (
        id VARCHAR(50) PRIMARY KEY,
        subject_id VARCHAR(255) NOT NULL,
        class_id VARCHAR(255) NOT NULL,
        term_number INTEGER NOT NULL,
        term_name VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(subject_id, term_number)
      );

      -- Topics table (sub-chapter level)
      CREATE TABLE IF NOT EXISTS topics (
        id VARCHAR(50) PRIMARY KEY,
        chapter_id VARCHAR(255) NOT NULL,
        topic_number INTEGER NOT NULL,
        topic_name VARCHAR(255) NOT NULL,
        indexing_status VARCHAR(50) DEFAULT 'PENDING',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(chapter_id, topic_number)
      );
    `)

    console.log('✅ Phase 6 TN SB tables created (boards, terms, topics)')

    // Alter existing tables to support TN SB fields & indexing states
    const alterQueries = [
      `ALTER TABLE classes ADD COLUMN IF NOT EXISTS board_id VARCHAR(50) DEFAULT 'board-tnsb'`,
      `ALTER TABLE subjects ADD COLUMN IF NOT EXISTS medium VARCHAR(50) DEFAULT 'Both'`,
      `ALTER TABLE subjects ADD COLUMN IF NOT EXISTS term_type VARCHAR(50) DEFAULT '3-term'`,
      `ALTER TABLE subjects ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true`,
      `ALTER TABLE chapters ADD COLUMN IF NOT EXISTS term_id VARCHAR(255)`,
      `ALTER TABLE chapters ADD COLUMN IF NOT EXISTS academic_year VARCHAR(50) DEFAULT '2024-2025'`,
      `ALTER TABLE chapters ADD COLUMN IF NOT EXISTS academic_period_type VARCHAR(50) DEFAULT 'TERM'`,
      `ALTER TABLE chapters ADD COLUMN IF NOT EXISTS academic_period VARCHAR(50) DEFAULT 'TERM_1'`,
      `ALTER TABLE chapters ADD COLUMN IF NOT EXISTS indexing_status VARCHAR(50) DEFAULT 'METADATA_ONLY'`,
      `ALTER TABLE chapters ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true`,
      `ALTER TABLE textbooks ADD COLUMN IF NOT EXISTS board_id VARCHAR(50) DEFAULT 'board-tnsb'`,
      `ALTER TABLE textbooks ADD COLUMN IF NOT EXISTS medium VARCHAR(50) DEFAULT 'Both'`,
      `ALTER TABLE textbooks ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'PENDING'`,
      `ALTER TABLE book_chunks ADD COLUMN IF NOT EXISTS board_id VARCHAR(50) DEFAULT 'board-tnsb'`,
      `ALTER TABLE book_chunks ADD COLUMN IF NOT EXISTS board VARCHAR(100) DEFAULT 'TAMIL_NADU_STATE_BOARD'`,
      `ALTER TABLE book_chunks ADD COLUMN IF NOT EXISTS medium VARCHAR(50) DEFAULT 'Both'`,
      `ALTER TABLE book_chunks ADD COLUMN IF NOT EXISTS academic_year VARCHAR(50) DEFAULT '2024-2025'`,
      `ALTER TABLE book_chunks ADD COLUMN IF NOT EXISTS academic_period VARCHAR(50)`,
      // Auth: extended user profile fields
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS class_level VARCHAR(20)`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS medium VARCHAR(50)`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20)`,
    ]

    for (const q of alterQueries) {
      try { await db.none(q) } catch { /* column may already exist */ }
    }

    // Core curriculum and user tables

    // Create tables
    await db.none(`
      -- Classes table
      CREATE TABLE IF NOT EXISTS classes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        class_name VARCHAR(100) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Streams table
      CREATE TABLE IF NOT EXISTS streams (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        stream_name VARCHAR(100) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Roles table
      CREATE TABLE IF NOT EXISTS roles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(50) UNIQUE NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Users table
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL CHECK (role IN ('student', 'teacher', 'admin')),
        status VARCHAR(50) DEFAULT 'Active' CHECK (status IN ('Active', 'Suspended')),
        class_id UUID REFERENCES classes(id),
        avatar_url VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Teacher Assignments table
      CREATE TABLE IF NOT EXISTS teacher_assignments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
        subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(teacher_id, class_id, subject_id)
      );

      -- Audit Logs table
      CREATE TABLE IF NOT EXISTS audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        action VARCHAR(100) NOT NULL,
        resource_type VARCHAR(100),
        resource_id VARCHAR(100),
        metadata JSONB,
        ip_address VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Subjects table
      CREATE TABLE IF NOT EXISTS subjects (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
        stream_id UUID REFERENCES streams(id) ON DELETE SET NULL,
        subject_name VARCHAR(255) NOT NULL,
        subject_code VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(class_id, stream_id, subject_name)
      );

      -- Chapters table
      CREATE TABLE IF NOT EXISTS chapters (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
        chapter_number INTEGER NOT NULL,
        chapter_name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(subject_id, chapter_number)
      );

      -- Textbooks table
      CREATE TABLE IF NOT EXISTS textbooks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
        subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
        book_name VARCHAR(255) NOT NULL,
        publisher VARCHAR(255) DEFAULT 'NCERT / State Board',
        academic_year VARCHAR(50) DEFAULT '2024-2025',
        pdf_url VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Textbook Chunks (for RAG)
      CREATE TABLE IF NOT EXISTS textbook_chunks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        textbook_id UUID NOT NULL REFERENCES textbooks(id) ON DELETE CASCADE,
        chapter_id UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        page_number INTEGER,
        embedding VECTOR(1536),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Questions table
      CREATE TABLE IF NOT EXISTS questions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
        chapter_id UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
        question_text TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Answers table
      CREATE TABLE IF NOT EXISTS answers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        question_id UUID UNIQUE NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
        answer_text TEXT NOT NULL,
        source_reference TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Quizzes table
      CREATE TABLE IF NOT EXISTS quizzes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        chapter_id UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
        question TEXT NOT NULL,
        options TEXT[] NOT NULL,
        correct_answer INTEGER NOT NULL
      );

      -- Quiz Attempts Table
      CREATE TABLE IF NOT EXISTS quiz_attempts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        score INTEGER NOT NULL,
        total_questions INTEGER NOT NULL,
        percentage INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Assignments table (Phase 25 Teacher Portal)
      CREATE TABLE IF NOT EXISTS assignments (
        id VARCHAR(255) PRIMARY KEY,
        teacher_id VARCHAR(255) NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        class_level VARCHAR(50) NOT NULL,
        medium VARCHAR(50) NOT NULL,
        subject_id VARCHAR(255) NOT NULL,
        term_id VARCHAR(255),
        chapter_id VARCHAR(255) NOT NULL,
        due_date VARCHAR(100),
        status VARCHAR(50) DEFAULT 'ACTIVE',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Assignment Submissions table (Phase 25 Student Work)
      CREATE TABLE IF NOT EXISTS assignment_submissions (
        id VARCHAR(255) PRIMARY KEY,
        assignment_id VARCHAR(255) NOT NULL,
        student_id VARCHAR(255) NOT NULL,
        status VARCHAR(50) DEFAULT 'SUBMITTED',
        score NUMERIC DEFAULT 0,
        percentage NUMERIC DEFAULT 0,
        submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        answers JSONB,
        feedback TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(assignment_id, student_id)
      );

      -- Performance Indexes for Optimization
      CREATE INDEX IF NOT EXISTS idx_users_role_status ON users(role, status);
      CREATE INDEX IF NOT EXISTS idx_subjects_class_stream ON subjects(class_id, stream_id);
      CREATE INDEX IF NOT EXISTS idx_subjects_class_medium ON subjects(class_id, medium);
      CREATE INDEX IF NOT EXISTS idx_chapters_subject_id ON chapters(subject_id);
      CREATE INDEX IF NOT EXISTS idx_chapters_term_id ON chapters(term_id);
      CREATE INDEX IF NOT EXISTS idx_textbooks_subject_id ON textbooks(subject_id);
      CREATE INDEX IF NOT EXISTS idx_textbook_chunks_lookup ON textbook_chunks(chapter_id, page_number);
      CREATE INDEX IF NOT EXISTS idx_questions_user_id ON questions(user_id);
      CREATE INDEX IF NOT EXISTS idx_questions_chapter_id ON questions(chapter_id);
      CREATE INDEX IF NOT EXISTS idx_teacher_assignments_lookup ON teacher_assignments(teacher_id, class_id, subject_id);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_action_created ON audit_logs(action, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user ON quiz_attempts(user_id, created_at DESC);
      -- Phase 6 TN SB Indexes
      CREATE INDEX IF NOT EXISTS idx_terms_subject_id ON terms(subject_id);
      CREATE INDEX IF NOT EXISTS idx_terms_class_id ON terms(class_id);
      CREATE INDEX IF NOT EXISTS idx_topics_chapter_id ON topics(chapter_id);
      -- Phase 25 Assignment Indexes
      CREATE INDEX IF NOT EXISTS idx_assignments_teacher ON assignments(teacher_id);
      CREATE INDEX IF NOT EXISTS idx_assignments_class_subject ON assignments(class_level, subject_id);
      CREATE INDEX IF NOT EXISTS idx_assignment_submissions_student ON assignment_submissions(student_id);
      CREATE INDEX IF NOT EXISTS idx_assignment_submissions_assignment ON assignment_submissions(assignment_id);
    `)

    console.log('✅ Database migrations and indexes completed successfully')
  } catch (error: any) {
    if (error.message?.includes('already exists')) {
      console.log('✅ Tables and indexes already exist')
    } else if (error.code === 'ECONNREFUSED' || error.message?.includes('connect ECONNREFUSED')) {
      console.log('⚠️ PostgreSQL database unavailable (ECONNREFUSED). Switched to In-Memory Database Mode.')
    } else {
      console.error('❌ Migration error:', error.message)
      throw error
    }
  }
}

if (require.main === module) {
  runMigrations()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err)
      process.exit(1)
    })
}
