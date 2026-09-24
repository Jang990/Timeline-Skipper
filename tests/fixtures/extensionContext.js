import { test as base, expect } from '@playwright/test'

import { buildChzzkFixturePage } from './buildChzzkFixturePage.js'
import { buildFixturePage } from './buildFixturePage.js'
import { launchExtensionBrowser, resetExtensionBrowser } from './extensionBrowser.js'
import { FIXTURE_VIDEO_URL, readFixtureVideo } from './media/fixtureVideo.js'

export const WATCH_URL = 'https://www.youtube.com/watch?v=e2eFixture'
export const CHZZK_VIDEO_URL = 'https://chzzk.naver.com/video/e2eFixture'

// 플랫폼마다 다른 것은 주소와 픽스처 문서뿐이다. 가로채는 방식은 같다.
const PLATFORMS = {
  youtube: { url: WATCH_URL, pattern: 'https://www.youtube.com/**', buildPage: buildFixturePage },
  chzzk: { url: CHZZK_VIDEO_URL, pattern: 'https://chzzk.naver.com/**', buildPage: buildChzzkFixturePage }
}

export { expect }

export const test = base.extend({
  // 크로미움을 띄우는 데 테스트당 0.4초가 든다. 워커마다 하나만 띄우고 테스트 사이에 비워 쓴다.
  // 워커 안의 테스트는 차례로 돌아 한 브라우저를 동시에 쓰는 일은 없다.
  sharedExtensionBrowser: [async ({}, use) => {
    let sharedBrowser = null
    const acquire = async (viewport) => {
      sharedBrowser ??= await launchExtensionBrowser(viewport)
      return isSameViewport(sharedBrowser.viewport, viewport) ? sharedBrowser : null
    }

    await use(acquire)

    await sharedBrowser?.close()
  }, { scope: 'worker' }],

  // 고정 viewport는 PiP 창에도 그대로 씌워진다. 창의 진짜 크기를 봐야 하는 spec은 viewport를 null로 둔다.
  // viewport가 다르면 공유 브라우저에 맞출 수 없으므로 그 테스트만 따로 띄운다.
  extensionContext: async ({ viewport, sharedExtensionBrowser }, use) => {
    const sharedBrowser = viewport === null ? null : await sharedExtensionBrowser(viewport)

    if (sharedBrowser === null) {
      const ownBrowser = await launchExtensionBrowser(viewport)
      await use(ownBrowser.context)
      await ownBrowser.close()
      return
    }

    await use(sharedBrowser.context)
    await resetExtensionBrowser(sharedBrowser)
  },

  openWatchPage: async ({ extensionContext }, use) => {
    await use((fixture) => openPlatformPage(extensionContext, PLATFORMS.youtube, fixture))
  },

  openChzzkPage: async ({ extensionContext }, use) => {
    await use((fixture) => openPlatformPage(extensionContext, PLATFORMS.chzzk, fixture))
  }
})

// 주소는 플랫폼 것 그대로 두고 문서만 갈아끼운다. 그래야 manifest의 matches에 걸려
// content script가 평소처럼 주입된다.
async function openPlatformPage(context, platform, fixture) {
  const page = await context.newPage()
  const consoleErrors = collectConsoleErrors(page)

  await page.route(platform.pattern, (route) => {
    if (route.request().url().endsWith(FIXTURE_VIDEO_URL)) {
      return fulfillFixtureVideo(route)
    }

    if (route.request().resourceType() === 'document') {
      return route.fulfill({
        status: 200,
        contentType: 'text/html; charset=utf-8',
        body: platform.buildPage({ videoSourceUrl: FIXTURE_VIDEO_URL, ...fixture })
      })
    }

    // favicon 같은 나머지는 진짜 플랫폼으로 새지 않게 여기서 끊는다.
    return route.fulfill({ status: 204, body: '' })
  })

  await page.goto(platform.url)

  return { page, readConsoleErrors: () => [...consoleErrors] }
}

// Accept-Ranges가 없으면 크롬이 video.seekable을 [0, 0]으로 잡고 seek을 전부 무시한다
// (실측: currentTime을 넣어도 0에 머문다). 파일이 8KB라 통째로 돌려줘도 된다.
function fulfillFixtureVideo(route) {
  const body = readFixtureVideo()

  return route.fulfill({
    status: 200,
    contentType: 'video/mp4',
    headers: { 'Accept-Ranges': 'bytes', 'Content-Length': String(body.length) },
    body
  })
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

function isSameViewport(left, right) {
  return left?.width === right?.width && left?.height === right?.height
}
