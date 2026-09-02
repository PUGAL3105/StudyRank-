# EduVision AI — Production Deployment Guide

This guide provides step-by-step instructions to deploy the complete **EduVision AI** platform to production cloud services (Vercel, Render/Railway, Supabase).

---

## 🏗️ Architecture Overview

```
                        ┌────────────────────────┐
                        │     React Frontend     │
                        │    (Hosted on Vercel)  │
                        └───────────┬────────────┘
                                    │
                                    ▼
                        ┌────────────────────────┐
                        │   Express API Gateway  │
                        │   (Hosted on Render)   │
                        └─────┬──────────────┬───┘
                              │              │
                              ▼              ▼
           ┌─────────────────────┐      ┌────────────────────────┐
           │ PostgreSQL Database │      │ Python FastAPI RAG AI  │
           │  (Hosted on Supabase│      │   (Hosted on Render)   │
           │     + pgvector)     │      └────────────────────────┘
           └─────────────────────┘
```

---

## 1. Database Setup (Supabase PostgreSQL + pgvector)

1. Create a project on [Supabase](https://supabase.com/).
2. Navigate to **SQL Editor** in your Supabase Dashboard.
3. Enable the `vector` extension:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```
4. Copy and run the complete DDL schema from [`database_architecture.md`](file:///C:/Users/Pugalarasan/.gemini/antigravity/brain/c115a7ee-5855-474e-8265-539513d28e28/database_architecture.md).
5. Copy your **Database Connection String** from Settings -> Database -> Connection String (URI).

---

## 2. Python FastAPI RAG AI Microservice Deployment (Render / Railway)

1. Connect your repository to [Render Web Services](https://render.com/).
2. Root directory: `./ai-service`
3. Environment: `Python 3.13`
4. Build Command: `pip install -r requirements.txt`
5. Start Command: `uvicorn main:app --host 0.0.0.0 --port 8000`
6. Set Environment Variables:
   - `GEMINI_API_KEY`: Your Gemini API key
   - `SUPABASE_URL`: Your Supabase URL
   - `SUPABASE_KEY`: Your Supabase Service Role Key
7. Note down the deployed URL e.g. `https://eduvision-ai-service.onrender.com`.

---

## 3. Express Backend API Gateway Deployment (Render / Railway)

1. Connect your repository to [Render Web Services](https://render.com/).
2. Root directory: `./backend`
3. Build Command: `npm install && npm run build`
4. Start Command: `npm start`
5. Set Environment Variables:
   - `PORT`: `5000`
   - `NODE_ENV`: `production`
   - `JWT_SECRET`: Generate a secure 64-character secret
   - `DB_HOST`: Your Supabase DB Host
   - `DB_PORT`: `5432`
   - `DB_NAME`: `postgres`
   - `DB_USER`: `postgres`
   - `DB_PASSWORD`: Your Supabase Password
   - `AI_SERVICE_URL`: `https://eduvision-ai-service.onrender.com`
6. Note down the backend URL e.g. `https://eduvision-backend-api.onrender.com`.

---

## 4. React Frontend Web Application Deployment (Vercel)

1. Connect your repository to [Vercel](https://vercel.com/).
2. Root directory: `./frontend`
3. Build Command: `npm run build`
4. Output Directory: `dist`
5. Environment Variables:
   - `VITE_API_URL`: `https://eduvision-backend-api.onrender.com/api`
6. Click **Deploy**. Your EdTech startup platform will be live at `https://eduvision-ai.vercel.app`!

---

## 🔐 Security Checks

- [x] Passwords are encrypted using `bcrypt` (10 rounds).
- [x] JWT tokens expire in 24 hours.
- [x] Secrets and keys are excluded from git repositories (`.gitignore`).
- [x] Admin views redact all sensitive API keys, hashes, and tokens.
