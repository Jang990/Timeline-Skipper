import { test, expect } from '../fixtures/extensionContext.js'

// 둘째 곡(05:00)을 고친다. 앞뒤에 트랙이 있어야 이웃 사이를 잡는 것이 보인다.
// 픽스처 영상은 1800초라, 이웃 사이 300~600초에 여유가 붙어 범위는 270~630초가 된다.
const TIMELINE_COMMENT = ['00:00 첫 곡', '05:00 둘째 곡', '10:00 셋째 곡'].join('\n')

const PANEL = '#timeline-skip-panel'
const BAR = `${PANEL} .timeline-skip-range-bar`
const FILL = `${PANEL} .timeline-skip-range-fill`
const START_INPUT = `${PANEL} .timeline-skip-time-input`

test.describe('구간 바', () => {
  test('칠해진 구간이 트랙의 시작과 끝 자리에 놓인다', async ({ openWatchPage }) => {
    const page = await openTimeline(openWatchPage)
    await openEditRow(page, '둘째 곡')

    const fill = await readFillRatios(page)

    expect(fill.left).toBeCloseTo(0.0833, 2)
    expect(fill.width).toBeCloseTo(0.8333, 2)
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
