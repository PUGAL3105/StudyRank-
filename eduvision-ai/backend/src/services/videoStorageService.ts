import fs from 'fs'
import path from 'path'

const STORAGE_DIR = path.join(process.cwd(), 'storage', 'videos')

// Ensure local video storage directory exists
if (!fs.existsSync(STORAGE_DIR)) {
  fs.mkdirSync(STORAGE_DIR, { recursive: true })
}

export class VideoStorageService {
  /**
   * Upload / Write video file buffer to storage
   */
  async uploadVideo(filename: string, buffer: Buffer): Promise<string> {
    const filePath = path.join(STORAGE_DIR, filename)
    await fs.promises.writeFile(filePath, buffer)
    return this.getVideoUrl(filename)
  }

  /**
   * Return public URL for stored video
   */
  getVideoUrl(filename: string): string {
    return `http://localhost:5000/storage/videos/${filename}`
  }

  /**
   * Delete video file safely
   */
  async deleteVideo(filename: string): Promise<boolean> {
    const filePath = path.join(STORAGE_DIR, filename)
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath)
      return true
    }
    return false
  }

  /**
   * Check if video file exists
   */
  fileExists(filename: string): boolean {
    return fs.existsSync(path.join(STORAGE_DIR, filename))
  }
}

export const videoStorageService = new VideoStorageService()
