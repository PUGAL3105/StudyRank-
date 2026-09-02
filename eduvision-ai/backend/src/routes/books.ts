import { Router } from 'express'
import {
  handleUploadBook,
  handleBatchUploadBooks,
  handleListBooks,
  handleGetBookDetails,
  handleStreamBookPDF,
  handleProcessBook,
  handleGetBookStatus,
  handleGetBookChapters,
  handleReindexBook,
  handleDeleteBook,
  handleClearAllBooks,
  handleRetryBook,
  handleGetTextbookHealth,
  uploadMiddleware,
} from '../controllers/bookController'
import { authMiddleware, requireRole } from '../middleware/auth'

const router = Router()

// Textbook Ingestion & Processing Routes
router.get('/health', handleGetTextbookHealth)
router.post('/', authMiddleware, requireRole('teacher', 'admin'), uploadMiddleware.single('file'), handleUploadBook)
router.post('/upload', authMiddleware, requireRole('teacher', 'admin'), uploadMiddleware.single('file'), handleUploadBook)
router.post('/batch-upload', authMiddleware, requireRole('admin'), uploadMiddleware.array('files', 50), handleBatchUploadBooks)
router.get('/', handleListBooks)
router.get('/catalog', handleListBooks)
router.get('/stream/:id', handleStreamBookPDF)
router.get('/:id', handleGetBookDetails)
router.get('/:id/pdf', handleStreamBookPDF)
router.post('/:id/process', authMiddleware, requireRole('teacher', 'admin'), uploadMiddleware.single('file'), handleProcessBook)
router.get('/:id/status', handleGetBookStatus)
router.get('/:id/chapters', handleGetBookChapters)
router.post('/:id/reindex', authMiddleware, requireRole('teacher', 'admin'), handleReindexBook)
router.post('/:id/retry', authMiddleware, requireRole('teacher', 'admin'), handleRetryBook)
router.delete('/clear-all', authMiddleware, requireRole('teacher', 'admin'), handleClearAllBooks)
router.delete('/:id', authMiddleware, requireRole('teacher', 'admin'), handleDeleteBook)

export default router

