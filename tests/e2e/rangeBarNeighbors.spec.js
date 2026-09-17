import { test, expect } from '../fixtures/extensionContext.js'

// 둘째 곡(04:29)을 고친다. 앞 트랙은 끝이 정해져 있지 않아 이 트랙의 시작까지 이어진다.
// 픽스처 영상은 1800초라 바가 덮는 시간은 여유를 붙여 240.3~584.7초가 된다.
const TIMELINE_COMMENT = ['00:01 01.Ballerino', '04:29 02.둘째 곡', '09:16 03.셋째 곡'].join('\n')

const PANEL = '#timeline-skip-panel'
const BAR = `${PANEL} .timeline-skip-range-bar`
const NEIGHBOR = `${PANEL} .timeline-skip-range-neighbor`
const START_INPUT = `${PANEL} .timeline-skip-time-input`

test.describe('바 위의 이웃 트랙', () => {
  test('앞 트랙과 뒤 트랙이 바에 함께 그려진다', async ({ openWatchPage }) => {
    const page = await openTimeline(openWatchPage)

    await openEditRow(page, '02.둘째 곡')

    await expect(page.locator(NEIGHBOR)).toHaveCount(2)

    const [previous, next] = await readNeighborRatios(page)

    expect(previous.left + previous.width).toBeCloseTo(0.0833, 2)
    expect(next.left).toBeCloseTo(0.9167, 2)
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
