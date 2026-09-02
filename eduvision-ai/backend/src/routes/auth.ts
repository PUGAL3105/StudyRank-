import { Router } from 'express'
import { handleRegister, handleLogin, handleLogout, handleGetCurrentUser } from '../controllers/authController'
import { authMiddleware } from '../middleware/auth'

const router = Router()

// Auth Routes
router.post('/register', handleRegister)
router.post('/login', handleLogin)
router.post('/logout', authMiddleware, handleLogout)
router.get('/me', authMiddleware, handleGetCurrentUser)

export default router
