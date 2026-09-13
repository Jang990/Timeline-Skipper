import { test, expect } from '../fixtures/extensionContext.js'

// 둘째 곡(05:00)을 고친다. 픽스처 영상은 1800초라 끝 쪽 제한에는 닿지 않는다.
const TIMELINE_COMMENT = ['00:00 첫 곡', '05:00 둘째 곡', '10:00 셋째 곡'].join('\n')

const PANEL = '#timeline-skip-panel'
const PLAYBACK_ROW = `${PANEL} .timeline-skip-playback-row`
const POSITION = `${PANEL} .timeline-skip-playback-position`
const START_INPUT = `${PANEL} .timeline-skip-time-input`
const END_INPUT = `${PANEL} .timeline-skip-end-input`
const TITLE_INPUT = `${PANEL} .timeline-skip-title-input`

test.describe('재생 위치 이동 버튼', () => {
  test('편집 행을 열면 재생 위치를 옮기는 버튼 네 개와 재생 위치가 한 줄에 보인다', async ({ openWatchPage }) => {
    const page = await openTimeline(openWatchPage)
    await pauseAt(page, 400)

    await openEditRow(page, '둘째 곡')

    const row = page.locator(PLAYBACK_ROW)
    for (const stepLabel of ['10초 되감기', '1초 되감기', '1초 빨리 감기', '10초 빨리 감기']) {
      await expect(row.locator(`button[aria-label="${stepLabel}"]`)).toBeVisible()
    }
    await expect(row.locator('.timeline-skip-playback-position')).toHaveText('06:40')
  })

  test('+10s를 누르면 재생 위치가 10초 늦어진다', async ({ openWatchPage }) => {
    const page = await openTimeline(openWatchPage)
    await pauseAt(page, 400)
    await openEditRow(page, '둘째 곡')

    await button(page, '10초 빨리 감기').click()

    await expect.poll(() => readCurrentTime(page)).toBe(410)
  })

  test('−1s를 누르면 재생 위치가 1초 당겨진다', async ({ openWatchPage }) => {
    const page = await openTimeline(openWatchPage)
    await pauseAt(page, 400)
    await openEditRow(page, '둘째 곡')

    await button(page, '1초 되감기').click()

    await expect.poll(() => readCurrentTime(page)).toBe(399)
  })

  test('±를 눌러도 시작 칸과 끝 칸의 값은 그대로다', async ({ openWatchPage }) => {
    const page = await openTimeline(openWatchPage)
    await pauseAt(page, 400)
    await openEditRow(page, '둘째 곡')

    await button(page, '10초 빨리 감기').click()

    await expect.poll(() => readCurrentTime(page)).toBe(410)
    await expect(page.locator(START_INPUT)).toHaveValue('05:00')
    await expect(page.locator(END_INPUT)).toHaveValue('')
  })

  test('±를 눌러도 편집 칸에 입력하던 글자는 그대로다', async ({ openWatchPage }) => {
    const page = await openTimeline(openWatchPage)
    await pauseAt(page, 400)
    await openEditRow(page, '둘째 곡')
    await page.locator(TITLE_INPUT).fill('고치던 제목')

    await button(page, '10초 빨리 감기').click()

    await expect(page.locator(POSITION)).toHaveText('06:50')
    await expect(page.locator(TITLE_INPUT)).toHaveValue('고치던 제목')
  })

  test('가운데 재생 위치는 영상을 옮기면 따라 바뀐다', async ({ openWatchPage }) => {
    const page = await openTimeline(openWatchPage)
    await pauseAt(page, 400)
    await openEditRow(page, '둘째 곡')

    await moveVideoTo(page, 500)

    await expect(page.locator(POSITION)).toHaveText('08:20')
  })

  test('±로 옮긴 뒤 [지금으로]를 누르면 옮긴 시각이 칸에 들어간다', async ({ openWatchPage }) => {
    const page = await openTimeline(openWatchPage)
    await pauseAt(page, 400)
    await openEditRow(page, '둘째 곡')
    await button(page, '1초 되감기').click()
    await expect.poll(() => readCurrentTime(page)).toBe(399)

    await button(page, '시작을 지금 위치로').click()

    await expect(page.locator(START_INPUT)).toHaveValue('06:39')
  })

  test('추가 행에서도 ±로 재생 위치를 옮길 수 있다', async ({ openWatchPage }) => {
    const page = await openTimeline(openWatchPage)
    await pauseAt(page, 120)
    await page.locator(`${PANEL} .timeline-skip-add`).click()

    await button(page, '10초 빨리 감기').click()

    await expect.poll(() => readCurrentTime(page)).toBe(130)
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
