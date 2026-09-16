import { test, expect } from '../fixtures/extensionContext.js'

// 편집창보다 목록이 낮다. 덮을 자리가 없어 행 아래에 놓여야 한다.
const TIMELINE_COMMENT = ['00:00 첫 곡', '05:00 둘째 곡', '10:00 셋째 곡'].join('\n')

// 목록이 최대 높이를 넘는다. 편집창이 목록 아래쪽을 덮어야 한다. 1분 간격으로 20곡을 둔다.
const LONG_TIMELINE_COMMENT = Array.from(
  { length: 20 },
  (_, index) => `${String(index).padStart(2, '0')}:00 곡 ${index + 1}`
).join('\n')

const PANEL = '#timeline-skip-panel'
const LIST = `${PANEL} .timeline-skip-list`
const ROW = `${LIST} .timeline-skip-row`
const SHEET = `${PANEL} .timeline-skip-edit-sheet`
const EDIT_TARGET = `${LIST} .timeline-skip-row.is-edit-target`
const TITLE_INPUT = `${PANEL} .timeline-skip-title-input`
const ADD_BUTTON = `${PANEL} .timeline-skip-add`

// 픽셀 경계는 소수로 떨어진다. 1px 안의 차이는 같은 자리로 본다.
const TOLERANCE = 1

