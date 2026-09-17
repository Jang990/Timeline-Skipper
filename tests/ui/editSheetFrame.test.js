// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { startWithFakes } from '../fixtures/fakes/startWithFakes.js'
import { fillInput, find, findAll, loadTimeline, openEditRow, readText, readTexts } from '../fixtures/fakes/panelHelpers.js'

const TIMELINE_COMMENT = ['00:00 첫 곡', '05:00 둘째 곡', '10:00 셋째 곡'].join('\n')

// 시트 안 버튼의 위치·색·모서리는 e2e가 맡는다. 여기서는 무엇이 적히고 눌렀을 때 무엇이 되는지만 본다.
const SHEET = '.timeline-skip-edit-sheet'
const HEADING = `${SHEET} .timeline-skip-sheet-heading`
const HANDLE = `${SHEET} .timeline-skip-sheet-handle`
const TITLE_INPUT = `${SHEET} .timeline-skip-title-input`
const ROW_TITLE = '.timeline-skip-row .timeline-skip-title'

describe('편집 시트의 틀', () => {
  it('트랙을 수정하면 시트 머리에 "트랙 수정"이 보인다', async () => {
    const extension = await startWithTimeline()

    openEditRow(extension, '둘째 곡')

    expect(readText(extension, HEADING)).toBe('트랙 수정')
  })

  it('직접 추가를 누르면 시트 머리에 "트랙 추가"가 보인다', async () => {
    const extension = await startWithTimeline()

    find(extension, '.timeline-skip-add').click()

    expect(readText(extension, HEADING)).toBe('트랙 추가')
  })

  it('닫기 버튼은 글자 대신 SVG 아이콘을 그린다', async () => {
    const extension = await startWithTimeline()

    openEditRow(extension, '둘째 곡')

    const close = findSheetButton(extension, '닫기')
    expect(close.querySelectorAll('svg[data-icon="close"]')).toHaveLength(1)
    expect(close.textContent.trim()).toBe('')
  })

  it('제목을 고치고 닫기 버튼을 누르면 저장되지 않고 시트가 닫힌다', async () => {
    const extension = await startWithTimeline()
    openEditRow(extension, '둘째 곡')
    fillInput(extension, TITLE_INPUT, '바뀐 제목')

    findSheetButton(extension, '닫기').click()

    expect(find(extension, SHEET)).toBeNull()
    expect(readTexts(extension, ROW_TITLE)[1]).toBe('둘째 곡')
  })

  it('제목 칸이 있는 줄에는 버튼이 없다', async () => {
    const extension = await startWithTimeline()

    openEditRow(extension, '둘째 곡')

    expect(find(extension, TITLE_INPUT).parentElement.querySelectorAll('button')).toHaveLength(0)
  })

  it('저장 버튼에는 "저장", 취소 버튼에는 "취소"가 적혀 있다', async () => {
    const extension = await startWithTimeline()

    openEditRow(extension, '둘째 곡')

    expect(findSheetButton(extension, '저장').textContent).toBe('저장')
    expect(findSheetButton(extension, '취소').textContent).toBe('취소')
  })

  it('손잡이 막대는 화면 낭독기에 읽히지 않는다', async () => {
    const extension = await startWithTimeline()

    openEditRow(extension, '둘째 곡')

    expect(find(extension, HANDLE).getAttribute('aria-hidden')).toBe('true')
  })
})

async function startWithTimeline() {
  const extension = await startWithFakes()
  loadTimeline(extension, [TIMELINE_COMMENT])

  return extension
}

function findSheetButton(extension, ariaLabel) {
  const [button] = findAll(extension, `${SHEET} button[aria-label="${ariaLabel}"]`)

  return button
}
