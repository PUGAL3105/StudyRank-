import { Request, Response, NextFunction } from 'express'
import Joi from 'joi'
import { registerUser, loginUser, getUserById } from '../services/authService'
import { AuthenticatedRequest } from '../middleware/auth'

// ── Validation Schemas ────────────────────────────────────────────────────────

const registerSchema = Joi.object({
  name: Joi.string().min(2).max(100).required().messages({
    'string.empty': 'Full name is required.',
    'string.min': 'Name must be at least 2 characters.',
  }),
  email: Joi.string().email().required().messages({
    'string.empty': 'Email is required.',
    'string.email': 'Please enter a valid email address.',
  }),
  password: Joi.string().min(8).required().messages({
    'string.empty': 'Password is required.',
    'string.min': 'Password must contain at least 8 characters.',
  }),
  // Only student or teacher — admin registration is blocked at service layer too
  role: Joi.string().valid('student', 'teacher').required().messages({
    'any.only': 'Role must be student or teacher.',
    'string.empty': 'Please select your role.',
  }),
  class_level: Joi.when('role', {
    is: 'student',
    then: Joi.string().valid('6', '7', '8', '9', '10', '11', '12').required().messages({
      'any.only': 'Please select a valid class (6–12).',
      'string.empty': 'Please select your class.',
      'any.required': 'Class is required for students.',
    }),
    otherwise: Joi.string().optional().allow('', null),
  }),
  medium: Joi.string().valid('English', 'Tamil').required().messages({
    'any.only': 'Medium must be English or Tamil.',
    'string.empty': 'Please select your medium.',
    'any.required': 'Medium is required.',
  }),
  phone: Joi.string().pattern(/^[0-9+\-\s()]{7,20}$/).optional().allow('', null).messages({
    'string.pattern.base': 'Please enter a valid phone number.',
  }),
})

const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.empty': 'Email is required.',
    'string.email': 'Please enter a valid email address.',
  }),
  password: Joi.string().required().messages({
    'string.empty': 'Password is required.',
  }),
})

// ── Handlers ─────────────────────────────────────────────────────────────────

export async function handleRegister(req: Request, res: Response, next: NextFunction) {
  try {
    const { error, value } = registerSchema.validate(req.body, { abortEarly: true })
    if (error) {
      return res.status(400).json({ success: false, error: error.details[0].message })
    }

    const { user, token } = await registerUser(value)

    // Return safe user object — password_hash is never returned
    res.status(201).json({
      success: true,
      data: { ...user, token },
      message: 'Account created successfully. Please log in.',
    })
  } catch (err: any) {
    const statusCode = err.statusCode || 500
    if (statusCode === 409) {
      return res.status(409).json({ success: false, error: err.message })
    }
    if (statusCode === 403) {
      return res.status(403).json({ success: false, error: err.message })
    }
    next(err)
  }
}

export async function handleLogin(req: Request, res: Response, next: NextFunction) {
  try {
    const { error, value } = loginSchema.validate(req.body, { abortEarly: true })
    if (error) {
      return res.status(400).json({ success: false, error: error.details[0].message })
    }

    const { user, token } = await loginUser(value)
    res.json({
      success: true,
      data: { ...user, token },
      message: 'Logged in successfully',
    })
  } catch (err: any) {
    if (err.message?.includes('Invalid')) {
      return res.status(401).json({ success: false, error: err.message })
    }
    next(err)
  }
}

export async function handleLogout(req: Request, res: Response) {
  // Stateless JWT — client discards token. This endpoint lets clients call
  // a server-side hook cleanly (e.g., audit log, future refresh token revocation).
  res.json({ success: true, message: 'Logged out successfully' })
}

export async function handleGetCurrentUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const user = await getUserById(req.user!.userId)
    res.json({
      success: true,
      data: user,
    })
  } catch (err) {
    next(err)
  }
}
