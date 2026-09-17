// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { startWithFakes } from '../fixtures/fakes/startWithFakes.js'
import { clickButton, find, findAll, loadTimeline, openEditRow } from '../fixtures/fakes/panelHelpers.js'

const TIMELINE_COMMENT = ['00:00 첫 곡', '05:00 둘째 곡', '10:00 셋째 곡'].join('\n')

// 편집창이 어디에 놓이는지는 레이아웃이라 e2e가 맡는다. 여기서는 무엇이 열리고 강조되는지만 본다.
const LIST_AREA = '.timeline-skip-list-area'
const SHEET = '.timeline-skip-edit-sheet'
const EDIT_TARGET = '.timeline-skip-list .timeline-skip-row.is-edit-target'
const TITLE_INPUT = '.timeline-skip-title-input'
const ADD_BUTTON = '.timeline-skip-add'

describe('편집창 위치', () => {
  it('편집 중인 트랙의 행은 목록에 남아 강조된다', async () => {
    const extension = await startWithTimeline()

    openEditRow(extension, '둘째 곡')

    expect(findAll(extension, EDIT_TARGET)).toHaveLength(1)
    expect(find(extension, EDIT_TARGET).textContent).toContain('둘째 곡')
  })

  it('다른 행의 ✎를 누르면 편집창과 강조 행이 그 트랙으로 바뀐다', async () => {
    const extension = await startWithTimeline()
    openEditRow(extension, '둘째 곡')

    clickButton(extension, '셋째 곡 수정')

    expect(find(extension, TITLE_INPUT).value).toBe('셋째 곡')
    expect(findAll(extension, EDIT_TARGET)).toHaveLength(1)
    expect(find(extension, EDIT_TARGET).textContent).toContain('셋째 곡')
  })

  // 추가 버튼은 빼지 않고 CSS로 숨긴다. 실제로 숨는지는 e2e가, 숨기라는 표시는 여기서 본다.
  it('저장하면 강조가 사라지고 직접 추가 버튼이 돌아온다', async () => {
    const extension = await startWithTimeline()
    openEditRow(extension, '둘째 곡')
    expect(find(extension, LIST_AREA).classList.contains('is-editing')).toBe(true)

    clickButton(extension, '저장')

    expect(findAll(extension, EDIT_TARGET)).toHaveLength(0)
    expect(find(extension, LIST_AREA).classList.contains('is-editing')).toBe(false)
    expect(find(extension, ADD_BUTTON)).not.toBeNull()
  })

  it('트랙이 없어도 직접 추가를 누르면 추가 폼이 열린다', async () => {
    const extension = await startWithFakes()
    expect(find(extension, '.timeline-skip-empty')).not.toBeNull()

    find(extension, ADD_BUTTON).click()

    expect(find(extension, SHEET)).not.toBeNull()
    expect(find(extension, TITLE_INPUT)).not.toBeNull()
  })
})

async function startWithTimeline() {
  const extension = await startWithFakes()
  loadTimeline(extension, [TIMELINE_COMMENT])

  return extension
}
