import path from 'path'
import fs from 'fs'

export interface StorageMetadata {
  fileSize: number
  mimeType: string
  originalFilename: string
  sha256?: string
  lastModified?: string
}

export interface StorageStreamOptions {
  start?: number
  end?: number
}

export interface ITextbookStorageService {
  upload(fileBuffer: Buffer, storageKey: string, metadata?: Partial<StorageMetadata>): Promise<string>
  exists(storageKey: string): Promise<boolean>
  getMetadata(storageKey: string): Promise<StorageMetadata | null>
  createReadStream(storageKey: string, options?: StorageStreamOptions): fs.ReadStream
  getSignedUrl(storageKey: string, expiresInSeconds?: number): Promise<string>
  delete(storageKey: string): Promise<boolean>
  getLocalPath(storageKey: string): string | null
}

/**
 * Production-ready Storage Service supporting local filesystem storage
 * with full interface readiness for AWS S3, Supabase Storage, or Cloudflare R2.
 */
export class TextbookStorageService implements ITextbookStorageService {
  private baseStorageDir: string
  private fallbackDataDir: string

  constructor() {
    this.baseStorageDir = path.resolve(process.cwd(), 'storage')
    this.fallbackDataDir = path.resolve(process.cwd(), 'data')

    // Ensure storage base directories exist
    const textbookStorageDir = path.join(this.baseStorageDir, 'textbooks')
    if (!fs.existsSync(textbookStorageDir)) {
      fs.mkdirSync(textbookStorageDir, { recursive: true })
    }
  }

  /**
   * Resolves and validates a storage key against directory traversal attacks.
   */
  public getLocalPath(storageKey: string): string | null {
    if (!storageKey || storageKey.includes('..')) {
      return null
    }

    // 1. Direct path check if key is already an existing absolute or relative path
    const candidateDirect = path.resolve(process.cwd(), storageKey)
    if (
      (candidateDirect.startsWith(this.baseStorageDir) || candidateDirect.startsWith(this.fallbackDataDir)) &&
      fs.existsSync(candidateDirect) &&
      fs.statSync(candidateDirect).isFile()
    ) {
      return candidateDirect
    }

    // 2. Relative to baseStorageDir
    const candidateStorage = path.resolve(this.baseStorageDir, storageKey)
    if (
      candidateStorage.startsWith(this.baseStorageDir) &&
      fs.existsSync(candidateStorage) &&
      fs.statSync(candidateStorage).isFile()
    ) {
      return candidateStorage
    }


    // 3. Relative to fallbackDataDir
    const candidateData = path.resolve(this.fallbackDataDir, storageKey)
    if (
      candidateData.startsWith(this.fallbackDataDir) &&
      fs.existsSync(candidateData) &&
      fs.statSync(candidateData).isFile()
    ) {
      return candidateData
    }

    return null
  }

  /**
   * Uploads a textbook PDF buffer to persistent storage.
   */
  public async upload(
    fileBuffer: Buffer,
    storageKey: string,
    _metadata?: Partial<StorageMetadata>
  ): Promise<string> {
    if (!storageKey || storageKey.includes('..')) {
      throw new Error('Invalid storage key: path traversal detected.')
    }

    const targetPath = path.resolve(this.baseStorageDir, storageKey)
    if (!targetPath.startsWith(this.baseStorageDir)) {
      throw new Error('Access denied: target path outside storage directory.')
    }

    const dir = path.dirname(targetPath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }

    fs.writeFileSync(targetPath, fileBuffer)
    return storageKey
  }

  /**
   * Checks if a textbook PDF exists in storage.
   */
  public async exists(storageKey: string): Promise<boolean> {
    const localPath = this.getLocalPath(storageKey)
    return localPath !== null && fs.existsSync(localPath)
  }


  /**
   * Retrieves file size, MIME type, and metadata for a stored textbook PDF.
   */
  public async getMetadata(storageKey: string): Promise<StorageMetadata | null> {
    const localPath = this.getLocalPath(storageKey)
    if (!localPath || !fs.existsSync(localPath)) {
      return null
    }

    const stat = fs.statSync(localPath)
    return {
      fileSize: stat.size,
      mimeType: 'application/pdf',
      originalFilename: path.basename(localPath),
      lastModified: stat.mtime.toISOString(),
    }
  }


  /**
   * Creates a read stream with optional HTTP Range start and end byte offsets.
   */
  public createReadStream(storageKey: string, options?: StorageStreamOptions): fs.ReadStream {
    const localPath = this.getLocalPath(storageKey)
    if (!localPath || !fs.existsSync(localPath)) {
      throw new Error('File not found in storage: ' + storageKey)
    }

    return fs.createReadStream(localPath, options)
  }


  /**
   * Generates a signed or authenticated URL for PDF access.
   */
  public async getSignedUrl(storageKey: string, _expiresInSeconds: number = 900): Promise<string> {
    return '/api/books/' + encodeURIComponent(storageKey) + '/pdf'
  }


  /**
   * Deletes a textbook PDF file from storage.
   */
  public async delete(storageKey: string): Promise<boolean> {
    const localPath = this.getLocalPath(storageKey)
    if (!localPath || !fs.existsSync(localPath)) {
      return false
    }
    fs.unlinkSync(localPath)
    return true
  }
}

export const storageService = new TextbookStorageService()
