export interface EraseItemResult {
  cleared: boolean
  count: number
}

export interface EraseResult {
  localStorage: EraseItemResult
  sessionStorage: EraseItemResult
  indexedDB: EraseItemResult
  cacheStorage: EraseItemResult
  opfs: EraseItemResult
}

export async function eraseContentData(): Promise<EraseResult> {
  const result: EraseResult = {
    localStorage: { cleared: false, count: 0 },
    sessionStorage: { cleared: false, count: 0 },
    indexedDB: { cleared: false, count: 0 },
    cacheStorage: { cleared: false, count: 0 },
    opfs: { cleared: false, count: 0 },
  }

  try {
    const count = localStorage.length
    if (count > 0) {
      localStorage.clear()
      result.localStorage = { cleared: true, count }
    }
  } catch (e) {
    console.warn('[Scrub] Failed to clear localStorage:', e)
  }

  try {
    const count = sessionStorage.length
    if (count > 0) {
      sessionStorage.clear()
      result.sessionStorage = { cleared: true, count }
    }
  } catch (e) {
    console.warn('[Scrub] Failed to clear sessionStorage:', e)
  }

  try {
    if ('databases' in indexedDB) {
      const dbs = await indexedDB.databases()
      if (dbs.length > 0) {
        const results = await Promise.allSettled(
          dbs.map(
            (db) =>
              new Promise<void>((resolve, reject) => {
                const req = indexedDB.deleteDatabase(db.name!)
                req.onsuccess = () => resolve()
                req.onerror = () => reject(req.error)
                req.onblocked = () => {
                  console.warn(
                    `[Scrub] IndexedDB "${db.name}" delete blocked (still open?)`,
                  )
                  resolve()
                }
              }),
          ),
        )
        const failed = results.filter((r) => r.status === 'rejected')
        if (failed.length > 0) {
          console.warn(
            `[Scrub] Failed to delete ${failed.length}/${dbs.length} IndexedDB databases`,
            failed.map((r) => (r as PromiseRejectedResult).reason),
          )
        }
        result.indexedDB = { cleared: true, count: dbs.length - failed.length }
      }
    } else {
      console.warn(
        '[Scrub] indexedDB.databases() not available, skipping IndexedDB cleanup',
      )
    }
  } catch (e) {
    console.warn('[Scrub] Failed to clear IndexedDB:', e)
  }

  try {
    const keys = await caches.keys()
    if (keys.length > 0) {
      await Promise.all(keys.map((key) => caches.delete(key)))
      result.cacheStorage = { cleared: true, count: keys.length }
    }
  } catch (e) {
    console.warn('[Scrub] Failed to clear Cache Storage:', e)
  }

  try {
    if ('storage' in navigator && 'getDirectory' in navigator.storage) {
      const root = await navigator.storage.getDirectory()
      const entries: string[] = []
      for await (const [name] of root.entries()) {
        entries.push(name)
      }
      if (entries.length > 0) {
        await Promise.all(
          entries.map((name) => root.removeEntry(name, { recursive: true })),
        )
        result.opfs = { cleared: true, count: entries.length }
      }
    }
  } catch (e) {
    console.warn('[Scrub] Failed to clear OPFS:', e)
  }

  return result
}
