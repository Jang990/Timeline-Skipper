import { test, expect, WATCH_URL } from './fixtures/extensionContext.js'

// 이 네 개는 실패 지점이 서로 다르다. 어느 것이 깨졌는지로 원인이 갈린다.
// 1번만 실패 = 문서 가로채기 방식이 틀렸다
// 2번만 실패 = 주입은 됐고 조립이 깨졌다
// 4번만 실패 = manifest의 web_accessible_resources에서 빠진 모듈이 있다
test.describe('확장 로드', () => {
  test('가로챈 픽스처 문서가 youtube.com 주소로 열린다', async ({ openWatchPage }) => {
    const { page } = await openWatchPage({ commentTexts: [] })

    expect(page.url()).toBe(WATCH_URL)
    await expect(page.locator('#secondary-inner')).toBeAttached()
  })

  test('content script가 주입되어 패널이 #secondary-inner 안에 그려진다', async ({ openWatchPage }) => {
    const { page } = await openWatchPage({ commentTexts: [] })

    await expect(page.locator('#secondary-inner > #timeline-skip-panel')).toBeVisible()
  })

  test('타임라인을 불러오기 전에는 패널에 안내 문구가 보인다', async ({ openWatchPage }) => {
    const { page } = await openWatchPage({ commentTexts: [] })

    await expect(page.locator('#timeline-skip-panel .timeline-skip-empty')).toBeVisible()
  })

  test('확장 모듈을 불러오는 동안 콘솔 오류가 없다', async ({ openWatchPage }) => {
    const { page, readConsoleErrors } = await openWatchPage({ commentTexts: [] })

    await expect(page.locator('#timeline-skip-panel')).toBeAttached()

    expect(readConsoleErrors()).toEqual([])
  })
})
