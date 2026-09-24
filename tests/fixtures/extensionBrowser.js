import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { chromium } from '@playwright/test'

// 확장은 일반 launch()로는 안 붙는다. persistent context여야 한다.
const EXTENSION_PATH = fileURLToPath(new URL('../../', import.meta.url))

// 로컬에 깔린 Chrome이 아니라 Playwright 번들 Chromium을 쓴다.
// Chrome 137부터 브랜드 Chrome은 --load-extension을 무시한다(152에서 실측: 확장이
// chrome://extensions-internals에 아예 안 뜬다). 브랜딩 없는 Chromium은 아직 받아준다.
const BROWSER_CHANNEL = process.env.TIMELINE_SKIP_BROWSER_CHANNEL ?? 'chromium'
const IS_HEADLESS = process.env.TIMELINE_SKIP_HEADFUL !== '1'

// 확장의 저장소를 만질 수 있는 페이지가 필요할 뿐이다. 팝업은 열릴 때 읽기만 하고 쓰지 않는다.
const EXTENSION_PAGE_PATH = 'src/popup/popup.html'

export async function launchExtensionBrowser(viewport) {
  const userDataDir = await mkdtemp(join(tmpdir(), 'timeline-skip-e2e-'))
  const context = await chromium.launchPersistentContext(userDataDir, {
    channel: BROWSER_CHANNEL,
    headless: IS_HEADLESS,
    viewport,
    args: [
      `--disable-extensions-except=${EXTENSION_PATH}`,
      `--load-extension=${EXTENSION_PATH}`,
      // 자동 재생 정책에 걸리면 currentTime이 움직이지 않아 재생 관련 검증이 막힌다.
      '--autoplay-policy=no-user-gesture-required'
    ]
  })

  // 띄운 직후에는 service worker가 살아 있다. 한참 뒤에 찾으면 잠들어 있어 못 찾을 수 있으므로 지금 주소를 받아 둔다.
  const [serviceWorker] = context.serviceWorkers()
  const worker = serviceWorker ?? (await context.waitForEvent('serviceworker'))
  const extensionId = new URL(worker.url()).host

  const close = async () => {
    await context.close()
    await rm(userDataDir, { recursive: true, force: true })
  }

  return { context, extensionId, viewport, close }
}

// 테스트끼리 넘겨받을 수 있는 것은 확장 저장소, 열린 탭·창, 권한 셋뿐이다.
// 페이지를 먼저 닫아야 닫히는 페이지가 비운 저장소에 다시 쓰지 못한다.
export async function resetExtensionBrowser({ context, extensionId }) {
  const cleaner = await context.newPage()
  const otherPages = context.pages().filter((page) => page !== cleaner)
  await Promise.all(otherPages.map((page) => page.close()))

  await cleaner.goto(`chrome-extension://${extensionId}/${EXTENSION_PAGE_PATH}`)
  await cleaner.evaluate(() => chrome.storage.local.clear())

  // 탭을 하나는 남겨 둔다. 창이 켜진 모드에서 마지막 탭을 닫으면 브라우저가 통째로 꺼진다.
  await cleaner.goto('about:blank')
  await context.clearPermissions()
}
