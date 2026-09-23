import { test, expect, CHZZK_VIDEO_URL } from '../fixtures/extensionContext.js'

// 유튜브 쪽 panel.spec.js와 같은 역할을 치지직에서 한다.
// 실패 지점이 다르다 — 1번은 셀렉터나 manifest의 matches, 2번은 web_accessible_resources다.
const PANEL = '#timeline-skip-panel'
const RIGHT_COLUMN = '[class^="_content_right_"]'

test.describe('치지직 확장 로드', () => {
  test('패널이 영상 오른쪽 칸 맨 위에 그려진다', async ({ openChzzkPage }) => {
    const { page } = await openChzzkPage()

    expect(page.url()).toBe(CHZZK_VIDEO_URL)
    await expect(page.locator(`${RIGHT_COLUMN} > ${PANEL}:first-child`)).toBeVisible()
  })

  test('확장 모듈을 불러오는 동안 콘솔 오류가 없다', async ({ openChzzkPage }) => {
    const { page, readConsoleErrors } = await openChzzkPage()

    await expect(page.locator(PANEL)).toBeAttached()

    expect(readConsoleErrors()).toEqual([])
  })
})
