import { messager } from '@/lib/message'
import { ScriptPublicPath } from 'wxt/utils/inject-script'

export default defineBackground(() => {
  browser.action.onClicked.addListener(async (tab) => {
    if (!tab.id) return
    await browser.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['/eraser.js'] as ScriptPublicPath[],
    })
  })

  messager.onMessage('eraseCookies', async (message) => {
    const url = message.sender.tab?.url
    if (!url) {
      console.warn('[Scrub] No tab URL available for cookie clearing')
      return { cookies: 0, browsingData: false }
    }

    let cookies = 0
    try {
      let all = await browser.cookies.getAll({ url })

      // Safari requires storeId to get cookies
      if (all.length === 0 && browser.cookies.getAllCookieStores) {
        const stores = await browser.cookies.getAllCookieStores()
        all = (
          await Promise.all(
            stores.map((store) =>
              browser.cookies.getAll({ url, storeId: store.id }),
            ),
          )
        ).flat()
      }

      if (all.length > 0) {
        const parsedUrl = new URL(url)
        const results = await Promise.allSettled(
          all.map((cookie) =>
            browser.cookies.remove({
              url: `${parsedUrl.protocol}//${cookie.domain.replace(/^\./, '')}${cookie.path}`,
              name: cookie.name,
              storeId: cookie.storeId,
            }),
          ),
        )
        const failed = results.filter((r) => r.status === 'rejected')
        if (failed.length > 0) {
          console.warn(
            `[Scrub] Failed to remove ${failed.length}/${all.length} cookies`,
            failed.map((r) => (r as PromiseRejectedResult).reason),
          )
        }
        cookies = all.length - failed.length
      }
    } catch (e) {
      console.warn('[Scrub] Failed to clear cookies:', e)
    }

    let browsingData = false
    if (import.meta.env.FIREFOX) {
      try {
        await (browser.browsingData.remove as Function)(
          { hostnames: [new URL(url).hostname] },
          { indexedDB: true },
        )
        browsingData = true
      } catch (e) {
        console.warn('[Scrub] Failed to clear browsingData:', e)
      }
    }

    return { cookies, browsingData }
  })
})
