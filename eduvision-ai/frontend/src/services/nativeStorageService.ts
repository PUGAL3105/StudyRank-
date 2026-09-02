// Native & Hybrid Offline Storage Bridge for EduVision AI Mobile
export interface OfflineMediaAsset {
  id: string
  title: string
  type: 'pdf' | 'audio' | 'image' | 'video_script'
  dataBlobUrl: string
  sizeBytes: number
  cachedAt: string
}

class NativeStorageService {
  private dbName = 'EduVisionNativeStorage'
  private storeName = 'offline_assets'
  private memoryCache: Map<string, OfflineMediaAsset> = new Map()

  async openDB(): Promise<IDBDatabase | null> {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return null
    }

    return new Promise((resolve, reject) => {
      const request = window.indexedDB.open(this.dbName, 1)
      request.onupgradeneeded = (e: any) => {
        const db = e.target.result
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'id' })
        }
      }
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  async saveMediaAsset(asset: OfflineMediaAsset): Promise<boolean> {
    this.memoryCache.set(asset.id, asset)
    const db = await this.openDB()
    if (!db) return true

    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readwrite')
      const store = tx.objectStore(this.storeName)
      const req = store.put(asset)
      req.onsuccess = () => resolve(true)
      req.onerror = () => reject(req.error)
    })
  }

  async getMediaAsset(id: string): Promise<OfflineMediaAsset | null> {
    if (this.memoryCache.has(id)) {
      return this.memoryCache.get(id) || null
    }

    const db = await this.openDB()
    if (!db) return null

    return new Promise((resolve) => {
      const tx = db.transaction(this.storeName, 'readonly')
      const store = tx.objectStore(this.storeName)
      const req = store.get(id)
      req.onsuccess = () => {
        if (req.result) {
          this.memoryCache.set(id, req.result)
          resolve(req.result)
        } else {
          resolve(null)
        }
      }
      req.onerror = () => resolve(null)
    })
  }

  async listAllCachedAssets(): Promise<OfflineMediaAsset[]> {
    const db = await this.openDB()
    if (!db) return Array.from(this.memoryCache.values())

    return new Promise((resolve) => {
      const tx = db.transaction(this.storeName, 'readonly')
      const store = tx.objectStore(this.storeName)
      const req = store.getAll()
      req.onsuccess = () => resolve(req.result || [])
      req.onerror = () => resolve(Array.from(this.memoryCache.values()))
    })
  }

  async deleteAsset(id: string): Promise<boolean> {
    this.memoryCache.delete(id)
    const db = await this.openDB()
    if (!db) return true

    return new Promise((resolve) => {
      const tx = db.transaction(this.storeName, 'readwrite')
      const store = tx.objectStore(this.storeName)
      const req = store.delete(id)
      req.onsuccess = () => resolve(true)
      req.onerror = () => resolve(false)
    })
  }
}

export const nativeStorageService = new NativeStorageService()
