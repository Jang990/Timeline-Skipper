import { describe, it, expect } from 'vitest'
import { startInBrowser } from '../fixtures/startInBrowser.js'
import { loadTimeline } from '../fixtures/fakes/panelHelpers.js'

const TIMELINE_COMMENT = ['00:00 첫 곡', '05:00 둘째 곡', '10:00 셋째 곡'].join('\n')
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
const QUICK_ADD = `${PANEL} .timeline-skip-quick`
const DETAIL_BUTTON = `${PANEL} button[aria-label="자세히 추가"]`
const TOLERANCE = 1

describe('편집창 위치', () => {
  it('편집이 열려 있으면 한 줄 추가 칸이 보이지 않는다', async () => {
    await openTimeline(TIMELINE_COMMENT)

    await clickEdit('둘째 곡')

    expect(isVisible(QUICK_ADD)).toBe(false)
  })

  it('목록이 길면 편집창이 목록 아래쪽을 덮는다', async () => {
    await openTimeline(LONG_TIMELINE_COMMENT)

    await clickEdit('곡 2')

    const list = readBox(LIST)
    const sheet = readBox(SHEET)
    expect(sheet.top).toBeLessThan(list.bottom)
    expect(sheet.bottom).toBeLessThan(list.bottom)
  })

  it('편집창은 목록 바닥에 닿지 않고 좌우로도 좁다', async () => {
    await openTimeline(LONG_TIMELINE_COMMENT)

    await clickEdit('곡 2')

    const list = readBox(LIST)
    const sheet = readBox(SHEET)
    expect(list.bottom - sheet.bottom).toBeGreaterThan(TOLERANCE)
    expect(sheet.left - list.left).toBeGreaterThan(TOLERANCE)
    expect(list.right - sheet.right).toBeGreaterThan(TOLERANCE)
  })

  it('목록이 길면 편집을 열어도 패널 높이가 그대로다', async () => {
    await openTimeline(LONG_TIMELINE_COMMENT)
    const closedHeight = readBox(PANEL).height

    await clickEdit('곡 2')
    const openHeight = readBox(PANEL).height
    document.querySelector(`${PANEL} button[aria-label="취소"]`).click()
    await nextFrame()

    expect(Math.abs(openHeight - closedHeight)).toBeLessThanOrEqual(TOLERANCE)
    expect(Math.abs(readBox(PANEL).height - closedHeight)).toBeLessThanOrEqual(TOLERANCE)
  })

  it('목록이 길면 추가 행을 열어도 패널 높이가 그대로다', async () => {
    await openTimeline(LONG_TIMELINE_COMMENT)
    const closedHeight = readBox(PANEL).height

    document.querySelector(DETAIL_BUTTON).click()
    await nextFrame()

    expect(isVisible(TITLE_INPUT)).toBe(true)
    expect(Math.abs(readBox(PANEL).height - closedHeight)).toBeLessThanOrEqual(TOLERANCE)
  })

  it('목록이 짧으면 편집창이 트랙 행을 덮지 않고 그만큼 패널이 늘어난다', async () => {
    await openTimeline(TIMELINE_COMMENT)
    const closedHeight = readBox(PANEL).height

    await clickEdit('둘째 곡')

    const rows = document.querySelectorAll(ROW)
    const lastRow = boxOf(rows[rows.length - 1])
    const sheet = readBox(SHEET)
    expect(sheet.top).toBeGreaterThanOrEqual(lastRow.bottom - TOLERANCE)
    expect(readBox(PANEL).height).toBeGreaterThan(closedHeight)
  })

  it('목록 아래쪽 트랙을 편집해도 강조된 행이 편집창에 가려지지 않는다', async () => {
    await openTimeline(LONG_TIMELINE_COMMENT)
    scrollListToEnd()

    await clickEdit('곡 20')

    const list = readBox(LIST)
    const row = readBox(EDIT_TARGET)
    const sheet = readBox(SHEET)
    expect(row.top).toBeGreaterThanOrEqual(list.top - TOLERANCE)
    expect(row.bottom).toBeLessThanOrEqual(sheet.top + TOLERANCE)
  })

  it('편집창이 덮고 있어도 목록을 끝까지 내리면 마지막 트랙이 편집창 위로 보인다', async () => {
    await openTimeline(LONG_TIMELINE_COMMENT)
    await clickEdit('곡 2')

    scrollListToEnd()
    await nextFrame()

    const rows = document.querySelectorAll(ROW)
    const lastRow = boxOf(rows[rows.length - 1])
    const sheet = readBox(SHEET)
    expect(lastRow.bottom).toBeLessThanOrEqual(sheet.top + TOLERANCE)
  })
})

async function openTimeline(commentText) {
  const extension = await startInBrowser()
  loadTimeline(extension, [commentText])
  await nextFrame()
}

async function clickEdit(title) {
  document.querySelector(`${LIST} button[aria-label="${title} 수정"]`).click()
  await nextFrame()
  expect(document.querySelector(TITLE_INPUT).value).toBe(title)
}

function scrollListToEnd() {
  const list = document.querySelector(LIST)
  list.scrollTop = list.scrollHeight
}

function isVisible(selector) {
  const element = document.querySelector(selector)
  return element !== null && element.checkVisibility()
}

function readBox(selector) {
  return boxOf(document.querySelector(selector))
}

function boxOf(element) {
  const rect = element.getBoundingClientRect()
  return { top: rect.top, bottom: rect.bottom, left: rect.left, right: rect.right, height: rect.height }
}

function nextFrame() {
  return new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
}
