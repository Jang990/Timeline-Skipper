// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { startWithFakes } from '../fixtures/fakes/startWithFakes.js'
import { clickButton, fillInput, find, loadTimeline, readText, readTexts } from '../fixtures/fakes/panelHelpers.js'

const TIMELINE_COMMENT = ['00:00 첫 곡', '05:00 둘째 곡', '10:00 셋째 곡'].join('\n')

const INPUT = '.timeline-skip-quick-input'
const DETAIL = 'button[aria-label="자세히 추가"]'
const SHEET = '.timeline-skip-edit-sheet'
const HEADING = `${SHEET} .timeline-skip-sheet-heading`
const TITLE_INPUT = `${SHEET} .timeline-skip-title-input`
const START_INPUT = `${SHEET} .timeline-skip-time-input`
const ROW_TITLE = '.timeline-skip-list .timeline-skip-title'

describe('자세히 추가', () => {
  it('⚙를 누르면 입력한 시각과 제목이 채워진 추가 시트가 열린다', async () => {
    const extension = await startWithTimeline()
    fillInput(extension, INPUT, '07:30 음악1')

    clickButton(extension, '자세히 추가')

    expect(readText(extension, HEADING)).toBe('트랙 추가')
    expect(find(extension, START_INPUT).value).toBe('07:30')
    expect(find(extension, TITLE_INPUT).value).toBe('음악1')
  })

  it('칸이 비어 있을 때 ⚙를 누르면 지금 재생 위치로 시트가 열린다', async () => {
    const extension = await startWithTimeline()
    extension.player.playTo(312.4)

    clickButton(extension, '자세히 추가')

    expect(find(extension, START_INPUT).value).toBe('05:12')
    expect(find(extension, TITLE_INPUT).value).toBe('')
  })

  it('시트에서 저장하면 트랙이 들어가고 입력칸이 빈다', async () => {
    const extension = await startWithTimeline()
    fillInput(extension, INPUT, '07:30 음악1')
    clickButton(extension, '자세히 추가')

    clickButton(extension, '저장')

    expect(readTexts(extension, ROW_TITLE)).toEqual(['첫 곡', '둘째 곡', '음악1', '셋째 곡'])
    expect(find(extension, INPUT).value).toBe('')
  })

  it('시트를 취소하면 입력칸의 글자가 남는다', async () => {
    const extension = await startWithTimeline()
    fillInput(extension, INPUT, '07:30 음악1')
    clickButton(extension, '자세히 추가')

    clickButton(extension, '취소')

    expect(find(extension, SHEET)).toBeNull()
    expect(find(extension, INPUT).value).toBe('07:30 음악1')
  })

  it('여러 줄을 입력한 동안에는 ⚙가 잠긴다', async () => {
    const extension = await startWithTimeline()

    fillInput(extension, INPUT, '07:30 음악1\n08:00 음악2')

    expect(find(extension, DETAIL).disabled).toBe(true)
  })
})

async function startWithTimeline() {
  const extension = await startWithFakes()
  loadTimeline(extension, [TIMELINE_COMMENT])

  return extension
}