test.describe('편집창 위치', () => {
  test('편집 중인 트랙의 행은 목록에 남아 강조된다', async ({ openWatchPage }) => {
    const page = await openTimeline(openWatchPage, TIMELINE_COMMENT)

    await clickEdit(page, '둘째 곡')

    await expect(page.locator(EDIT_TARGET)).toHaveCount(1)
    await expect(page.locator(EDIT_TARGET)).toContainText('둘째 곡')
  })

  test('편집이 열려 있으면 직접 추가 버튼이 보이지 않는다', async ({ openWatchPage }) => {
    const page = await openTimeline(openWatchPage, TIMELINE_COMMENT)

    await clickEdit(page, '둘째 곡')

    await expect(page.locator(ADD_BUTTON)).not.toBeVisible()
  })

  test('목록이 길면 편집창이 목록 아래쪽을 덮는다', async ({ openWatchPage }) => {
    const page = await openTimeline(openWatchPage, LONG_TIMELINE_COMMENT)

    await clickEdit(page, '곡 2')

    const list = await readBox(page, LIST)
    const sheet = await readBox(page, SHEET)
    expect(sheet.top).toBeLessThan(list.bottom)
    expect(sheet.bottom).toBeCloseTo(list.bottom, 0)
  })

  test('목록이 길면 편집을 열어도 패널 높이가 그대로다', async ({ openWatchPage }) => {
    const page = await openTimeline(openWatchPage, LONG_TIMELINE_COMMENT)
    const closedHeight = await readHeight(page, PANEL)

    await clickEdit(page, '곡 2')
    const openHeight = await readHeight(page, PANEL)
    await page.locator(`${PANEL} button[aria-label="취소"]`).click()

    expect(Math.abs(openHeight - closedHeight)).toBeLessThanOrEqual(TOLERANCE)
    await expect.poll(async () => Math.abs((await readHeight(page, PANEL)) - closedHeight)).toBeLessThanOrEqual(TOLERANCE)
  })

  test('목록이 길면 추가 행을 열어도 패널 높이가 그대로다', async ({ openWatchPage }) => {
    const page = await openTimeline(openWatchPage, LONG_TIMELINE_COMMENT)
    const closedHeight = await readHeight(page, PANEL)

    await page.locator(ADD_BUTTON).click()
    await expect(page.locator(TITLE_INPUT)).toBeVisible()

    expect(Math.abs((await readHeight(page, PANEL)) - closedHeight)).toBeLessThanOrEqual(TOLERANCE)
  })

  test('목록이 짧으면 편집창이 트랙 행을 덮지 않고 그만큼 패널이 늘어난다', async ({ openWatchPage }) => {
    const page = await openTimeline(openWatchPage, TIMELINE_COMMENT)
    const closedHeight = await readHeight(page, PANEL)

    await clickEdit(page, '둘째 곡')

    const lastRow = await readBox(page, `${ROW} >> nth=-1`)
    const sheet = await readBox(page, SHEET)
    expect(sheet.top).toBeGreaterThanOrEqual(lastRow.bottom - TOLERANCE)
    expect(await readHeight(page, PANEL)).toBeGreaterThan(closedHeight)
  })

  test('목록 아래쪽 트랙을 편집해도 강조된 행이 편집창에 가려지지 않는다', async ({ openWatchPage }) => {
    const page = await openTimeline(openWatchPage, LONG_TIMELINE_COMMENT)
    await scrollListToEnd(page)

    await clickEdit(page, '곡 20')

    const list = await readBox(page, LIST)
    const row = await readBox(page, EDIT_TARGET)
    const sheet = await readBox(page, SHEET)
    expect(row.top).toBeGreaterThanOrEqual(list.top - TOLERANCE)
    expect(row.bottom).toBeLessThanOrEqual(sheet.top + TOLERANCE)
  })

  test('편집창이 덮고 있어도 목록을 끝까지 내리면 마지막 트랙이 편집창 위로 보인다', async ({ openWatchPage }) => {
    const page = await openTimeline(openWatchPage, LONG_TIMELINE_COMMENT)
    await clickEdit(page, '곡 2')

    await scrollListToEnd(page)

    const lastRow = await readBox(page, `${ROW} >> nth=-1`)
    const sheet = await readBox(page, SHEET)
    expect(lastRow.bottom).toBeLessThanOrEqual(sheet.top + TOLERANCE)
  })

  test('다른 행의 ✎를 누르면 편집창과 강조 행이 그 트랙으로 바뀐다', async ({ openWatchPage }) => {
    const page = await openTimeline(openWatchPage, TIMELINE_COMMENT)
    await clickEdit(page, '둘째 곡')

    await clickEdit(page, '셋째 곡')

    await expect(page.locator(TITLE_INPUT)).toHaveValue('셋째 곡')
    await expect(page.locator(EDIT_TARGET)).toHaveCount(1)
    await expect(page.locator(EDIT_TARGET)).toContainText('셋째 곡')
  })

  test('저장하면 강조가 사라지고 직접 추가 버튼이 돌아온다', async ({ openWatchPage }) => {
    const page = await openTimeline(openWatchPage, TIMELINE_COMMENT)
    await clickEdit(page, '둘째 곡')

    await page.locator(`${PANEL} button[aria-label="저장"]`).click()

    await expect(page.locator(EDIT_TARGET)).toHaveCount(0)
    await expect(page.locator(ADD_BUTTON)).toBeVisible()
  })

  test('트랙이 없어도 직접 추가를 누르면 추가 폼이 열린다', async ({ openWatchPage }) => {
    const { page } = await openWatchPage({ commentTexts: [] })
    await expect(page.locator(`${PANEL} .timeline-skip-empty`)).toBeVisible()

    await page.locator(ADD_BUTTON).click()

    await expect(page.locator(SHEET)).toBeVisible()
    await expect(page.locator(TITLE_INPUT)).toBeVisible()
  })
})

async function openTimeline(openWatchPage, commentText) {
  const { page } = await openWatchPage({ commentTexts: [commentText] })
  await page.locator('.timeline-skip-load-button').first().click()
  await expect(page.locator('.timeline-skip-row').first()).toBeVisible()

  return page
}

async function clickEdit(page, title) {
  await page.locator(`${LIST} button[aria-label="${title} 수정"]`).click()
  await expect(page.locator(TITLE_INPUT)).toHaveValue(title)
}

async function scrollListToEnd(page) {
  await page.locator(LIST).evaluate((list) => {
    list.scrollTop = list.scrollHeight
  })
}

async function readBox(page, selector) {
  const box = await page.locator(selector).boundingBox()

  return { top: box.y, bottom: box.y + box.height }
}

async function readHeight(page, selector) {
  return (await page.locator(selector).boundingBox()).height
}
