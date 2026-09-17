import { test, expect } from '../fixtures/extensionContext.js'

const TIMELINE_COMMENT = ['00:00 첫 곡', '05:00 둘째 곡', '10:00 셋째 곡'].join('\n')

const FLOATING = '#timeline-skip-floating'
const ICON = `${FLOATING} .timeline-skip-floating-icon`
const CARD = `${FLOATING} .timeline-skip-floating-card`
const TITLE = `${FLOATING} .timeline-skip-floating-title`
const META = `${FLOATING} .timeline-skip-floating-meta`
const CONTROLS = `${FLOATING} .timeline-skip-controls`
const JUMP = `${FLOATING} .timeline-skip-floating-jump`

// 픽셀 경계는 소수로 떨어진다. 몇 px 안의 차이는 같은 자리로 본다.
const TOLERANCE = 4

test.describe('떠 있는 위젯의 배치', () => {
  test('순번 줄은 제목 바로 아래에 놓인다', async ({ openWatchPage }) => {
    const page = await openExpandedWidget(openWatchPage)

    const title = await page.locator(TITLE).boundingBox()
    const meta = await page.locator(META).boundingBox()
    const controls = await page.locator(CONTROLS).boundingBox()
    expect(meta.y).toBeGreaterThanOrEqual(title.y + title.height - 1)
    expect(meta.y - (title.y + title.height)).toBeLessThanOrEqual(TOLERANCE)
    expect(Math.abs(meta.x - title.x)).toBeLessThanOrEqual(1)
    expect(meta.y + meta.height).toBeLessThanOrEqual(controls.y)
  })

  test('목록 보기 버튼은 조작 버튼과 같은 줄의 오른쪽 끝에 놓인다', async ({ openWatchPage }) => {
    const page = await openExpandedWidget(openWatchPage)

    const card = await page.locator(CARD).boundingBox()
    const controls = await page.locator(CONTROLS).boundingBox()
    const jump = await page.locator(JUMP).boundingBox()
    const controlsMiddle = controls.y + controls.height / 2
    expect(Math.abs(jump.y + jump.height / 2 - controlsMiddle)).toBeLessThanOrEqual(TOLERANCE)
    expect(jump.x).toBeGreaterThan(controls.x + controls.width)
    expect(card.x + card.width - (jump.x + jump.width)).toBeLessThanOrEqual(16)
  })
})

async function openExpandedWidget(openWatchPage) {
  const { page } = await openWatchPage({ commentTexts: [TIMELINE_COMMENT] })
  await page.locator('.timeline-skip-load-button').first().click()
  await expect(page.locator('.timeline-skip-row').first()).toBeVisible()
  await page.locator(ICON).click()
  await expect(page.locator(META)).toBeVisible()

  return page
}
