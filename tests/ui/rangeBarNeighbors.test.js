// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { startWithFakes } from '../fixtures/fakes/startWithFakes.js'
import { clickButton, fillInput, find, findAll, loadTimeline, openEditRow } from '../fixtures/fakes/panelHelpers.js'

// 둘째 곡(04:29)을 고친다. 앞 트랙은 끝이 정해져 있지 않아 이 트랙의 시작까지 이어진다.
// 픽스처 영상은 1800초라 바가 덮는 시간은 여유를 붙여 240.3~584.7초가 된다.
const TIMELINE_COMMENT = ['00:01 01.Ballerino', '04:29 02.둘째 곡', '09:16 03.셋째 곡'].join('\n')

const BAR = '.timeline-skip-range-bar'
const FILL = '.timeline-skip-range-fill'
const NEIGHBOR = '.timeline-skip-range-neighbor'
const START_INPUT = '.timeline-skip-time-input'
const END_INPUT = '.timeline-skip-end-input'

describe('바 위의 이웃 트랙', () => {
  it('앞 트랙과 뒤 트랙이 바에 함께 그려진다', async () => {
    const extension = await startWithTimeline()

    openEditRow(extension, '02.둘째 곡')

    const neighbors = readNeighborRatios(extension)
    expect(neighbors).toHaveLength(2)
    expect(neighbors[0].left + neighbors[0].width).toBeCloseTo(0.0833, 2)
    expect(neighbors[1].left).toBeCloseTo(0.9167, 2)
  })

  it('시작 칸을 당기면 앞 트랙 칠이 그만큼 줄어든다', async () => {
    const extension = await startWithTimeline()
    openEditRow(extension, '02.둘째 곡')

    fillInput(extension, START_INPUT, '04:10')

    const [previous] = readNeighborRatios(extension)
    expect(previous.left + previous.width).toBeCloseTo(0.0282, 2)
  })

  it('시작 칸을 늦추면 앞 트랙 칠이 그만큼 늘어난다', async () => {
    const extension = await startWithTimeline()
    openEditRow(extension, '02.둘째 곡')

    fillInput(extension, START_INPUT, '05:00')

    const [previous] = readNeighborRatios(extension)
    expect(previous.left + previous.width).toBeCloseTo(0.1733, 2)
  })

  it('앞 트랙의 끝을 당겨 두면 그 뒤는 빈 자리로 남는다', async () => {
    const extension = await startWithTimeline()
    openEditRow(extension, '01.Ballerino')
    fillInput(extension, END_INPUT, '03:00')
    clickButton(extension, '저장')

    openEditRow(extension, '02.둘째 곡')

    const [previous] = readNeighborRatios(extension)
    const fill = readRatios(find(extension, FILL))
    expect(previous.left + previous.width).toBeLessThan(fill.left - 0.05)
  })

  it('추가 행에서도 앞뒤 트랙이 그려진다', async () => {
    const extension = await startWithTimeline()
    extension.player.playTo(100)

    clickButton(extension, '자세히 추가')

    expect(findAll(extension, NEIGHBOR)).toHaveLength(2)
  })

  it('시작이 바의 범위를 벗어나면 왼쪽 가장자리에 표시가 보인다', async () => {
    const extension = await startWithTimeline()
    openEditRow(extension, '02.둘째 곡')

    fillInput(extension, START_INPUT, '03:00')

    expect(find(extension, BAR).classList.contains('is-overflow-start')).toBe(true)
  })

  it('시작이 범위 안에 있으면 가장자리에 표시가 없다', async () => {
    const extension = await startWithTimeline()

    openEditRow(extension, '02.둘째 곡')

    expect(find(extension, BAR).classList.contains('is-overflow-start')).toBe(false)
  })
})

async function startWithTimeline() {
  const extension = await startWithFakes()
  loadTimeline(extension, [TIMELINE_COMMENT])

  return extension
}

// jsdom은 자리를 그리지 않는다. 바에 대한 비율로 적어 둔 값을 읽는다. 실제 픽셀 자리는 e2e가 맡는다.
function readRatios({ style }) {
  return { left: Number.parseFloat(style.left) / 100, width: Number.parseFloat(style.width) / 100 }
}

function readNeighborRatios(extension) {
  return findAll(extension, NEIGHBOR).map(readRatios)
}
