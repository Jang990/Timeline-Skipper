// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { startWithFakes } from '../fixtures/fakes/startWithFakes.js'
import { clickButton, fillInput, find, loadTimeline, openEditRow } from '../fixtures/fakes/panelHelpers.js'

// 둘째 곡(05:00)을 고친다. 픽스처 영상은 1800초라 바가 덮는 시간은 270~630초다.
const TIMELINE_COMMENT = ['00:00 첫 곡', '05:00 둘째 곡', '10:00 셋째 곡'].join('\n')

const PLAYHEAD = '.timeline-skip-range-playhead'
const TITLE_INPUT = '.timeline-skip-title-input'

describe('바 위의 재생 위치', () => {
  it('편집 행을 열면 바 위에 재생 위치가 보인다', async () => {
    const extension = await startEditingAt(400)

    expect(find(extension, PLAYHEAD).hidden).toBe(false)
  })

  it('재생 위치 표시가 지금 재생 위치의 자리에 놓인다', async () => {
    const extension = await startEditingAt(400)

    expect(readPlayheadRatio(extension)).toBeCloseTo(0.3611, 2)
  })

  it('영상을 다른 시각으로 옮기면 재생 위치 표시가 따라 움직인다', async () => {
    const extension = await startEditingAt(400)

    extension.player.playTo(500)

    expect(readPlayheadRatio(extension)).toBeCloseTo(0.6389, 2)
  })

  it('재생 위치가 움직여도 편집 칸에 입력하던 글자는 그대로다', async () => {
    const extension = await startEditingAt(400)
    fillInput(extension, TITLE_INPUT, '고치던 제목')

    extension.player.playTo(500)

    expect(readPlayheadRatio(extension)).toBeCloseTo(0.6389, 2)
    expect(find(extension, TITLE_INPUT).value).toBe('고치던 제목')
  })

  it('재생 위치가 범위보다 앞이면 왼쪽 가장자리에 붙고 벗어났다고 표시된다', async () => {
    const extension = await startEditingAt(100)

    expect(readPlayheadRatio(extension)).toBeCloseTo(0, 2)
    expect(find(extension, PLAYHEAD).classList.contains('is-outside')).toBe(true)
  })

  it('편집을 닫고 다른 트랙을 열어도 재생 위치 표시가 따라 움직인다', async () => {
    const extension = await startEditingAt(400)
    clickButton(extension, '취소')
    openEditRow(extension, '셋째 곡')

    extension.player.playTo(900)

    // 셋째 곡의 바는 480~1800초를 덮는다.
    expect(readPlayheadRatio(extension)).toBeCloseTo(0.3182, 2)
  })

  it('추가 행에서도 재생 위치 표시가 따라 움직인다', async () => {
    const extension = await startWithTimeline()
    extension.player.playTo(100)
    find(extension, '.timeline-skip-add').click()
    expect(find(extension, PLAYHEAD).hidden).toBe(false)

    extension.player.playTo(200)

    // 100초에 추가하면 바는 80~320초를 덮는다.
    expect(readPlayheadRatio(extension)).toBeCloseTo(0.5, 2)
  })
})

async function startWithTimeline() {
  const extension = await startWithFakes()
  loadTimeline(extension, [TIMELINE_COMMENT])

  return extension
}

async function startEditingAt(timestampSeconds) {
  const extension = await startWithTimeline()
  extension.player.playTo(timestampSeconds)
  openEditRow(extension, '둘째 곡')

  return extension
}

// 표시의 가운데를 이 값에 맞추는 것은 CSS다. 여기서는 적어 둔 비율만 읽고, 실제 자리는 e2e가 맡는다.
function readPlayheadRatio(extension) {
  return Number.parseFloat(find(extension, PLAYHEAD).style.left) / 100
}
