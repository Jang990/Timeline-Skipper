// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { settle, startWithFakes } from '../fixtures/fakes/startWithFakes.js'
import { fillInput, find, findAll, loadTimeline, pressKey, readTexts } from '../fixtures/fakes/panelHelpers.js'

const INPUT = '.timeline-skip-quick-input'
const ROW = '.timeline-skip-list .timeline-skip-row'
const ROW_TIME = '.timeline-skip-list .timeline-skip-time'
const ROW_TITLE = '.timeline-skip-list .timeline-skip-title'
const CHECKBOX = `${ROW} input[type="checkbox"]`

describe('[skip] 표시', () => {
  it('빠른 추가 칸에 [skip] 줄을 넣으면 그 트랙이 체크 해제된 채 들어간다', async () => {
    const extension = await startWithFakes()

    fillInput(extension, INPUT, '05:11 [skip] 음악1')
    pressKey(extension, INPUT, 'Enter')

    expect(readTexts(extension, ROW_TITLE)).toEqual(['음악1'])
    expect(readChecked(extension)).toEqual([false])
  })

  it('시각 없이 [skip] 줄을 넣으면 지금 재생 위치에 체크 해제된 채 들어간다', async () => {
    const extension = await startWithFakes()
    extension.player.playTo(42.7)

    fillInput(extension, INPUT, '[skip] 음악1')
    pressKey(extension, INPUT, 'Enter')

    expect(readTexts(extension, ROW_TIME)).toEqual(['00:42'])
    expect(readTexts(extension, ROW_TITLE)).toEqual(['음악1'])
    expect(readChecked(extension)).toEqual([false])
  })

  it('여러 줄을 붙여넣으면 [skip]이 붙은 줄만 체크 해제된다', async () => {
    const extension = await startWithFakes()

    fillInput(extension, INPUT, ['00:00 첫 곡', '05:00 [skip] 둘째 곡', '10:00 셋째 곡'].join('\n'))
    pressKey(extension, INPUT, 'Enter')

    expect(readTexts(extension, ROW_TITLE)).toEqual(['첫 곡', '둘째 곡', '셋째 곡'])
    expect(readChecked(extension)).toEqual([true, false, true])
  })

  it('댓글에서 불러온 [skip] 줄은 체크 해제된 채 들어간다', async () => {
    const extension = await startWithFakes()

    loadTimeline(extension, [['00:00 첫 곡', '05:00 [skip] 둘째 곡', '10:00 셋째 곡'].join('\n')])

    expect(readTexts(extension, ROW_TITLE)).toEqual(['첫 곡', '둘째 곡', '셋째 곡'])
    expect(readChecked(extension)).toEqual([true, false, true])
  })

  it('[skip]으로 들어온 트랙은 새로고침 뒤에도 체크 해제 상태다', async () => {
    const extension = await startWithFakes()
    fillInput(extension, INPUT, ['00:00 첫 곡', '05:00 [skip] 둘째 곡'].join('\n'))
    pressKey(extension, INPUT, 'Enter')
    await settle()

    const restarted = await extension.restart()

    expect(readTexts(restarted, ROW_TITLE)).toEqual(['첫 곡', '둘째 곡'])
    expect(readChecked(restarted)).toEqual([true, false])
  })
})

function readChecked(extension) {
  return findAll(extension, CHECKBOX).map((checkbox) => checkbox.checked)
}
