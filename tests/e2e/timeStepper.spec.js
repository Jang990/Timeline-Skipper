import { test, expect } from '../fixtures/extensionContext.js'

// 주로 둘째 곡(05:00)을 고친다. 앞뒤에 트랙이 있어야 이웃 경계에서 멈추는 것이 보인다.
const TIMELINE_COMMENT = ['00:00 첫 곡', '05:00 둘째 곡', '10:00 셋째 곡'].join('\n')

const PANEL = '#timeline-skip-panel'
const ROW_TIME = `${PANEL} .timeline-skip-time`
const START_INPUT = `${PANEL} .timeline-skip-time-input`

test.describe('시각 조정 버튼', () => {
  test('[지금으로]로 넣은 값을 ✓로 저장하면 목록에 반영된다', async ({ openWatchPage }) => {
    const page = await openTimeline(openWatchPage)
    await openEditRow(page, '둘째 곡')
    await pauseAt(page, 310)
    await button(page, '시작을 지금 위치로').click()

    await button(page, '저장').click()

    await expect(page.locator(ROW_TIME).nth(1)).toHaveText('05:10')
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

function button(page, ariaLabel) {
  return page.locator(`${PANEL} button[aria-label="${ariaLabel}"]`)
}

// 재생 중이면 초가 흘러 칸에 들어갈 값이 흔들린다. 멈춘 채로 옮겨 둔다.
async function pauseAt(page, timestampSeconds) {
  await expect
    .poll(() => page.evaluate(() => document.querySelector('video').readyState))
    .toBeGreaterThanOrEqual(1)

  await page.evaluate((seconds) => {
    const video = document.querySelector('video')
    video.pause()
    video.currentTime = seconds
  }, timestampSeconds)
}
