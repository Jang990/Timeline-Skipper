import { test, expect } from '../fixtures/extensionContext.js'

// 둘째 곡(04:29)을 고친다. 앞 트랙은 끝이 정해져 있지 않아 이 트랙의 시작까지 이어진다.
// 픽스처 영상은 1800초라 바가 덮는 시간은 여유를 붙여 240.3~584.7초가 된다.
const TIMELINE_COMMENT = ['00:01 01.Ballerino', '04:29 02.둘째 곡', '09:16 03.셋째 곡'].join('\n')

const PANEL = '#timeline-skip-panel'
const BAR = `${PANEL} .timeline-skip-range-bar`
const FILL = `${PANEL} .timeline-skip-range-fill`
const NEIGHBOR = `${PANEL} .timeline-skip-range-neighbor`
const START_INPUT = `${PANEL} .timeline-skip-time-input`
const END_INPUT = `${PANEL} .timeline-skip-end-input`

test.describe('바 위의 이웃 트랙', () => {
  test('앞 트랙과 뒤 트랙이 바에 함께 그려진다', async ({ openWatchPage }) => {
    const page = await openTimeline(openWatchPage)

    await openEditRow(page, '02.둘째 곡')

    await expect(page.locator(NEIGHBOR)).toHaveCount(2)

    const [previous, next] = await readNeighborRatios(page)

    expect(previous.left + previous.width).toBeCloseTo(0.0833, 2)
    expect(next.left).toBeCloseTo(0.9167, 2)
  })

  test('시작 칸을 당기면 앞 트랙 칠이 그만큼 줄어든다', async ({ openWatchPage }) => {
    const page = await openTimeline(openWatchPage)
    await openEditRow(page, '02.둘째 곡')

    await page.locator(START_INPUT).fill('04:10')

    const [previous] = await readNeighborRatios(page)

    expect(previous.left + previous.width).toBeCloseTo(0.0282, 2)
  })

  test('시작 칸을 늦추면 앞 트랙 칠이 그만큼 늘어난다', async ({ openWatchPage }) => {
    const page = await openTimeline(openWatchPage)
    await openEditRow(page, '02.둘째 곡')

    await page.locator(START_INPUT).fill('05:00')

    const [previous] = await readNeighborRatios(page)

    expect(previous.left + previous.width).toBeCloseTo(0.1733, 2)
  })

  test('앞 트랙의 끝을 당겨 두면 그 뒤는 빈 자리로 남는다', async ({ openWatchPage }) => {
    const page = await openTimeline(openWatchPage)
    await openEditRow(page, '01.Ballerino')
    await page.locator(END_INPUT).fill('03:00')
    await page.locator(`${PANEL} button[aria-label="저장"]`).click()

    await openEditRow(page, '02.둘째 곡')

    const [previous] = await readNeighborRatios(page)
    const fill = await readRatios(page, FILL)

    expect(previous.left + previous.width).toBeLessThan(fill.left - 0.05)
  })

  test('추가 행에서도 앞뒤 트랙이 그려진다', async ({ openWatchPage }) => {
    const page = await openTimeline(openWatchPage)
    await pauseAt(page, 100)

    await page.locator(`${PANEL} .timeline-skip-add`).click()

    await expect(page.locator(NEIGHBOR)).toHaveCount(2)
  })

  test('시작이 바의 범위를 벗어나면 왼쪽 가장자리에 표시가 보인다', async ({ openWatchPage }) => {
    const page = await openTimeline(openWatchPage)
    await openEditRow(page, '02.둘째 곡')

    await page.locator(START_INPUT).fill('03:00')

    await expect(page.locator(`${BAR}.is-overflow-start`)).toHaveCount(1)
  })

  test('시작이 범위 안에 있으면 가장자리에 표시가 없다', async ({ openWatchPage }) => {
    const page = await openTimeline(openWatchPage)

    await openEditRow(page, '02.둘째 곡')

    await expect(page.locator(`${BAR}.is-overflow-start`)).toHaveCount(0)
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

// 칠해진 자리를 바에 대한 비율로 읽는다. 퍼센트 문자열의 자릿수에 매이지 않는다.
async function readRatios(page, selector) {
  const bar = await page.locator(BAR).boundingBox()
  const part = await page.locator(selector).boundingBox()

  return { left: (part.x - bar.x) / bar.width, width: part.width / bar.width }
}

async function readNeighborRatios(page) {
  const count = await page.locator(NEIGHBOR).count()
  const ratios = []

  for (let index = 0; index < count; index += 1) {
    ratios.push(await readRatios(page, `${NEIGHBOR} >> nth=${index}`))
  }

  return ratios
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
