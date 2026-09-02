# EduVision AI — Phase 29: Production Deployment & Release Guide

## 1. Production Architecture

EduVision AI is designed as a modular 3-tier cloud application:

```
[ Frontend (Vercel / Netlify / Cloudflare Pages) ]
                       │  HTTPS / REST API
                       ▼
[ Backend API (Node.js / Express / Docker / AWS ECS / Render) ]
          │                           │
          ▼                           ▼
[ PostgreSQL + pgvector ]   [ OpenAI API (1536-dim embeddings) ]
(Supabase / Neon / AWS RDS)
```

---

## 2. Prerequisites & Cloud Requirements

- **Node.js**: v18+ LTS or v20+ LTS
- **PostgreSQL Database**: PostgreSQL 15+ with the `pgvector` extension enabled (`CREATE EXTENSION IF NOT EXISTS vector;`)
- **OpenAI API Key**: For generating 1536-dimensional embeddings with `text-embedding-3-small`
- **Frontend Hosting**: Vercel, Netlify, or Static Web Server
- **Backend Hosting**: Docker container, AWS App Runner, ECS, Render, or Railway

---

## 3. Environment Variables Configuration

### Backend Environment Variables (`backend/.env`)

```ini
PORT=5000
NODE_ENV=production
JWT_SECRET=replace_with_a_secure_random_64_character_hex_string
JWT_EXPIRES_IN=7d
CORS_ORIGIN=https://eduvision.example.com

# PostgreSQL Connection String (with SSL enabled for cloud databases)
DATABASE_URL=postgresql://user:password@db.supabase.co:5432/postgres?sslmode=require
DB_HOST=db.supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=your_secure_password
DB_SSL=true

# AI Embedding Service
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
EMBEDDING_DIMENSION=1536
```

### Frontend Environment Variables (`frontend/.env`)

```ini
# Base API URL pointing to the production backend
VITE_API_URL=https://api.eduvision.example.com/api
```

---

## 4. Database Setup & Migration Procedure

1. **Provision PostgreSQL Database** (e.g. Supabase, Neon, or AWS RDS).
2. **Enable pgvector extension**:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```
3. **Execute Database Migrations**:
   ```bash
   cd backend
   npm run build
   node dist/db/migrations.js
   ```
4. **Seed Canonical Data (Idempotent)**:
   ```bash
   node dist/db/seed.js
   ```

---

## 5. Deployment Steps

### Backend Deployment (e.g. Docker / Container / PaaS)
```bash
cd backend
npm install --production=false
npm run build
npm prune --production
npm start
```

### Frontend Deployment (e.g. Vercel / Netlify / Cloudflare Pages)
```bash
cd frontend
npm install
npm run build
# Deploy the generated dist/ directory to your CDN / hosting provider
```

---

## 6. Security Checklist & Rollback Procedure

- [x] `OPENAI_API_KEY`, `DATABASE_URL`, and `JWT_SECRET` are backend-only.
- [x] Passwords hashed with bcrypt (10 rounds).
- [x] Zero password hashes or secrets in API responses or audit logs.
- [x] CORS restricts origins strictly to verified production frontend domains.
- [x] Role-Based Access Control (`STUDENT`, `TEACHER`, `ADMIN`) validated on every request.
- [x] IDOR protection active on assignment management and student submissions.
- [x] 10/10 Class 10 Science chapters 100% READY with authentic Tamil Nadu State Board citations.

### Rollback Strategy
If an issue is detected post-deployment:
1. Revert DNS or traffic routing to the previous stable release artifact.
2. Migrations are non-destructive (new columns with nullable defaults); database backward compatibility is preserved.
3. In-memory fallback (`memoryStore`) guarantees operational continuity even in temporary database disconnect scenarios.
