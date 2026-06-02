import { describe, expect, it, beforeEach } from 'vitest'
import { eraseContentData } from './eraser'

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
})

describe('eraseContentData', () => {
  it('should return empty results when no data exists', async () => {
    const result = await eraseContentData()
    expect(result.localStorage).toEqual({ cleared: false, count: 0 })
    expect(result.sessionStorage).toEqual({ cleared: false, count: 0 })
    expect(result.indexedDB).toEqual({ cleared: false, count: 0 })
    expect(result.cacheStorage).toEqual({ cleared: false, count: 0 })
    expect(result.opfs).toEqual({ cleared: false, count: 0 })
  })

  it('should clear localStorage and report count', async () => {
    localStorage.setItem('key1', 'value1')
    localStorage.setItem('key2', 'value2')
    const result = await eraseContentData()
    expect(result.localStorage).toEqual({ cleared: true, count: 2 })
    expect(localStorage.length).toBe(0)
  })

  it('should clear sessionStorage and report count', async () => {
    sessionStorage.setItem('a', '1')
    sessionStorage.setItem('b', '2')
    sessionStorage.setItem('c', '3')
    const result = await eraseContentData()
    expect(result.sessionStorage).toEqual({ cleared: true, count: 3 })
    expect(sessionStorage.length).toBe(0)
  })

  it('should clear IndexedDB and report count', async () => {
    await new Promise<void>((resolve, reject) => {
      const req = indexedDB.open('test-db-1', 1)
      req.onsuccess = () => {
        req.result.close()
        resolve()
      }
      req.onerror = () => reject(req.error)
    })
    await new Promise<void>((resolve, reject) => {
      const req = indexedDB.open('test-db-2', 1)
      req.onsuccess = () => {
        req.result.close()
        resolve()
      }
      req.onerror = () => reject(req.error)
    })

    const result = await eraseContentData()
    expect(result.indexedDB.cleared).toBe(true)
    expect(result.indexedDB.count).toBeGreaterThanOrEqual(2)
  })

  it('should clear Cache Storage and report count', async () => {
    await caches.open('test-cache-1')
    await caches.open('test-cache-2')
    const result = await eraseContentData()
    expect(result.cacheStorage).toEqual({ cleared: true, count: 2 })
    const remaining = await caches.keys()
    expect(remaining.length).toBe(0)
  })

  it('should clear OPFS and report count', async () => {
    const root = await navigator.storage.getDirectory()
    await root.getFileHandle('test-file.txt', { create: true })
    await root.getDirectoryHandle('test-dir', { create: true })
    const result = await eraseContentData()
    expect(result.opfs).toEqual({ cleared: true, count: 2 })
    const entries: string[] = []
    for await (const [name] of root.entries()) {
      entries.push(name)
    }
    expect(entries.length).toBe(0)
  })
})
