import { test, expect } from '../fixtures/extensionContext.js'

const TIMELINE_COMMENT = ['00:00 첫 곡', '05:00 둘째 곡', '10:00 셋째 곡'].join('\n')

const PANEL = '#timeline-skip-panel'
const SHEET = `${PANEL} .timeline-skip-edit-sheet`
const HEADING = `${SHEET} .timeline-skip-sheet-heading`
const HANDLE = `${SHEET} .timeline-skip-sheet-handle`
const TITLE_INPUT = `${SHEET} .timeline-skip-title-input`
const END_INPUT = `${SHEET} .timeline-skip-end-input`
const ERROR = `${SHEET} .timeline-skip-error`
const ROW_TITLE = `${PANEL} .timeline-skip-row .timeline-skip-title`
const RAISED_VARIABLE = '--yt-sys-color-baseline--raised-background'

test.describe('편집 시트의 틀', () => {
  test('트랙을 수정하면 시트 머리에 "트랙 수정"이 보인다', async ({ openWatchPage }) => {
    const page = await openTimeline(openWatchPage)

    await openEditSheet(page, '둘째 곡')

    await expect(page.locator(HEADING)).toHaveText('트랙 수정')
  })

  test('직접 추가를 누르면 시트 머리에 "트랙 추가"가 보인다', async ({ openWatchPage }) => {
    const page = await openTimeline(openWatchPage)

    await page.locator(`${PANEL} .timeline-skip-add`).click()

    await expect(page.locator(HEADING)).toHaveText('트랙 추가')
  })

  test('닫기 버튼은 글자 대신 SVG 아이콘을 그린다', async ({ openWatchPage }) => {
    const page = await openTimeline(openWatchPage)

    await openEditSheet(page, '둘째 곡')

    const close = button(page, '닫기')
    await expect(close.locator('svg[data-icon="close"]')).toHaveCount(1)
    await expect(close).toHaveText('')
  })

  test('제목을 고치고 닫기 버튼을 누르면 저장되지 않고 시트가 닫힌다', async ({ openWatchPage }) => {
    const page = await openTimeline(openWatchPage)
    await openEditSheet(page, '둘째 곡')
    await page.locator(TITLE_INPUT).fill('바뀐 제목')

    await button(page, '닫기').click()

    await expect(page.locator(SHEET)).toHaveCount(0)
    await expect(page.locator(ROW_TITLE).nth(1)).toHaveText('둘째 곡')
  })

  test('제목 칸이 있는 줄에는 버튼이 없다', async ({ openWatchPage }) => {
    const page = await openTimeline(openWatchPage)

    await openEditSheet(page, '둘째 곡')

    await expect(page.locator(TITLE_INPUT).locator('..').locator('button')).toHaveCount(0)
  })

  test('저장 버튼에는 "저장", 취소 버튼에는 "취소"가 적혀 있다', async ({ openWatchPage }) => {
    const page = await openTimeline(openWatchPage)

    await openEditSheet(page, '둘째 곡')

    await expect(button(page, '저장')).toHaveText('저장')
    await expect(button(page, '취소')).toHaveText('취소')
  })

  test('저장·취소 버튼은 끝 칸보다 아래에 있다', async ({ openWatchPage }) => {
    const page = await openTimeline(openWatchPage)

    await openEditSheet(page, '둘째 곡')

    const endBottom = await readBottom(page.locator(END_INPUT))
    expect(await readTop(button(page, '저장'))).toBeGreaterThan(endBottom)
    expect(await readTop(button(page, '취소'))).toBeGreaterThan(endBottom)
  })

  test('저장 버튼은 취소 버튼과 배경색이 다르다', async ({ openWatchPage }) => {
    const page = await openTimeline(openWatchPage)

    await openEditSheet(page, '둘째 곡')

    const saveBackground = await readStyle(button(page, '저장'), 'backgroundColor')
    const cancelBackground = await readStyle(button(page, '취소'), 'backgroundColor')
    expect(saveBackground).not.toBe(cancelBackground)
  })

  test('저장되지 않은 이유는 저장 버튼보다 위에 보인다', async ({ openWatchPage }) => {
    const page = await openTimeline(openWatchPage)
    await openEditSheet(page, '둘째 곡')
    await page.locator(END_INPUT).fill('1:00')

    await button(page, '저장').click()

    await expect(page.locator(ERROR)).toBeVisible()
    expect(await readBottom(page.locator(ERROR))).toBeLessThanOrEqual(await readTop(button(page, '저장')))
  })

  test('손잡이 막대는 화면 낭독기에 읽히지 않는다', async ({ openWatchPage }) => {
    const page = await openTimeline(openWatchPage)

    await openEditSheet(page, '둘째 곡')

    await expect(page.locator(HANDLE)).toBeVisible()
    await expect(page.locator(HANDLE)).toHaveAttribute('aria-hidden', 'true')
  })

  test('시트는 위쪽 모서리가 둥글고 그림자가 있다', async ({ openWatchPage }) => {
    const page = await openTimeline(openWatchPage)

    await openEditSheet(page, '둘째 곡')

    const sheet = page.locator(SHEET)
    expect(parseFloat(await readStyle(sheet, 'borderTopLeftRadius'))).toBeGreaterThan(0)
    expect(parseFloat(await readStyle(sheet, 'borderTopRightRadius'))).toBeGreaterThan(0)
    expect(await readStyle(sheet, 'boxShadow')).not.toBe('none')
  })

  // 픽스처에는 유튜브 스타일이 없어 대체값끼리는 목록 바탕과 같은 흰색이다. 변수를 직접 넣어 가른다.
  test('시트 바탕은 유튜브의 떠 있는 판 색을 따른다', async ({ openWatchPage }) => {
    const page = await openTimeline(openWatchPage)
    await page.addStyleTag({ content: `html { ${RAISED_VARIABLE}: rgb(33, 33, 33); }` })

    await openEditSheet(page, '둘째 곡')

    expect(await readStyle(page.locator(SHEET), 'backgroundColor')).toBe('rgb(33, 33, 33)')
  })
})

async function openTimeline(openWatchPage) {
  const { page } = await openWatchPage({ commentTexts: [TIMELINE_COMMENT] })
  await page.locator('.timeline-skip-load-button').first().click()
  await expect(page.locator('.timeline-skip-row').first()).toBeVisible()

  return page
}

async function openEditSheet(page, title) {
  await page.locator(`${PANEL} button[aria-label="${title} 수정"]`).click()
  await expect(page.locator(TITLE_INPUT)).toHaveValue(title)
}

function button(page, ariaLabel) {
  return page.locator(`${SHEET} button[aria-label="${ariaLabel}"]`)
}

async function readTop(locator) {
  return (await locator.boundingBox()).y
}

async function readBottom(locator) {
  const box = await locator.boundingBox()

  return box.y + box.height
}

function readStyle(locator, property) {
  return locator.evaluate((element, name) => getComputedStyle(element)[name], property)
}
