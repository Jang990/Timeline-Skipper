import { test, expect } from '../fixtures/extensionContext.js'

// 주로 둘째 곡(05:00)을 고친다. 앞뒤에 트랙이 있어야 이웃 경계에서 멈추는 것이 보인다.
const TIMELINE_COMMENT = ['00:00 첫 곡', '05:00 둘째 곡', '10:00 셋째 곡'].join('\n')

const PANEL = '#timeline-skip-panel'
const ROW_TIME = `${PANEL} .timeline-skip-time`
const START_INPUT = `${PANEL} .timeline-skip-time-input`
const END_INPUT = `${PANEL} .timeline-skip-end-input`
const STEP_ROW = `${PANEL} .timeline-skip-step-row`

test.describe('시각 조정 버튼', () => {
  test('편집 행을 열면 시작과 끝 줄에는 칸과 [지금으로]만 있다', async ({ openWatchPage }) => {
    const page = await openTimeline(openWatchPage)

    await openEditRow(page, '둘째 곡')

    for (const field of ['시작', '끝']) {
      await expect(button(page, `${field}을 지금 위치로`)).toBeVisible()
    }
    for (const row of await page.locator(STEP_ROW).all()) {
      await expect(row.locator('button')).toHaveCount(1)
    }
  })

  test('조정 버튼에 1분 단위는 없다', async ({ openWatchPage }) => {
    const page = await openTimeline(openWatchPage)

    await openEditRow(page, '둘째 곡')

    await expect(page.locator(`${PANEL} button[aria-label*="1분"]`)).toHaveCount(0)
  })

  test('앞 트랙 시작에서 시작의 [지금으로]를 누르면 앞 트랙 시작 1초 뒤가 들어간다', async ({ openWatchPage }) => {
    const page = await openTimeline(openWatchPage)
    await openEditRow(page, '둘째 곡')
    await pauseAt(page, 0)

    await button(page, '시작을 지금 위치로').click()

    await expect(page.locator(START_INPUT)).toHaveValue('00:01')
  })

  test('다음 트랙 시작에서 끝의 [지금으로]를 누르면 끝 칸이 비워진다', async ({ openWatchPage }) => {
    const page = await openTimeline(openWatchPage)
    await openEditRow(page, '둘째 곡')
    await page.locator(END_INPUT).fill('09:50')
    await pauseAt(page, 600)

    await button(page, '끝을 지금 위치로').click()

    await expect(page.locator(END_INPUT)).toHaveValue('')
  })

  test('시작의 [지금으로]를 누르면 지금 재생 위치가 시작 칸에 들어간다', async ({ openWatchPage }) => {
    const page = await openTimeline(openWatchPage)
    await openEditRow(page, '둘째 곡')
    await pauseAt(page, 400)

    await button(page, '시작을 지금 위치로').click()

    await expect(page.locator(START_INPUT)).toHaveValue('06:40')
  })

  test('끝의 [지금으로]를 누르면 지금 재생 위치가 끝 칸에 들어간다', async ({ openWatchPage }) => {
    const page = await openTimeline(openWatchPage)
    await openEditRow(page, '둘째 곡')
    await pauseAt(page, 450)

    await button(page, '끝을 지금 위치로').click()

    await expect(page.locator(END_INPUT)).toHaveValue('07:30')
  })

  test('[지금으로]로 넣은 값을 ✓로 저장하면 목록에 반영된다', async ({ openWatchPage }) => {
    const page = await openTimeline(openWatchPage)
    await openEditRow(page, '둘째 곡')
    await pauseAt(page, 310)
    await button(page, '시작을 지금 위치로').click()

    await button(page, '저장').click()

    await expect(page.locator(ROW_TIME).nth(1)).toHaveText('05:10')
  })

  test('직접 추가 행에서도 [지금으로]로 시각을 넣을 수 있다', async ({ openWatchPage }) => {
    const page = await openTimeline(openWatchPage)
    await pauseAt(page, 120)
    await page.locator(`${PANEL} .timeline-skip-add`).click()
    await pauseAt(page, 130)

    await button(page, '시작을 지금 위치로').click()

    await expect(page.locator(START_INPUT)).toHaveValue('02:10')
  })

  test('시작 칸에 직접 입력하고 Enter를 누르면 저장된다', async ({ openWatchPage }) => {
    const page = await openTimeline(openWatchPage)
    await openEditRow(page, '둘째 곡')
    await page.locator(START_INPUT).fill('5:20')

    await page.locator(START_INPUT).press('Enter')

    await expect(page.locator(ROW_TIME).nth(1)).toHaveText('05:20')
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
