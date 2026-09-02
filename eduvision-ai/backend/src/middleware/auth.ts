import { Request, Response, NextFunction } from 'express'
import { verifyToken } from '../utils/jwt'
import { memoryStore } from '../db/connection'

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string
    email: string
    role: 'student' | 'teacher' | 'admin'
    status?: string
  }
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    let token = ''
    const authHeader = req.headers.authorization
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.slice(7)
    } else if (req.query.token && typeof req.query.token === 'string') {
      token = req.query.token
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'No authorization token provided.' },
      })
    }

    const payload = verifyToken(token)

    // Check account status in memoryStore/database by exact userId first
    const foundUser = memoryStore.users.find((u) => u.id === payload.userId) || memoryStore.users.find((u) => u.email === payload.email)
    const currentStatus = foundUser ? (foundUser.status || 'Active') : 'Active'

    if (currentStatus === 'Suspended') {
      return res.status(403).json({
        success: false,
        error: { code: 'ACCOUNT_SUSPENDED', message: 'Account is suspended. Please contact administrator.' },
      })
    }

    req.user = {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
      status: currentStatus,
    }

    next()
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: { code: 'INVALID_TOKEN', message: 'Invalid or expired token.' },
    })
  }
}

export function optionalAuthMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next()
    }

    const token = authHeader.slice(7)
    const payload = verifyToken(token)

    const foundUser = memoryStore.users.find((u) => u.id === payload.userId) || memoryStore.users.find((u) => u.email === payload.email)
    const currentStatus = foundUser ? (foundUser.status || 'Active') : 'Active'

    if (currentStatus === 'Suspended') {
      return res.status(403).json({
        success: false,
        error: { code: 'ACCOUNT_SUSPENDED', message: 'Account is suspended. Please contact administrator.' },
      })
    }

    req.user = {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
      status: currentStatus,
    }

    next()
  } catch (error) {
    // If token invalid, proceed as guest without req.user
    next()
  }
}

export function requireRole(...roles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required.' },
      })
    }

    const userRole = (req.user.role || '').toLowerCase()
    const allowedRoles = roles.map((r) => r.toLowerCase())

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: `Access denied. Requires one of roles: [${roles.join(', ')}]` },
      })
    }

    next()
  }
}
