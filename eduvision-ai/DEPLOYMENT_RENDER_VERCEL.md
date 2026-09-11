# 🚀 Complete Deployment Guide: Render (Backend) + Vercel (Frontend)

This guide walks you through deploying **EduVision AI / StudyRank** with **Render** for the Backend API and **Vercel** for the Frontend Single Page Application.

---

## 📌 Prerequisites
1. A **GitHub** account with your project repository pushed.
2. A free account on **[Render.com](https://render.com/)**.
3. A free account on **[Vercel.com](https://vercel.com/)**.

---

## 🛠️ Step 1: Deploy Backend to Render

1. Log in to [Render Dashboard](https://dashboard.render.com/).
2. Click **New +** > **Web Service**.
3. Select **Build and deploy from a Git repository** and connect your GitHub repo.
4. Fill in the following configuration settings:
   - **Name**: eduvision-ai-backend (or your preferred name)
   - **Region**: Closest to your users (e.g., *Singapore* or *Frankfurt*)
   - **Branch**: main (or master)
   - **Root Directory**: ackend  ⚠️ *(Crucial)*
   - **Runtime**: Node
   - **Build Command**: 
pm install && npm run build
   - **Start Command**: 
pm start
   - **Plan**: Free

5. **Environment Variables**:
   Under the **Environment Variables** section, add:
   | Key | Value | Note |
   |-----|-------|------|
   | NODE_ENV | production | Production mode |
   | PORT | 5000 | Port |
   | JWT_SECRET | *(Generate a random string, e.g. eduvision_secret_key_2024_secure)* | Authentication secret |
   | CORS_ORIGIN | https://*.vercel.app,http://localhost:5173 | Allowed origins |

6. Click **Create Web Service**.
7. Wait for the build to finish. Once live, copy your Render URL:
   https://eduvision-ai-backend.onrender.com

---

## 🌐 Step 2: Deploy Frontend to Vercel

1. Log in to [Vercel Dashboard](https://vercel.com/dashboard).
2. Click **Add New...** > **Project**.
3. Import your GitHub repository.
4. In the **Configure Project** screen:
   - **Framework Preset**: Vite
   - **Root Directory**: Click *Edit* and select rontend  ⚠️ *(Crucial)*
   - **Build Command**: 
pm run build *(Auto-detected)*
   - **Output Directory**: dist *(Auto-detected)*
   - **Install Command**: 
pm install *(Auto-detected)*

5. **Environment Variables**:
   Expand **Environment Variables** and add:
   | Name | Value |
   |------|-------|
   | VITE_API_URL | https://your-backend-name.onrender.com/api *(Paste your Render URL + /api)* |

6. Click **Deploy**.
7. In ~1 minute, Vercel will give you your live production domain:
   https://your-project.vercel.app

---

## 🔗 Step 3: Connect Vercel & Render (Final Step)

1. Copy your live Vercel URL (e.g. https://eduvision-ai.vercel.app).
2. Go back to **Render Dashboard** > your backend web service > **Environment**.
3. Update CORS_ORIGIN to include your exact Vercel URL:
   CORS_ORIGIN=https://eduvision-ai.vercel.app,http://localhost:5173
4. Click **Save Changes** (Render will automatically redeploy).

---

## ✅ Default Demo Accounts
Once deployed, log in using any of the seeded roles:
- **Teacher**: 	eacher@demo.com / password
- **Student**: student@demo.com / password
- **Admin**: dmin@demo.com / password
