import { test, expect } from '../fixtures/extensionContext.js'

// 둘째 곡(05:00)을 고친다. 픽스처 영상은 1800초라 바가 덮는 시간은 270~630초다.
const TIMELINE_COMMENT = ['00:00 첫 곡', '05:00 둘째 곡', '10:00 셋째 곡'].join('\n')

const PANEL = '#timeline-skip-panel'
const BAR = `${PANEL} .timeline-skip-range-bar`
const PLAYHEAD = `${PANEL} .timeline-skip-range-playhead`
const START_INPUT = `${PANEL} .timeline-skip-time-input`

test.describe('바 위의 재생 위치', () => {
  test('재생 위치 표시가 지금 재생 위치의 자리에 놓인다', async ({ openWatchPage }) => {
    const page = await openTimeline(openWatchPage)
    await pauseAt(page, 400)

    await openEditRow(page, '둘째 곡')

    expect(await readPlayheadRatio(page)).toBeCloseTo(0.3611, 2)
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

// 표시의 가운데가 바의 어디에 있는지를 비율로 읽는다. 표시에 폭이 있어 왼쪽 끝으로는 재지 않는다.
async function readPlayheadRatio(page) {
  const bar = await page.locator(BAR).boundingBox()
  const playhead = await page.locator(PLAYHEAD).boundingBox()

  return (playhead.x + playhead.width / 2 - bar.x) / bar.width
}

// 재생 중이면 초가 흘러 자리가 흔들린다. 멈춘 채로 옮겨 둔다.
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
