import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { test as base, chromium, expect } from '@playwright/test'

// 확장은 일반 launch()로는 안 붙는다. persistent context여야 한다.
const EXTENSION_PATH = fileURLToPath(new URL('../../', import.meta.url))

// 브랜드 Chrome은 137부터 --load-extension을 무시한다. 브랜딩 없는 Chromium은 아직 받아준다.
const BROWSER_CHANNEL = process.env.TIMELINE_SKIP_BROWSER_CHANNEL ?? 'chromium'
const IS_HEADLESS = process.env.TIMELINE_SKIP_HEADFUL !== '1'

// 댓글이 13개뿐인 영상이라 타임라인 댓글이 늘 첫 화면에 들어온다. 댓글 순서가 바뀌어도
// 버튼을 찾지 못해 실패하는 일이 없다.
export const WATCH_URL = 'https://www.youtube.com/watch?v=3yG8GXdnEFQ'

export { expect }

export const test = base.extend({
  // 진짜 유튜브를 여는 테스트다. 브라우저를 워커당 한 번만 띄워 접속 횟수를 줄인다.
  extensionContext: [
    async ({}, use) => {
      const userDataDir = await mkdtemp(join(tmpdir(), 'timeline-skip-live-'))
      const context = await chromium.launchPersistentContext(userDataDir, {
        channel: BROWSER_CHANNEL,
        headless: IS_HEADLESS,

        // 추천 영상 칸(#secondary-inner)은 창이 좁으면 아예 렌더되지 않는다. 패널 자리가 사라진다.
        viewport: { width: 1440, height: 900 },
        args: [`--disable-extensions-except=${EXTENSION_PATH}`, `--load-extension=${EXTENSION_PATH}`]
      })

      await use(context)

      await context.close()
      await rm(userDataDir, { recursive: true, force: true })
    },
    { scope: 'worker' }
  ],

  openWatchPage: async ({ extensionContext }, use) => {
    await use(() => openWatchPage(extensionContext))
  }
})

async function openWatchPage(context) {
  const page = await context.newPage()
  const extensionErrors = collectExtensionErrors(page)

  // load까지 기다리면 광고와 추천 영상 썸네일이 다 내려올 때까지 잡혀 있다.
  await page.goto(WATCH_URL, { waitUntil: 'domcontentloaded' })

  return { page, readExtensionErrors: () => [...extensionErrors] }
}

// 실제 페이지에서는 유튜브 자신의 오류가 훨씬 많다(광고 도메인 차단, 로그인 안 한 상태의 401).
// 확장에서 난 것만 남겨야 이 단언이 쓸모 있다.
function collectExtensionErrors(page) {
  const extensionErrors = []

  page.on('console', (message) => {
    if (message.type() === 'error' && isFromExtension(message.location().url, message.text())) {
      extensionErrors.push(message.text())
    }
  })

  page.on('pageerror', (error) => {
    if (isFromExtension(error.stack ?? '', error.message)) {
      extensionErrors.push(error.message)
    }
  })

  return extensionErrors
}

function isFromExtension(...texts) {
  return texts.some((text) => text.includes('chrome-extension://'))
}
