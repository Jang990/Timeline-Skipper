import { test, expect } from '../fixtures/extensionContext.js'

const TIMELINE_COMMENT = ['00:00 첫 곡', '05:00 둘째 곡', '10:00 셋째 곡'].join('\n')

const PANEL = '#timeline-skip-panel'
const START_INPUT = `${PANEL} .timeline-skip-time-input`
const STEP_BUTTON = `${PANEL} .timeline-skip-step`

// 픽셀 경계는 소수로 떨어진다. 1px 안의 차이는 같은 자리로 본다.
const TOLERANCE = 1

test.describe('편집 시트의 시간 영역 배치', () => {
  test('시각 칸과 세 버튼은 한 줄에 나란히 놓인다', async ({ openWatchPage }) => {
    const page = await openTimeline(openWatchPage)

    await openEditRow(page, '둘째 곡')

    const start = await page.locator(START_INPUT).boundingBox()
    const buttons = await page.locator(STEP_BUTTON).all()
    expect(buttons).toHaveLength(3)

    let leftEdge = start.x + start.width
    for (const button of buttons) {
      const box = await button.boundingBox()
      expect(Math.abs(box.y + box.height / 2 - (start.y + start.height / 2))).toBeLessThanOrEqual(start.height)
      expect(box.x).toBeGreaterThanOrEqual(leftEdge - TOLERANCE)
      leftEdge = box.x + box.width
    }
  })
})

async function openTimeline(openWatchPage) {
  const { page } = await openWatchPage({ commentTexts: [TIMELINE_COMMENT] })
  await page.locator('.timeline-skip-load-button').first().click()
  await expect(page.locator('.timeline-skip-row').first()).toBeVisible()

  return page
}

async function openEditRow(page, title) {
  await page.locator(`${PANEL} button[aria-label="${title} 수정"]`).click()
  await expect(page.locator(START_INPUT)).toBeVisible()
}
