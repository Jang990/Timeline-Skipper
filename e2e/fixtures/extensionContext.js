import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { test as base, chromium, expect } from '@playwright/test'

import { buildFixturePage } from './buildFixturePage.js'

// 확장은 일반 launch()로는 안 붙는다. persistent context여야 한다.
const EXTENSION_PATH = fileURLToPath(new URL('../../', import.meta.url))

// 로컬에 깔린 Chrome이 아니라 Playwright 번들 Chromium을 쓴다.
// Chrome 137부터 브랜드 Chrome은 --load-extension을 무시한다(152에서 실측: 확장이
// chrome://extensions-internals에 아예 안 뜬다). 브랜딩 없는 Chromium은 아직 받아준다.
const BROWSER_CHANNEL = process.env.TIMELINE_SKIP_BROWSER_CHANNEL ?? 'chromium'
const IS_HEADLESS = process.env.TIMELINE_SKIP_HEADFUL !== '1'

export const WATCH_URL = 'https://www.youtube.com/watch?v=e2eFixture'
const YOUTUBE_PATTERN = 'https://www.youtube.com/**'

export { expect }

export const test = base.extend({
  extensionContext: async ({}, use) => {
    const userDataDir = await mkdtemp(join(tmpdir(), 'timeline-skip-e2e-'))
    const context = await chromium.launchPersistentContext(userDataDir, {
      channel: BROWSER_CHANNEL,
      headless: IS_HEADLESS,
      args: [
        `--disable-extensions-except=${EXTENSION_PATH}`,
        `--load-extension=${EXTENSION_PATH}`,
        // 자동 재생 정책에 걸리면 currentTime이 움직이지 않아 재생 관련 검증이 막힌다.
        '--autoplay-policy=no-user-gesture-required'
      ]
    })

    await use(context)

    await context.close()
    await rm(userDataDir, { recursive: true, force: true })
  },

  openWatchPage: async ({ extensionContext }, use) => {
    await use((fixture) => openWatchPage(extensionContext, fixture))
  }
})

// 주소는 youtube.com 그대로 두고 문서만 갈아끼운다. 그래야 manifest의 matches에 걸려
// content script가 평소처럼 주입된다.
async function openWatchPage(context, fixture) {
  const page = await context.newPage()
  const consoleErrors = collectConsoleErrors(page)

  await page.route(YOUTUBE_PATTERN, (route) => {
    if (route.request().resourceType() === 'document') {
      return route.fulfill({
        status: 200,
        contentType: 'text/html; charset=utf-8',
        body: buildFixturePage(fixture)
      })
    }

    // favicon 같은 나머지는 진짜 유튜브로 새지 않게 여기서 끊는다.
    return route.fulfill({ status: 204, body: '' })
  })

  await page.goto(WATCH_URL)

  return { page, readConsoleErrors: () => [...consoleErrors] }
}

function collectConsoleErrors(page) {
  const consoleErrors = []

  page.on('console', (message) => {
    if (message.type() === 'error') {
      consoleErrors.push(message.text())
    }
  })

  page.on('pageerror', (error) => consoleErrors.push(error.message))

  return consoleErrors
}
