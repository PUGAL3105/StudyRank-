# 🚀 StudyRank AI - Quick Start Guide

## Get Started in 5 Minutes

### Step 1: Install PostgreSQL
```bash
# macOS
brew install postgresql

# Windows
# Download from https://www.postgresql.org/download/windows/

# Linux
sudo apt-get install postgresql postgresql-contrib
```

### Step 2: Create Database
```bash
createdb eduvision_ai
```

### Step 3: Clone & Setup
```bash
cd eduvision-ai

# Copy environment file
cp .env.example .env

# Edit .env and set database credentials
# DATABASE_URL=postgresql://postgres:password@localhost:5432/eduvision_ai
```

### Step 4: Three Terminal Windows

**Window 1: Backend**
```bash
cd backend
npm install
npm run dev
```
✅ Backend runs on `http://localhost:5000`

**Window 2: Frontend**
```bash
cd frontend
npm install
npm run dev
```
✅ Frontend runs on `http://localhost:5173`

**Window 3: Watch the output**
```bash
cd backend
npm run migrate
npm run seed
```

### Step 5: Login & Test

Visit: `http://localhost:5173`

**Demo Account:**
- Email: `student@demo.com`
- Password: `password`

---

## 📋 Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Student | student@demo.com | password |
| Teacher | teacher@demo.com | password |
| Admin | admin@demo.com | password |

---

## 🧪 Testing Checklist

- [ ] Can register new account
- [ ] Can login with email/password
- [ ] Can see student dashboard
- [ ] Can logout
- [ ] Can login as teacher
- [ ] Can login as admin
- [ ] Mobile view looks good (320px)
- [ ] Tablet view looks good (768px)
- [ ] Desktop view looks good (1440px)

---

## 📚 Documentation

- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Deploy to production
- **[PHASE1_REPORT.md](PHASE1_REPORT.md)** - What's been built
- **[docs/API.md](docs/API.md)** - API endpoint reference
- **[README.md](README.md)** - Full project overview

---

## 🆘 Troubleshooting

### Port Already in Use
```bash
# Find and kill process
lsof -i :5000  # or :5173
kill -9 <PID>
```

### Database Connection Error
```bash
# Verify PostgreSQL is running
psql -U postgres -d eduvision_ai

# Check .env DATABASE_URL format
# Should be: postgresql://postgres:password@localhost:5432/eduvision_ai
```

### npm install fails
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Frontend can't connect to backend
```bash
# Verify backend is running on port 5000
curl http://localhost:5000/health

# Check VITE_API_URL in frontend .env
```

---

## 📁 Project Structure

```
eduvision-ai/
├── frontend/     # React + Vite + Tailwind
├── backend/      # Node.js + Express
├── ai-service/   # Python + FastAPI (Phase 3+)
├── docs/         # Documentation
└── [config files]
```

---

## 🎯 Next Steps

1. ✅ Local development is working
2. 🔄 Customize colors in `frontend/tailwind.config.ts`
3. 📱 Test responsive design
4. 📚 Read PHASE1_REPORT.md
5. 🚀 Build Phase 2: Student MVP

---

## 💡 Key Files to Know

| File | Purpose |
|------|---------|
| `backend/src/index.ts` | Backend server setup |
| `frontend/src/App.tsx` | Frontend routing |
| `frontend/src/context/AuthContext.tsx` | Authentication state |
| `backend/src/db/migrations.ts` | Database schema |
| `backend/src/routes/auth.ts` | Auth endpoints |
| `.env.example` | Environment variables template |

---

## ⚡ Common Commands

```bash
# Backend
npm run dev          # Start development server
npm run build        # Build for production
npm run migrate      # Run database migrations
npm run seed         # Seed database with demo data

# Frontend
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run linter
```

---

## 🔐 Security Reminders

- ✅ Never commit `.env` file
- ✅ Keep JWT_SECRET strong (32+ characters)
- ✅ Use HTTPS in production
- ✅ Keep dependencies updated
- ✅ Review security checklist in DEPLOYMENT.md

---

## 📞 Support

For issues:
1. Check troubleshooting section above
2. Read DEPLOYMENT.md
3. Review docs/API.md
4. Check console logs for details

---

**Happy coding! 🎓**

Start with Phase 1 running locally, then move to Phase 2.
