import db from '../db/connection'
import bcrypt from 'bcryptjs'
import { generateToken } from '../utils/jwt'
import { UserData, LoginData, User } from '../types/index'

export async function registerUser(data: UserData): Promise<{ user: User; token: string }> {
  // SECURITY: Never allow self-registration as admin
  if (data.role === 'admin') {
    throw Object.assign(new Error('Admin accounts cannot be created via public registration.'), { statusCode: 403 })
  }

  // Check if user exists
  const existing = await db.oneOrNone('SELECT id FROM users WHERE email = $1', [data.email])

  if (existing) {
    throw Object.assign(new Error('An account with this email already exists.'), { statusCode: 409 })
  }

  // Hash password (bcrypt cost 12 for production security)
  const passwordHash = await bcrypt.hash(data.password, 12)

  // Create user with extended profile fields
  const user = await db.one(
    `INSERT INTO users (email, name, password_hash, role, class_level, medium, phone)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, email, name, role, class_level, medium, phone, avatar_url, created_at`,
    [
      data.email,
      data.name,
      passwordHash,
      data.role,
      data.class_level || null,
      data.medium || null,
      data.phone || null,
    ]
  )

  // Generate token
  const token = generateToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  })

  return { user, token }
}

export async function loginUser(data: LoginData): Promise<{ user: User; token: string }> {
  // Find user
  const user = await db.oneOrNone(
    `SELECT id, email, name, password_hash, role, class_level, medium, phone, avatar_url, created_at
     FROM users WHERE email = $1`,
    [data.email]
  )

  if (!user) {
    throw new Error('Invalid email or password')
  }

  // Check password
  const passwordValid = await bcrypt.compare(data.password, user.password_hash)

  if (!passwordValid) {
    throw new Error('Invalid email or password')
  }

  // Generate token
  const token = generateToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  })

  // Return user without password hash — NEVER expose password_hash
  const { password_hash, ...userWithoutPassword } = user
  return {
    user: userWithoutPassword,
    token,
  }
}

export async function getUserById(id: string): Promise<User> {
  const rawUser = await db.oneOrNone(
    `SELECT id, email, name, role, class_level, medium, phone, avatar_url, created_at
     FROM users WHERE id = $1`,
    [id]
  )

  if (!rawUser) {
    throw new Error('User not found')
  }

  // SECURITY: Always strip password_hash — even if memoryStore fallback returns it
  const { password_hash, ...safeUser } = rawUser
  void password_hash // explicitly discard
  return safeUser as User
}
