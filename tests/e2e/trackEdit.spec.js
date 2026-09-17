import { test, expect } from '../fixtures/extensionContext.js'

// 첫 곡은 0초에서 시작한다. 끝을 당겼을 때 그 뒤가 빈 구간이 되는 것을 가장 짧게 보여준다.
const TIMELINE_COMMENT = ['00:00 첫 곡', '05:00 둘째 곡', '10:00 셋째 곡'].join('\n')

const PANEL = '#timeline-skip-panel'
const ROW_TIME = `${PANEL} .timeline-skip-time`
const END_INPUT = `${PANEL} .timeline-skip-end-input`
const SAVE_BUTTON = `${PANEL} button[aria-label="저장"]`

test.describe('끝 시각 편집', () => {
  test('끝 시각을 넣으면 목록에 구간으로 보인다', async ({ openWatchPage }) => {
    const { page } = await openWatchPage({ commentTexts: [TIMELINE_COMMENT] })
    await loadTimeline(page)

    await saveEnd(page, '첫 곡', '3:00')

    await expect(page.locator(ROW_TIME).first()).toHaveText('00:00 ~ 03:00')
  })
})

async function loadTimeline(page) {
  await page.locator('.timeline-skip-load-button').first().click()
  await expect(page.locator('.timeline-skip-row').first()).toBeVisible()
}

async function openEditRow(page, title) {
  await page.locator(`${PANEL} button[aria-label="${title} 수정"]`).click()
  await expect(page.locator(END_INPUT)).toBeVisible()
}

async function saveEnd(page, title, endText) {
  await openEditRow(page, title)
  await page.locator(END_INPUT).fill(endText)
  await page.locator(SAVE_BUTTON).click()
}
