import { test, expect } from '../fixtures/extensionContext.js'

// 둘째 곡(05:00~10:00)의 끝을 따라가게 한다. 그 안에서 재생 위치를 옮기며 끝 칸을 본다.
const TIMELINE_COMMENT = ['00:00 첫 곡', '05:00 둘째 곡', '10:00 셋째 곡'].join('\n')

const PANEL = '#timeline-skip-panel'
const END_INPUT = `${PANEL} .timeline-skip-end-input`
const FOLLOW_HINT = `${PANEL} .timeline-skip-follow-hint`

test.describe('끝 따라가기', () => {
  test('⏺를 누르면 끝 칸에 지금 재생 위치가 들어가고 따라가기가 켜진다', async ({ openWatchPage }) => {
    const page = await openTimeline(openWatchPage)
    await openEditRow(page, '둘째 곡')
    await seekAndSettle(page, 400)

    await followButton(page).click()

    await expect(page.locator(END_INPUT)).toHaveValue('06:40')
    await expect(followButton(page)).toHaveAttribute('aria-pressed', 'true')
    await expect(page.locator(FOLLOW_HINT)).toBeVisible()
  })

  test('따라가는 동안 재생 위치를 옮기면 끝 칸도 따라간다', async ({ openWatchPage }) => {
    const page = await openTimeline(openWatchPage)
    await openEditRow(page, '둘째 곡')
    await seekAndSettle(page, 400)
    await followButton(page).click()

    await seekAndSettle(page, 450)

    await expect(page.locator(END_INPUT)).toHaveValue('07:30')
  })

  test('재생 중에 영상을 멈추면 그 시각이 끝 칸에 남고 따라가기가 꺼진다', async ({ openWatchPage }) => {
    const page = await openTimeline(openWatchPage)
    await openEditRow(page, '둘째 곡')
    await seekAndSettle(page, 400)
    await followButton(page).click()
    await playUntilPast(page, 401)

    const pausedSeconds = await pause(page)

    await expect(followButton(page)).toHaveAttribute('aria-pressed', 'false')
    await expect(page.locator(END_INPUT)).toHaveValue(toClock(pausedSeconds))
  })

  test('끝 줄의 조정 버튼이나 ⏱를 누르면 따라가기가 꺼진다', async ({ openWatchPage }) => {
    const page = await openTimeline(openWatchPage)
    await openEditRow(page, '둘째 곡')
    await seekAndSettle(page, 400)

    for (const ariaLabel of ['끝 1초 당기기', '끝을 지금 위치로']) {
      await followButton(page).click()
      await button(page, ariaLabel).click()

      await expect(followButton(page)).toHaveAttribute('aria-pressed', 'false')
    }
  })

  test('⏺를 다시 누르면 따라가기가 꺼진다', async ({ openWatchPage }) => {
    const page = await openTimeline(openWatchPage)
    await openEditRow(page, '둘째 곡')
    await followButton(page).click()

    await followButton(page).click()

    await expect(followButton(page)).toHaveAttribute('aria-pressed', 'false')
    await expect(page.locator(FOLLOW_HINT)).toBeHidden()
  })

  test('직접 추가 행에서도 끝 칸이 재생 위치를 따라간다', async ({ openWatchPage }) => {
    const page = await openTimeline(openWatchPage)
    await seekAndSettle(page, 120)
    await page.locator(`${PANEL} .timeline-skip-add`).click()
    await followButton(page).click()

    await seekAndSettle(page, 200)

    await expect(page.locator(END_INPUT)).toHaveValue('03:20')
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

async function openEditRow(page, title) {
  await button(page, `${title} 수정`).click()
  await expect(page.locator(END_INPUT)).toBeVisible()
}

function button(page, ariaLabel) {
  return page.locator(`${PANEL} button[aria-label="${ariaLabel}"]`)
}

function followButton(page) {
  return button(page, '끝 따라가기')
}

// 확장은 timeupdate를 document 캡처 단계에서 받아 영상 요소보다 먼저 처리한다.
// 영상 요소에 붙인 리스너가 불릴 때면 확장은 이미 그 위치를 반영했다.
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

async function playUntilPast(page, timestampSeconds) {
  await page.evaluate(() => document.querySelector('video').play())
  await expect
    .poll(() => page.evaluate(() => document.querySelector('video').currentTime))
    .toBeGreaterThan(timestampSeconds)
}

function pause(page) {
  return page.evaluate(() => {
    const video = document.querySelector('video')
    video.pause()

    return video.currentTime
  })
}

// 멈춘 시각은 재생이 흐른 만큼이라 미리 알 수 없다. 멈춘 뒤 읽은 값에서 기대값을 만든다.
function toClock(totalSeconds) {
  const wholeSeconds = Math.floor(totalSeconds)
  const pad = (value) => String(value).padStart(2, '0')

  return `${pad(Math.floor(wholeSeconds / 60))}:${pad(wholeSeconds % 60)}`
}
