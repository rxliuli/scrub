import { eraseContentData, type EraseItemResult } from '@/lib/eraser'
import { messager } from '@/lib/message'

export default defineUnlistedScript(async () => {
  const [contentResult, bgResult] = await Promise.all([
    eraseContentData(),
    messager.sendMessage('eraseCookies', undefined),
  ])

  const items: [string, boolean][] = []

  if (bgResult.cookies > 0) {
    items.push([`Cookies (${bgResult.cookies})`, true])
  }
  addItem(items, 'Local Storage', contentResult.localStorage)
  addItem(items, 'Session Storage', contentResult.sessionStorage)

  if (import.meta.env.FIREFOX) {
    if (bgResult.browsingData) {
      items.push(['IndexedDB', true])
    }
  } else {
    addItem(items, 'IndexedDB', contentResult.indexedDB)
  }

  addItem(items, 'Cache Storage', contentResult.cacheStorage)
  addItem(items, 'OPFS', contentResult.opfs)

  if (items.length === 0) {
    alert(`Site Eraser - ${location.hostname}\n\nNo site data found.`)
    return
  }

  const lines = items.map(([label]) => `✓ ${label}`)
  alert(`Site Eraser - ${location.hostname}\n\n${lines.join('\n')}`)
})

function addItem(
  items: [string, boolean][],
  label: string,
  result: EraseItemResult,
) {
  if (result.cleared && result.count > 0) {
    items.push([`${label} (${result.count})`, true])
  }
}
