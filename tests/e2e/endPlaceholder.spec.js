import { test, expect } from '../fixtures/extensionContext.js'

// 둘째 곡은 뒤에 트랙이 있고 셋째 곡은 마지막 트랙이다. 안내 글씨가 갈리는 두 경우가 한 목록에 있다.
const TIMELINE_COMMENT = ['00:00 첫 곡', '05:00 둘째 곡', '10:00 셋째 곡'].join('\n')

const PANEL = '#timeline-skip-panel'
const END_INPUT = `${PANEL} .timeline-skip-end-input`

test.describe('끝 칸의 안내 글씨', () => {
  test('끝을 정하지 않은 트랙은 끝 칸의 안내 글씨가 다음 트랙 시작 시각이다', async ({ openWatchPage }) => {
    const page = await openTimeline(openWatchPage)

    await openEditRow(page, '둘째 곡')

    await expect(page.locator(END_INPUT)).toHaveAttribute('placeholder', '10:00')
  })

  test('끝을 정해 둔 트랙도 안내 글씨는 다음 트랙 시작 시각이다', async ({ openWatchPage }) => {
    const page = await openTimeline(openWatchPage)
    await openEditRow(page, '첫 곡')
    await page.locator(END_INPUT).fill('3:00')
    await page.locator(`${PANEL} button[aria-label="저장"]`).click()
    await expect(page.locator(`${PANEL} .timeline-skip-time`).first()).toHaveText('00:00 ~ 03:00')

    await openEditRow(page, '첫 곡')

    await expect(page.locator(END_INPUT)).toHaveAttribute('placeholder', '05:00')
  })

  test('마지막 트랙은 끝 칸의 안내 글씨가 영상 끝 시각이다', async ({ openWatchPage }) => {
    const page = await openTimeline(openWatchPage)
    await waitForDuration(page)

    await openEditRow(page, '셋째 곡')

    await expect(page.locator(END_INPUT)).toHaveAttribute('placeholder', '30:00')
  })

  test('영상 길이를 모르면 마지막 트랙의 안내 글씨는 끝까지다', async ({ openWatchPage }) => {
    const page = await openTimeline(openWatchPage, { videoSourceUrl: null })

    await openEditRow(page, '셋째 곡')

    await expect(page.locator(END_INPUT)).toHaveAttribute('placeholder', '끝까지')
  })

  test('추가 행의 끝 칸은 재생 위치 다음 트랙의 시작 시각을 안내한다', async ({ openWatchPage }) => {
    const page = await openTimeline(openWatchPage)
    await pauseAt(page, 120)

    await page.locator(`${PANEL} .timeline-skip-add`).click()

    await expect(page.locator(END_INPUT)).toHaveAttribute('placeholder', '05:00')
  })
})

async function openTimeline(openWatchPage, fixture = {}) {
  const { page } = await openWatchPage({ commentTexts: [TIMELINE_COMMENT], ...fixture })
  await page.locator('.timeline-skip-load-button').first().click()
  await expect(page.locator('.timeline-skip-row').first()).toBeVisible()

  return page
}

async function openEditRow(page, title) {
  await page.locator(`${PANEL} button[aria-label="${title} 수정"]`).click()
  await expect(page.locator(END_INPUT)).toBeVisible()
}

// 안내 글씨는 편집을 열 때 정해진다. 영상 길이를 읽기 전에 열면 마지막 트랙은 끝을 모른다.
async function waitForDuration(page) {
  await expect.poll(() => page.evaluate(() => document.querySelector('video').duration)).toBe(1800)
}

// 재생 중이면 초가 흘러 추가 행이 잡는 시각이 흔들린다. 멈춘 채로 옮겨 둔다.
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
