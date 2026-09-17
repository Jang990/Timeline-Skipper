// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { FIXTURE_VIDEO_SECONDS } from '../fixtures/media/fixtureVideo.js'
import { startWithFakes } from '../fixtures/fakes/startWithFakes.js'
import { clickButton, fillInput, find, loadTimeline, openEditRow, readText } from '../fixtures/fakes/panelHelpers.js'

// 첫 곡은 0초에서 시작한다. 끝을 당겼을 때 그 뒤가 빈 구간이 되는 것을 가장 짧게 보여준다.
const TIMELINE_COMMENT = ['00:00 첫 곡', '05:00 둘째 곡', '10:00 셋째 곡'].join('\n')

const ROW_TIME = '.timeline-skip-time'
const END_INPUT = '.timeline-skip-end-input'
const ERROR = '.timeline-skip-error'

describe('끝 시각 편집', () => {
  it('끝 시각을 넣으면 목록에 구간으로 보인다', async () => {
    const extension = await startWithTimeline()

    saveEnd(extension, '첫 곡', '3:00')

    expect(readText(extension, ROW_TIME)).toBe('00:00 ~ 03:00')
  })

  it('끝을 정한 적 없는 트랙의 끝 칸은 비어 있다', async () => {
    const extension = await startWithTimeline()

    openEditRow(extension, '둘째 곡')

    expect(find(extension, END_INPUT).value).toBe('')
  })

  it('끝 시각을 넣은 트랙을 다시 열면 그 값이 칸에 들어 있다', async () => {
    const extension = await startWithTimeline()
    saveEnd(extension, '첫 곡', '3:00')

    openEditRow(extension, '첫 곡')

    expect(find(extension, END_INPUT).value).toBe('03:00')
  })

  it('끝 칸을 비우고 저장하면 구간 표시가 사라진다', async () => {
    const extension = await startWithTimeline()
    saveEnd(extension, '첫 곡', '3:00')

    saveEnd(extension, '첫 곡', '')

    expect(readText(extension, ROW_TIME)).toBe('00:00')
  })

  it('끝이 시작보다 앞이면 저장되지 않고 이유가 보인다', async () => {
    const extension = await startWithTimeline()

    saveEnd(extension, '둘째 곡', '1:00')

    expect(readText(extension, ERROR)).toBe('끝 시각이 시작 시각보다 빠릅니다')
    expect(find(extension, END_INPUT)).not.toBeNull()
  })

  it('읽을 수 없는 끝 시각은 저장되지 않고 이유가 보인다', async () => {
    const extension = await startWithTimeline()

    saveEnd(extension, '둘째 곡', '어제')

    expect(readText(extension, ERROR)).toContain('시각을 읽을 수 없습니다')
    expect(find(extension, END_INPUT)).not.toBeNull()
  })
})

async function startWithTimeline() {
  const extension = await startWithFakes({ durationSeconds: FIXTURE_VIDEO_SECONDS })
  loadTimeline(extension, [TIMELINE_COMMENT])

  return extension
}

function saveEnd(extension, title, endText) {
  openEditRow(extension, title)
  fillInput(extension, END_INPUT, endText)
  clickButton(extension, '저장')
}
