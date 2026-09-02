import { Request, Response, NextFunction } from 'express'

export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  console.error('Error:', err.message)

  // Validation errors
  if (err.message.includes('Validation')) {
    return res.status(400).json({ error: err.message })
  }

  // Not found
  if (err.message.includes('not found')) {
    return res.status(404).json({ error: err.message })
  }

  // Authentication errors
  if (err.message.includes('Unauthorized') || err.message.includes('token')) {
    return res.status(401).json({ error: err.message })
  }

  // Default server error
  return res.status(500).json({ error: 'An unexpected error occurred' })
}
