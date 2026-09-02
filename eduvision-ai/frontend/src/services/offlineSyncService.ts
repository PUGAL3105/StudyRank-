// ==============================================================================
// EduVision AI — IndexedDB Offline Sync & Low-Bandwidth Service
// ==============================================================================

export interface OfflineAttempt {
  id: string
  type: 'quiz' | 'assignment'
  targetId: string // quizId or assignmentId
  answers: any[]
  timestamp: string
  synced: boolean
}

const DB_NAME = 'eduvision_offline_db'
const DB_VERSION = 1
const STORE_NAME = 'pending_attempts'

class OfflineSyncService {
  private db: IDBDatabase | null = null

  constructor() {
    this.initDB().catch(() => {
      /* IndexedDB init */
    })
  }

  private initDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      if (this.db) {
        return resolve(this.db)
      }

      if (typeof window === 'undefined' || !('indexedDB' in window)) {
        return reject(new Error('IndexedDB not supported.'))
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onupgradeneeded = (event: any) => {
        const db = event.target.result
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' })
        }
      }

      request.onsuccess = (event: any) => {
        this.db = event.target.result
        resolve(this.db!)
      }

      request.onerror = (event: any) => {
        reject(event.target.error)
      }
    })
  }

  // Save attempt to IndexedDB when offline
  public async saveOfflineAttempt(attempt: Omit<OfflineAttempt, 'id' | 'timestamp' | 'synced'>): Promise<string> {
    const db = await this.initDB()
    const id = `off-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`
    const record: OfflineAttempt = {
      ...attempt,
      id,
      timestamp: new Date().toISOString(),
      synced: false,
    }

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      const store = tx.objectStore(STORE_NAME)
      const req = store.add(record)

      req.onsuccess = () => resolve(id)
      req.onerror = () => reject(req.error)
    })
  }

  // Get all pending unsynced attempts
  public async getPendingAttempts(): Promise<OfflineAttempt[]> {
    const db = await this.initDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly')
      const store = tx.objectStore(STORE_NAME)
      const req = store.getAll()

      req.onsuccess = () => resolve(req.result || [])
      req.onerror = () => reject(req.error)
    })
  }

  // Remove synced attempt from IndexedDB
  public async removeAttempt(id: string): Promise<void> {
    const db = await this.initDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      const store = tx.objectStore(STORE_NAME)
      const req = store.delete(id)

      req.onsuccess = () => resolve()
      req.onerror = () => reject(req.error)
    })
  }

  // Auto-sync handler to flush queued items to API
  public async syncPendingQueue(syncExecutor: (item: OfflineAttempt) => Promise<boolean>): Promise<{ synced: number; failed: number }> {
    const pending = await this.getPendingAttempts()
    let synced = 0
    let failed = 0

    for (const item of pending) {
      try {
        const success = await syncExecutor(item)
        if (success) {
          await this.removeAttempt(item.id)
          synced++
        } else {
          failed++
        }
      } catch {
        failed++
      }
    }

    return { synced, failed }
  }
}

export const offlineSyncService = new OfflineSyncService()
