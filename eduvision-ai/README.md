# EduVision AI — AI-Powered Visual Learning & Textbook Grounding Platform

![EduVision AI](https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=1200&auto=format&fit=crop)

**EduVision AI** is a production-grade educational platform engineered for school students (Classes 6 to 12). The platform acts as a personal AI teacher that strictly grounds answers and quizzes in official school textbooks (such as Tamil Nadu State Board *Samacheer Kalvi*), providing verifiable page-level citations, practice quizzes, homework assignments, and comprehensive analytics.

---

## 🌟 Core Capabilities

- **100% Authentic Textbook Grounding**: Ground-truth multi-chunk retrieval with verified page citations and 1536-dimensional OpenAI embeddings (`text-embedding-3-small`).
- **Student Learning Workspace**: Class $\rightarrow$ Medium $\rightarrow$ Subject $\rightarrow$ Term $\rightarrow$ Chapter hierarchy, authentic lesson reader, AI question answering, and practice quizzes.
- **Teacher Portal**: Class & subject management, assignment creation with strict READY chapter guards, server-side grading, student submission review, and diagnostic analytics.
- **Admin Control Center**: 10-tab control center covering user accounts, student/teacher rosters, curriculum trees, authentic textbook checksums (SHA-256), 11-stage ingestion monitor, system health, and tamper-proof audit trails.
- **Enterprise-Grade Security**: Stateless JWT authentication, bcrypt password hashing, strict RBAC (`STUDENT`, `TEACHER`, `ADMIN`), IDOR protection, and zero secret leakage.

---

## 🛠️ Technology Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide React
- **Backend**: Node.js, Express, TypeScript, pg-promise, jsonwebtoken, bcryptjs, Joi
- **Database & Vector Search**: PostgreSQL 15+, pgvector HNSW cosine similarity index (with deterministic in-memory store fallback)
- **AI & Embeddings**: OpenAI 1536-dimensional embeddings (`text-embedding-3-small`)
- **Testing**: Node.js automated test suites with 463+ continuous assertions

---

## 🚀 Quick Start (Local Development)

### 1. Prerequisites
- Node.js v18+ LTS
- PostgreSQL 15+ with `pgvector` (optional; memory fallback included)

### 2. Installation

```bash
# Clone the repository
git clone https://github.com/pugal0310/CyberShiedAi-.git
cd eduvision-ai

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 3. Environment Setup

Copy `.env.example` to `.env` in `backend/` and `frontend/`:

```bash
cp .env.example backend/.env
cp frontend/.env.example frontend/.env
```

### 4. Running the Development Servers

```bash
# Terminal 1: Start Backend API (Port 5000)
cd backend
npm run dev

# Terminal 2: Start Frontend Application (Port 5173)
cd frontend
npm run dev
```

- **Frontend**: `http://localhost:5173`
- **Backend API**: `http://localhost:5000/api`
- **API Documentation**: `http://localhost:5000/api/docs`
- **Health Check**: `http://localhost:5000/api/health`

---

## 🔑 Demo Credentials

| Role | Email | Password |
| :--- | :--- | :--- |
| **Student** | `student@demo.com` | `password` |
| **Teacher** | `teacher@demo.com` | `password` |
| **Admin** | `admin@demo.com` | `password` |

---

## 🧪 Automated Testing

Execute the comprehensive end-to-end verification suites (463 assertions):

```bash
# Run all automated test suites
node backend/test-phase28-e2e-uat-suite.js
node backend/test-phase27-production-hardening-suite.js
node backend/test-phase26-admin-control-center-suite.js
node backend/test-phase25-teacher-portal-suite.js
node backend/test-phase24-student-learning-suite.js
node backend/test-authentication-suite.js
node backend/test-phase20-complete-authentic-coverage-suite.js
```

### Type Checking & Production Build

```bash
# Backend TypeScript Check
cd backend && npx tsc --noEmit

# Frontend TypeScript Check & Production Build
cd ../frontend && npx tsc --noEmit && npm run build
```

---

## 📦 Production Deployment

Refer to [`PHASE29_PRODUCTION_DEPLOYMENT_GUIDE.md`](./PHASE29_PRODUCTION_DEPLOYMENT_GUIDE.md) for full deployment instructions, cloud database setup, CORS configuration, and security checklists.
