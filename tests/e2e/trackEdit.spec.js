import { test, expect } from '../fixtures/extensionContext.js'

// 첫 곡은 0초에서 시작한다. 끝을 당겼을 때 그 뒤가 빈 구간이 되는 것을 가장 짧게 보여준다.
const TIMELINE_COMMENT = ['00:00 첫 곡', '05:00 둘째 곡', '10:00 셋째 곡'].join('\n')

const PANEL = '#timeline-skip-panel'
const ROW_TIME = `${PANEL} .timeline-skip-time`
const END_INPUT = `${PANEL} .timeline-skip-end-input`
const ERROR = `${PANEL} .timeline-skip-error`
const SAVE_BUTTON = `${PANEL} button[aria-label="저장"]`

test.describe('끝 시각 편집', () => {
  test('끝 시각을 넣으면 목록에 구간으로 보인다', async ({ openWatchPage }) => {
    const { page } = await openWatchPage({ commentTexts: [TIMELINE_COMMENT] })
    await loadTimeline(page)

    await saveEnd(page, '첫 곡', '3:00')

    await expect(page.locator(ROW_TIME).first()).toHaveText('00:00 ~ 03:00')
  })

  test('끝을 정한 적 없는 트랙의 끝 칸은 비어 있다', async ({ openWatchPage }) => {
    const { page } = await openWatchPage({ commentTexts: [TIMELINE_COMMENT] })
    await loadTimeline(page)

    await openEditRow(page, '둘째 곡')

    await expect(page.locator(END_INPUT)).toHaveValue('')
  })

  test('끝 시각을 넣은 트랙을 다시 열면 그 값이 칸에 들어 있다', async ({ openWatchPage }) => {
    const { page } = await openWatchPage({ commentTexts: [TIMELINE_COMMENT] })
    await loadTimeline(page)
    await saveEnd(page, '첫 곡', '3:00')

    await openEditRow(page, '첫 곡')

    await expect(page.locator(END_INPUT)).toHaveValue('03:00')
  })

  test('끝 칸을 비우고 저장하면 구간 표시가 사라진다', async ({ openWatchPage }) => {
    const { page } = await openWatchPage({ commentTexts: [TIMELINE_COMMENT] })
    await loadTimeline(page)
    await saveEnd(page, '첫 곡', '3:00')

    await saveEnd(page, '첫 곡', '')

    await expect(page.locator(ROW_TIME).first()).toHaveText('00:00')
  })

  test('끝이 시작보다 앞이면 저장되지 않고 이유가 보인다', async ({ openWatchPage }) => {
    const { page } = await openWatchPage({ commentTexts: [TIMELINE_COMMENT] })
    await loadTimeline(page)

    await saveEnd(page, '둘째 곡', '1:00')

    await expect(page.locator(ERROR)).toHaveText('끝 시각이 시작 시각보다 빠릅니다')
    await expect(page.locator(END_INPUT)).toBeVisible()
  })

  test('읽을 수 없는 끝 시각은 저장되지 않고 이유가 보인다', async ({ openWatchPage }) => {
    const { page } = await openWatchPage({ commentTexts: [TIMELINE_COMMENT] })
    await loadTimeline(page)

    await saveEnd(page, '둘째 곡', '어제')

    await expect(page.locator(ERROR)).toContainText('시각을 읽을 수 없습니다')
    await expect(page.locator(END_INPUT)).toBeVisible()
  })
})

async function loadTimeline(page) {
  await page.locator('.timeline-skip-load-button').first().click()
  await expect(page.locator('.timeline-skip-row').first()).toBeVisible()
}

async function openEditRow(page, title) {
  await page.locator(`${PANEL} button[aria-label="${title} 수정"]`).click()
  await expect(page.locator(END_INPUT)).toBeVisible()
}

async function saveEnd(page, title, endText) {
  await openEditRow(page, title)
  await page.locator(END_INPUT).fill(endText)
  await page.locator(SAVE_BUTTON).click()
}
