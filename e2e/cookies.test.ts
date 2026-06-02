import { test, expect, chromium } from '@playwright/test'
import path from 'path'
import { execSync } from 'child_process'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..')
const extensionPath = path.resolve(projectRoot, '.output/chrome-mv3')

test.beforeAll(() => {
  execSync('pnpm run build', { cwd: projectRoot, stdio: 'inherit' })
})

test('cookies API should work with host_permissions', async () => {
  const context = await chromium.launchPersistentContext('', {
    headless: false,
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
    ],
  })

  try {
    let sw = context.serviceWorkers()[0]
    if (!sw) {
      sw = await context.waitForEvent('serviceworker')
    }

    const page = await context.newPage()
    await page.goto('https://example.com')

    // Set cookies via page
    await page.evaluate(() => {
      document.cookie = 'test_cookie=hello; path=/'
      document.cookie = 'another_cookie=world; path=/'
    })

    // Verify cookies API can read them from the service worker
    const cookies = await sw.evaluate(async () => {
      // @ts-ignore
      return await chrome.cookies.getAll({ url: 'https://example.com' })
    })
    expect(cookies.length).toBeGreaterThanOrEqual(2)

    // Verify cookies API can remove them
    for (const cookie of cookies) {
      await sw.evaluate(async (c: any) => {
        // @ts-ignore
        await chrome.cookies.remove({
          url: `https://${c.domain.replace(/^\./, '')}${c.path}`,
          name: c.name,
        })
      }, cookie)
    }

    // Verify cookies are gone
    const after = await sw.evaluate(async () => {
      // @ts-ignore
      return await chrome.cookies.getAll({ url: 'https://example.com' })
    })
    expect(after.length).toBe(0)

    // Also verify from the page side
    const pageCookies = await page.evaluate(() => document.cookie)
    expect(pageCookies).not.toContain('test_cookie')
  } finally {
    await context.close()
  }
})
