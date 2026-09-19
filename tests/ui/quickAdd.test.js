// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { startWithFakes } from '../fixtures/fakes/startWithFakes.js'
import { clickButton, fillInput, find, loadTimeline, readText, readTexts } from '../fixtures/fakes/panelHelpers.js'

const TIMELINE_COMMENT = ['00:00 첫 곡', '05:00 둘째 곡', '10:00 셋째 곡'].join('\n')

const INPUT = '.timeline-skip-quick-input'
const PREVIEW = '.timeline-skip-quick-preview'
const SUBMIT = 'button[aria-label="추가"]'
const ROW_TIME = '.timeline-skip-list .timeline-skip-time'
const ROW_TITLE = '.timeline-skip-list .timeline-skip-title'

describe('한 줄 추가', () => {
  it('"05:11 음악1"을 입력하고 Enter를 누르면 그 시각에 트랙이 들어가고 칸이 빈다', async () => {
    const extension = await startWithFakes()

    fillInput(extension, INPUT, '05:11 음악1')
    pressEnter(extension)

    expect(readTexts(extension, ROW_TIME)).toEqual(['05:11'])
    expect(readTexts(extension, ROW_TITLE)).toEqual(['음악1'])
    expect(find(extension, INPUT).value).toBe('')
  })

  it('제목만 입력하면 Enter를 누른 순간의 재생 위치에 들어간다', async () => {
    const extension = await startWithFakes()
    extension.player.playTo(30)
    fillInput(extension, INPUT, '음악1')

    extension.player.playTo(42.7)
    pressEnter(extension)

    expect(readTexts(extension, ROW_TIME)).toEqual(['00:42'])
    expect(readTexts(extension, ROW_TITLE)).toEqual(['음악1'])
  })

  it('제목만 입력하면 미리보기에 "지금 위치"가 붙는다', async () => {
    const extension = await startWithFakes()

    fillInput(extension, INPUT, '음악1')

    expect(readText(extension, PREVIEW)).toContain('지금 위치')
  })

  it('여러 줄을 붙여넣으면 시각 있는 줄이 한꺼번에 들어간다', async () => {
    const extension = await startWithFakes()

    fillInput(extension, INPUT, '00:05 a\n잡담\n00:20 b\n00:40 c')
    pressEnter(extension)

    expect(readTexts(extension, ROW_TITLE)).toEqual(['a', 'b', 'c'])
  })

  it('이미 있는 시각이면 알림이 보이고 트랙이 들어가지 않는다', async () => {
    const extension = await startWithTimeline()

    fillInput(extension, INPUT, '05:00 다른 곡')
    pressEnter(extension)

    expect(readTexts(extension, ROW_TITLE)).toEqual(['첫 곡', '둘째 곡', '셋째 곡'])
    expect(readText(extension, PREVIEW)).toContain('05:00에 이미 트랙이 있습니다')
    expect(find(extension, INPUT).value).toBe('05:00 다른 곡')
  })

  it('한글 조합 중의 Enter로는 추가되지 않는다', async () => {
    const extension = await startWithFakes()
    fillInput(extension, INPUT, '음악')

    pressEnter(extension, { isComposing: true })

    expect(readTexts(extension, ROW_TITLE)).toEqual([])
  })

  it('Shift+Enter로는 추가되지 않는다', async () => {
    const extension = await startWithFakes()
    fillInput(extension, INPUT, '음악1')

    pressEnter(extension, { shiftKey: true })

    expect(readTexts(extension, ROW_TITLE)).toEqual([])
  })

  it('빈 칸이면 추가 버튼이 잠긴다', async () => {
    const extension = await startWithFakes()

    fillInput(extension, INPUT, '   ')

    expect(find(extension, SUBMIT).disabled).toBe(true)
  })

  it('추가 버튼을 눌러도 Enter와 같이 들어간다', async () => {
    const extension = await startWithFakes()
    fillInput(extension, INPUT, '05:11 음악1')

    clickButton(extension, '추가')

    expect(readTexts(extension, ROW_TITLE)).toEqual(['음악1'])
  })

  it('재생 중 다시 그려져도 입력하던 글자와 초점이 남는다', async () => {
    const extension = await startWithTimeline()
    find(extension, INPUT).focus()
    fillInput(extension, INPUT, '음악')

    extension.player.playTo(310)

    expect(find(extension, '.timeline-skip-row.is-playing .timeline-skip-title').textContent).toBe('둘째 곡')
    expect(find(extension, INPUT).value).toBe('음악')
    expect(document.activeElement).toBe(find(extension, INPUT))
  })
})

async function startWithTimeline() {
  const extension = await startWithFakes()
  loadTimeline(extension, [TIMELINE_COMMENT])

  return extension
}

function pressEnter(extension, options = {}) {
  find(extension, INPUT).dispatchEvent(
    new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true, ...options })
  )
}
