import { test, expect } from '../fixtures/extensionContext.js'

// 둘째 곡(05:00)을 고친다. 픽스처 영상은 1800초라 끝 쪽 제한에는 닿지 않는다.
const TIMELINE_COMMENT = ['00:00 첫 곡', '05:00 둘째 곡', '10:00 셋째 곡'].join('\n')

const PANEL = '#timeline-skip-panel'
const START_INPUT = `${PANEL} .timeline-skip-time-input`

test.describe('재생 위치 이동 버튼', () => {
  test('+10s를 누르면 재생 위치가 10초 늦어진다', async ({ openWatchPage }) => {
    const page = await openTimeline(openWatchPage)
    await pauseAt(page, 400)
    await openEditRow(page, '둘째 곡')

    await button(page, '10초 빨리 감기').click()

    await expect.poll(() => readCurrentTime(page)).toBe(410)
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

function readCurrentTime(page) {
  return page.evaluate(() => document.querySelector('video').currentTime)
}

// 재생 중이면 초가 흘러 옮긴 결과가 흔들린다. 멈춘 채로 옮겨 둔다.
async function pauseAt(page, timestampSeconds) {
  await expect
    .poll(() => page.evaluate(() => document.querySelector('video').readyState))
    .toBeGreaterThanOrEqual(1)

  await moveVideoTo(page, timestampSeconds)
}

function moveVideoTo(page, timestampSeconds) {
  return page.evaluate((seconds) => {
    const video = document.querySelector('video')
    video.pause()
    video.currentTime = seconds
  }, timestampSeconds)
}
