import { test, expect } from '../fixtures/extensionContext.js'

// 주로 둘째 곡(05:00)을 고친다. 앞뒤에 트랙이 있어야 이웃 경계에서 멈추는 것이 보인다.
const TIMELINE_COMMENT = ['00:00 첫 곡', '05:00 둘째 곡', '10:00 셋째 곡'].join('\n')

const PANEL = '#timeline-skip-panel'
const ROW_TIME = `${PANEL} .timeline-skip-time`
const START_INPUT = `${PANEL} .timeline-skip-time-input`
const END_INPUT = `${PANEL} .timeline-skip-end-input`
const STEP_LABELS = ['10초 당기기', '1초 당기기', '1초 늦추기', '10초 늦추기']

test.describe('시각 조정 버튼', () => {
  test('편집 행을 열면 시작과 끝을 조정하는 버튼이 보인다', async ({ openWatchPage }) => {
    const page = await openTimeline(openWatchPage)

    await openEditRow(page, '둘째 곡')

    for (const field of ['시작', '끝']) {
      for (const stepLabel of STEP_LABELS) {
        await expect(button(page, `${field} ${stepLabel}`)).toBeVisible()
      }

      await expect(button(page, `${field}을 지금 위치로`)).toBeVisible()
    }
  })

  test('시작의 +10s를 누르면 시작 칸이 10초 늦춰진다', async ({ openWatchPage }) => {
    const page = await openTimeline(openWatchPage)
    await openEditRow(page, '둘째 곡')

    await button(page, '시작 10초 늦추기').click()

    await expect(page.locator(START_INPUT)).toHaveValue('05:10')
  })

  test('조정 버튼에 1분 단위는 없다', async ({ openWatchPage }) => {
    const page = await openTimeline(openWatchPage)

    await openEditRow(page, '둘째 곡')

    await expect(page.locator(`${PANEL} button[aria-label*="1분"]`)).toHaveCount(0)
  })

  test('시작의 −10s를 여러 번 누르면 앞 트랙 시작 1초 뒤에서 멈춘다', async ({ openWatchPage }) => {
    const page = await openTimeline(openWatchPage)
    await openEditRow(page, '둘째 곡')
    await page.locator(START_INPUT).fill('0:15')

    await clickRepeatedly(button(page, '시작 10초 당기기'), 2)

    await expect(page.locator(START_INPUT)).toHaveValue('00:01')
  })

  test('끝 칸이 비어 있을 때 끝의 −10s를 누르면 다음 트랙 시작 10초 전이 들어간다', async ({ openWatchPage }) => {
    const page = await openTimeline(openWatchPage)
    await openEditRow(page, '둘째 곡')

    await button(page, '끝 10초 당기기').click()

    await expect(page.locator(END_INPUT)).toHaveValue('09:50')
  })

  test('끝을 다음 트랙 시작까지 늘리면 끝 칸이 비워진다', async ({ openWatchPage }) => {
    const page = await openTimeline(openWatchPage)
    await openEditRow(page, '둘째 곡')
    await button(page, '끝 10초 당기기').click()
    await expect(page.locator(END_INPUT)).toHaveValue('09:50')

    await button(page, '끝 10초 늦추기').click()

    await expect(page.locator(END_INPUT)).toHaveValue('')
  })

  test('시작의 ⏱를 누르면 지금 재생 위치가 시작 칸에 들어간다', async ({ openWatchPage }) => {
    const page = await openTimeline(openWatchPage)
    await openEditRow(page, '둘째 곡')
    await pauseAt(page, 400)

    await button(page, '시작을 지금 위치로').click()

    await expect(page.locator(START_INPUT)).toHaveValue('06:40')
  })

  test('끝의 ⏱를 누르면 지금 재생 위치가 끝 칸에 들어간다', async ({ openWatchPage }) => {
    const page = await openTimeline(openWatchPage)
    await openEditRow(page, '둘째 곡')
    await pauseAt(page, 450)

    await button(page, '끝을 지금 위치로').click()

    await expect(page.locator(END_INPUT)).toHaveValue('07:30')
  })

  test('버튼으로 바꾼 값을 ✓로 저장하면 목록에 반영된다', async ({ openWatchPage }) => {
    const page = await openTimeline(openWatchPage)
    await openEditRow(page, '둘째 곡')
    await button(page, '시작 10초 늦추기').click()

    await button(page, '저장').click()

    await expect(page.locator(ROW_TIME).nth(1)).toHaveText('05:10')
  })

  test('직접 추가 행에서도 버튼으로 시각을 조정할 수 있다', async ({ openWatchPage }) => {
    const page = await openTimeline(openWatchPage)
    await pauseAt(page, 120)
    await page.locator(`${PANEL} .timeline-skip-add`).click()

    await button(page, '시작 10초 늦추기').click()

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

async function clickRepeatedly(locator, times) {
  for (let clickCount = 0; clickCount < times; clickCount += 1) {
    await locator.click()
  }
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
