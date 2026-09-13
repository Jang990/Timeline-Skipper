import { test, expect } from '../fixtures/extensionContext.js'

// 둘째 곡(05:00)을 고친다. 앞뒤에 트랙이 있어야 이웃 사이를 잡는 것이 보인다.
// 픽스처 영상은 1800초라, 이웃 사이 300~600초에 여유가 붙어 범위는 270~630초가 된다.
const TIMELINE_COMMENT = ['00:00 첫 곡', '05:00 둘째 곡', '10:00 셋째 곡'].join('\n')

const PANEL = '#timeline-skip-panel'
const RANGE = `${PANEL} .timeline-skip-range`
const BAR = `${PANEL} .timeline-skip-range-bar`
const FILL = `${PANEL} .timeline-skip-range-fill`
const FROM_LABEL = `${PANEL} .timeline-skip-range-from`
const TO_LABEL = `${PANEL} .timeline-skip-range-to`
const START_INPUT = `${PANEL} .timeline-skip-time-input`
const END_INPUT = `${PANEL} .timeline-skip-end-input`

test.describe('구간 바', () => {
  test('편집 행을 열면 구간 바가 보인다', async ({ openWatchPage }) => {
    const page = await openTimeline(openWatchPage)

    await openEditRow(page, '둘째 곡')

    await expect(page.locator(BAR)).toBeVisible()
  })

  test('바의 양 끝에 범위가 시작하고 끝나는 시각이 적혀 있다', async ({ openWatchPage }) => {
    const page = await openTimeline(openWatchPage)

    await openEditRow(page, '둘째 곡')

    await expect(page.locator(FROM_LABEL)).toHaveText('04:30')
    await expect(page.locator(TO_LABEL)).toHaveText('10:30')
  })

  test('칠해진 구간이 트랙의 시작과 끝 자리에 놓인다', async ({ openWatchPage }) => {
    const page = await openTimeline(openWatchPage)
    await openEditRow(page, '둘째 곡')

    const fill = await readFillRatios(page)

    expect(fill.left).toBeCloseTo(0.0833, 2)
    expect(fill.width).toBeCloseTo(0.8333, 2)
  })

  test('시작 칸을 고치면 칠해진 구간이 따라 움직인다', async ({ openWatchPage }) => {
    const page = await openTimeline(openWatchPage)
    await openEditRow(page, '둘째 곡')

    await page.locator(START_INPUT).fill('06:00')

    const fill = await readFillRatios(page)

    expect(fill.left).toBeCloseTo(0.25, 2)
    expect(fill.width).toBeCloseTo(0.6667, 2)
  })

  test('[지금으로]로 끝을 옮겨도 칠해진 구간이 따라 움직인다', async ({ openWatchPage }) => {
    const page = await openTimeline(openWatchPage)
    await openEditRow(page, '둘째 곡')
    await pauseAt(page, 590)

    await page.locator(`${PANEL} button[aria-label="끝을 지금 위치로"]`).click()

    const fill = await readFillRatios(page)

    expect(fill.width).toBeCloseTo(0.8056, 2)
  })

  test('끝 칸을 비우면 칠해진 구간이 다음 트랙이 시작하는 곳까지 늘어난다', async ({ openWatchPage }) => {
    const page = await openTimeline(openWatchPage)
    await openEditRow(page, '둘째 곡')
    await page.locator(END_INPUT).fill('06:00')

    await page.locator(END_INPUT).fill('')

    const fill = await readFillRatios(page)

    expect(fill.width).toBeCloseTo(0.8333, 2)
  })

  test('바의 범위는 시작 칸을 고쳐도 그대로다', async ({ openWatchPage }) => {
    const page = await openTimeline(openWatchPage)
    await openEditRow(page, '둘째 곡')

    await page.locator(START_INPUT).fill('06:00')

    await expect(page.locator(FROM_LABEL)).toHaveText('04:30')
    await expect(page.locator(TO_LABEL)).toHaveText('10:30')
  })

  test('추가 행에도 구간 바가 보인다', async ({ openWatchPage }) => {
    const page = await openTimeline(openWatchPage)
    await pauseAt(page, 100)

    await page.locator(`${PANEL} .timeline-skip-add`).click()

    await expect(page.locator(BAR)).toBeVisible()
    await expect(page.locator(FROM_LABEL)).toHaveText('01:20')
    await expect(page.locator(TO_LABEL)).toHaveText('05:20')
  })

  test('바를 눌러도 영상이 움직이지 않는다', async ({ openWatchPage }) => {
    const page = await openTimeline(openWatchPage)
    await openEditRow(page, '둘째 곡')
    await pauseAt(page, 100)

    await page.locator(BAR).click()

    expect(await readCurrentTime(page)).toBeCloseTo(100, 1)
  })

  test('편집을 닫으면 구간 바가 사라진다', async ({ openWatchPage }) => {
    const page = await openTimeline(openWatchPage)
    await openEditRow(page, '둘째 곡')

    await page.locator(`${PANEL} button[aria-label="취소"]`).click()

    await expect(page.locator(RANGE)).toHaveCount(0)
  })

  test('영상 길이를 모르면 구간 바가 없다', async ({ openWatchPage }) => {
    const page = await openTimeline(openWatchPage, { videoSourceUrl: null })

    await openEditRow(page, '둘째 곡')

    await expect(page.locator(RANGE)).toHaveCount(0)
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
  await expect(page.locator(START_INPUT)).toBeVisible()
}

// 칠해진 구간이 바의 어디에 놓였는지를 비율로 읽는다. 퍼센트 문자열의 자릿수에 매이지 않는다.
async function readFillRatios(page) {
  const bar = await page.locator(BAR).boundingBox()
  const fill = await page.locator(FILL).boundingBox()

  return { left: (fill.x - bar.x) / bar.width, width: fill.width / bar.width }
}

function readCurrentTime(page) {
  return page.evaluate(() => document.querySelector('video').currentTime)
}

// 재생 중이면 초가 흘러 추가 행의 시작 시각이 흔들린다. 멈춘 채로 옮겨 둔다.
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
