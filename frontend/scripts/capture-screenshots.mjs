/**
 * Capture portfolio screenshots of the redesigned UI.
 *
 * Usage (from frontend/):
 *   npx --yes playwright install chromium
 *   node scripts/capture-screenshots.mjs
 */
import { chromium } from 'playwright'
import { mkdir, rm } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT = path.resolve(__dirname, '../UI')
const BASE = process.env.APP_URL ?? 'http://localhost:5173'
const API = process.env.API_URL ?? 'http://localhost:8000'

const email = process.env.DEMO_EMAIL ?? 'demo@documind.ai'
const password = process.env.DEMO_PASSWORD ?? 'Demo1234!'
const fullName = process.env.DEMO_NAME ?? 'Demo User'

async function ensureAuth(page) {
  const loginRes = await fetch(`${API}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })

  let pair
  if (loginRes.ok) {
    pair = await loginRes.json()
  } else {
    const registerRes = await fetch(`${API}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ full_name: fullName, email, password }),
    })
    if (!registerRes.ok) {
      const detail = await registerRes.text()
      throw new Error(`Auth failed: login=${loginRes.status} register=${registerRes.status} ${detail}`)
    }
    pair = await registerRes.json()
  }

  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' })
  await page.evaluate((tokens) => {
    localStorage.setItem(
      'documind.auth',
      JSON.stringify({
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
      }),
    )
    localStorage.setItem('theme', 'light')
    document.documentElement.classList.remove('dark')
  }, pair)
  await page.goto(`${BASE}/app`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(800)
  if (!page.url().includes('/app')) {
    throw new Error(`Expected /app after auth, got ${page.url()}`)
  }
}

async function shot(page, name, urlPath) {
  await page.goto(`${BASE}${urlPath}`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(600)
  await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: false })
  console.log('saved', name)
}

async function main() {
  // Verify API is up
  const health = await fetch(`${API}/docs`).catch(() => null)
  if (!health?.ok && health?.status !== 200) {
    // /docs may redirect; any response means server is up
    try {
      await fetch(`${API}/api/auth/me`)
    } catch {
      console.error('Backend not reachable at', API)
      process.exit(1)
    }
  }

  await rm(OUT, { recursive: true, force: true })
  await mkdir(OUT, { recursive: true })

  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  })
  const page = await context.newPage()

  // Landing (light)
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' })
  await page.evaluate(() => {
    document.documentElement.classList.remove('dark')
    localStorage.setItem('theme', 'light')
  })
  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForTimeout(500)
  await page.screenshot({ path: path.join(OUT, 'landing-light.png'), fullPage: false })
  console.log('saved landing-light')

  // Landing (dark)
  await page.evaluate(() => {
    document.documentElement.classList.add('dark')
    localStorage.setItem('theme', 'dark')
  })
  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForTimeout(500)
  await page.screenshot({ path: path.join(OUT, 'landing-dark.png'), fullPage: false })
  console.log('saved landing-dark')

  // Auth pages
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(400)
  await page.screenshot({ path: path.join(OUT, 'login.png'), fullPage: false })
  console.log('saved login')

  await ensureAuth(page)

  // App pages — light
  await page.evaluate(() => {
    document.documentElement.classList.remove('dark')
    localStorage.setItem('theme', 'light')
  })

  await shot(page, 'dashboard-light', '/app')
  await shot(page, 'documents-light', '/app/documents')
  await shot(page, 'billing-light', '/app/billing')
  await shot(page, 'settings-light', '/app/settings')
  await shot(page, 'chat-light', '/app/chat')

  // App pages — dark
  await page.evaluate(() => {
    document.documentElement.classList.add('dark')
    localStorage.setItem('theme', 'dark')
  })

  await shot(page, 'dashboard-dark', '/app')
  await shot(page, 'documents-dark', '/app/documents')
  await shot(page, 'billing-dark', '/app/billing')
  await shot(page, 'settings-dark', '/app/settings')
  await shot(page, 'chat-dark', '/app/chat')

  await browser.close()
  console.log('Done →', OUT)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
