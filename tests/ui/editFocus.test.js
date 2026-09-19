// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { startWithFakes } from '../fixtures/fakes/startWithFakes.js'
import { clickButton, fillInput, find, loadTimeline, openEditRow } from '../fixtures/fakes/panelHelpers.js'

const TIMELINE_COMMENT = ['00:00 첫 곡', '05:00 둘째 곡', '10:00 셋째 곡'].join('\n')

const TITLE_INPUT = '.timeline-skip-edit-sheet .timeline-skip-title-input'
const QUICK_INPUT = '.timeline-skip-quick-input'

// 선택 표시가 있으면 방금 누른 행의 글자를 그 자리에서 고치는 것처럼 보인다.
describe('편집 시트를 열 때의 초점', () => {
  it('트랙 수정을 열면 제목 칸에 초점이 가고 커서는 제목 끝에 놓이며 글자는 선택되지 않는다', async () => {
    const extension = await startWithTimeline()

    openEditRow(extension, '둘째 곡')

    const titleInput = find(extension, TITLE_INPUT)
    expect(document.activeElement).toBe(titleInput)
    expect(titleInput.selectionStart).toBe('둘째 곡'.length)
    expect(titleInput.selectionEnd).toBe('둘째 곡'.length)
  })

  it('자세히 추가로 연 시트도 제목 글자가 선택되지 않는다', async () => {
    const extension = await startWithTimeline()
    fillInput(extension, QUICK_INPUT, '07:30 음악1')

    clickButton(extension, '자세히 추가')

    const titleInput = find(extension, TITLE_INPUT)
    expect(titleInput.value).toBe('음악1')
    expect(titleInput.selectionStart).toBe(titleInput.selectionEnd)
  })

  it('수정을 열어도 영상 위치는 그대로다', async () => {
    const extension = await startWithTimeline()
    extension.player.playTo(42)

    openEditRow(extension, '둘째 곡')

    expect(extension.player.seekHistory).toEqual([])
    expect(extension.player.getCurrentTimeSeconds()).toBe(42)
  })
})

async function startWithTimeline() {
  const extension = await startWithFakes()
  loadTimeline(extension, [TIMELINE_COMMENT])

  return extension
}
