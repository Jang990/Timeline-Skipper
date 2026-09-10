import { test, expect } from '../fixtures/extensionContext.js'

// 둘째 곡(05:00~10:00)을 해제하고 그 안으로 재생을 옮긴다. 건너뛰면 셋째 곡 시작(600초)으로 간다.
const TIMELINE_COMMENT = ['00:00 첫 곡', '05:00 둘째 곡', '10:00 셋째 곡'].join('\n')

const PANEL = '#timeline-skip-panel'
const END_INPUT = `${PANEL} .timeline-skip-end-input`

test.describe('편집 중의 재생', () => {
  test('편집 중이 아니면 해제된 트랙으로 옮긴 재생은 다음 트랙으로 넘어간다', async ({ openWatchPage }) => {
    const page = await openTimeline(openWatchPage)
    await disableTrack(page, '둘째 곡')

    const settledSeconds = await seekAndSettle(page, 360)

    expect(settledSeconds).toBe(600)
  })

  test('편집 중에는 해제된 트랙으로 옮겨도 그 자리에 머문다', async ({ openWatchPage }) => {
    const page = await openTimeline(openWatchPage)
    await disableTrack(page, '둘째 곡')
    await openEditRow(page, '둘째 곡')

    const settledSeconds = await seekAndSettle(page, 360)

    expect(settledSeconds).toBe(360)
  })

  test('편집 중이 아니면 반복이 켜진 채 마지막 트랙이 끝나면 첫 트랙으로 되감는다', async ({ openWatchPage }) => {
    const page = await openTimeline(openWatchPage)
    await endLastTrackAt(page, '12:00')
    await button(page, '반복 켜기').click()

    const settledSeconds = await seekAndSettle(page, 1300)

    expect(settledSeconds).toBe(0)
  })

  test('편집 중에는 반복이 켜져 있어도 마지막 트랙 끝에서 되감지 않는다', async ({ openWatchPage }) => {
    const page = await openTimeline(openWatchPage)
    await endLastTrackAt(page, '12:00')
    await button(page, '반복 켜기').click()
    await openEditRow(page, '셋째 곡')

    const settledSeconds = await seekAndSettle(page, 1300)

    expect(settledSeconds).toBe(1300)
  })

  test('직접 추가 행이 열려 있을 때도 해제된 트랙에서 머문다', async ({ openWatchPage }) => {
    const page = await openTimeline(openWatchPage)
    await disableTrack(page, '둘째 곡')
    await page.locator(`${PANEL} .timeline-skip-add`).click()
    await expect(page.locator(END_INPUT)).toBeVisible()

    const settledSeconds = await seekAndSettle(page, 360)

    expect(settledSeconds).toBe(360)
  })

  test('편집을 저장하면 다시 해제된 트랙을 건너뛴다', async ({ openWatchPage }) => {
    const page = await openTimeline(openWatchPage)
    await disableTrack(page, '둘째 곡')
    await openEditRow(page, '둘째 곡')
    await button(page, '저장').click()
    await expect(page.locator(END_INPUT)).toHaveCount(0)

    const settledSeconds = await seekAndSettle(page, 360)

    expect(settledSeconds).toBe(600)
  })

  test('편집을 취소하면 다시 해제된 트랙을 건너뛴다', async ({ openWatchPage }) => {
    const page = await openTimeline(openWatchPage)
    await disableTrack(page, '둘째 곡')
    await openEditRow(page, '둘째 곡')
    await button(page, '취소').click()
    await expect(page.locator(END_INPUT)).toHaveCount(0)

    const settledSeconds = await seekAndSettle(page, 360)

    expect(settledSeconds).toBe(600)
  })
})

// 영상 길이를 읽기 전에는 옮긴 위치가 무시된다. 불러오기와 함께 기다려 둔다.
async function openTimeline(openWatchPage) {
  const { page } = await openWatchPage({ commentTexts: [TIMELINE_COMMENT] })
  await page.locator('.timeline-skip-load-button').first().click()
  await expect(page.locator('.timeline-skip-row').first()).toBeVisible()
  await expect
    .poll(() => page.evaluate(() => document.querySelector('video').readyState))
    .toBeGreaterThanOrEqual(1)

  return page
}

async function disableTrack(page, title) {
  await page.locator(`${PANEL} input[aria-label="${title} 재생"]`).uncheck()
}

async function openEditRow(page, title) {
  await button(page, `${title} 수정`).click()
  await expect(page.locator(END_INPUT)).toBeVisible()
}

// 끝 뒤가 해제된 트랙도 빈 구간도 아니게 해 두어야, 건너뛰기가 끼어들지 않고 반복만 본다.
async function endLastTrackAt(page, endText) {
  await openEditRow(page, '셋째 곡')
  await page.locator(END_INPUT).fill(endText)
  await button(page, '저장').click()
  await expect(page.locator(`${PANEL} .timeline-skip-time`).last()).toHaveText(`10:00 ~ ${endText}`)
}

function button(page, ariaLabel) {
  return page.locator(`${PANEL} button[aria-label="${ariaLabel}"]`)
}

// 확장은 timeupdate를 document 캡처 단계에서 받아 영상 요소보다 먼저 처리한다.
// 영상 요소에 붙인 리스너가 불릴 때면 확장은 이미 옮길지 말지 정했고, 옮겼다면 currentTime에 드러난다.
function seekAndSettle(page, timestampSeconds) {
  return page.evaluate(
    (seconds) =>
      new Promise((resolve) => {
        const video = document.querySelector('video')
        video.addEventListener('timeupdate', () => resolve(video.currentTime), { once: true })
        video.currentTime = seconds
      }),
    timestampSeconds
  )
}
