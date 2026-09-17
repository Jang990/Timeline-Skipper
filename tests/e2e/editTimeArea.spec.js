import { test, expect } from '../fixtures/extensionContext.js'

// 둘째 곡(05:00)을 고친다. 픽스처 영상은 1800초라 바가 덮는 시간은 270~630초다.
const TIMELINE_COMMENT = ['00:00 첫 곡', '05:00 둘째 곡', '10:00 셋째 곡'].join('\n')

const PANEL = '#timeline-skip-panel'
const BAR = `${PANEL} .timeline-skip-range-bar`
const FROM_LABEL = `${PANEL} .timeline-skip-range-from`
const TO_LABEL = `${PANEL} .timeline-skip-range-to`
const PLAYHEAD = `${PANEL} .timeline-skip-range-playhead`
const START_INPUT = `${PANEL} .timeline-skip-time-input`
const END_INPUT = `${PANEL} .timeline-skip-end-input`

// 픽셀 경계는 소수로 떨어진다. 1px 안의 차이는 같은 자리로 본다.
const TOLERANCE = 1

test.describe('편집 시트의 시간 영역 배치', () => {
  test('바의 양 끝 시각은 바 아래에 놓인다', async ({ openWatchPage }) => {
    const page = await openTimeline(openWatchPage)

    await openEditRow(page, '둘째 곡')

    const bar = await page.locator(BAR).boundingBox()
    const from = await page.locator(FROM_LABEL).boundingBox()
    const to = await page.locator(TO_LABEL).boundingBox()
    expect(from.y).toBeGreaterThanOrEqual(bar.y + bar.height - TOLERANCE)
    expect(to.y).toBeGreaterThanOrEqual(bar.y + bar.height - TOLERANCE)
    expect(from.x).toBeLessThan(to.x)
  })

  test('시작 칸과 끝 칸은 한 줄에 나란히 놓인다', async ({ openWatchPage }) => {
    const page = await openTimeline(openWatchPage)

    await openEditRow(page, '둘째 곡')

    const start = await page.locator(START_INPUT).boundingBox()
    const end = await page.locator(END_INPUT).boundingBox()
    expect(Math.abs(start.y - end.y)).toBeLessThanOrEqual(TOLERANCE)
    expect(end.x).toBeGreaterThanOrEqual(start.x + start.width)
  })

  // 머리는 가상 요소라 jsdom이 계산하지 않는다.
  test('재생 위치 선의 머리는 선보다 넓고 바 위로 올라와 있다', async ({ openWatchPage }) => {
    const page = await openTimeline(openWatchPage)
    await pauseAt(page, 400)

    await openEditRow(page, '둘째 곡')

    const head = await page.locator(PLAYHEAD).evaluate((playhead) => {
      const style = getComputedStyle(playhead, '::before')

      return { content: style.content, width: parseFloat(style.width), lineWidth: playhead.getBoundingClientRect().width, top: parseFloat(style.top) }
    })
    expect(head.content).not.toBe('none')
    expect(head.width).toBeGreaterThan(head.lineWidth)
    expect(head.top).toBeLessThan(0)
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

// 재생 위치가 범위 밖이면 선이 흐려질 뿐 머리는 그대로다. 그래도 범위 안에 멈춰 두어 선이 보이게 한다.
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
