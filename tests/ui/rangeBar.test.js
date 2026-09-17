// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { startWithFakes } from '../fixtures/fakes/startWithFakes.js'
import { clickButton, fillInput, find, loadTimeline, openEditRow, readText } from '../fixtures/fakes/panelHelpers.js'

// 둘째 곡(05:00)을 고친다. 앞뒤에 트랙이 있어야 이웃 사이를 잡는 것이 보인다.
// 픽스처 영상은 1800초라, 이웃 사이 300~600초에 여유가 붙어 범위는 270~630초가 된다.
const TIMELINE_COMMENT = ['00:00 첫 곡', '05:00 둘째 곡', '10:00 셋째 곡'].join('\n')

const RANGE = '.timeline-skip-range'
const BAR = '.timeline-skip-range-bar'
const FILL = '.timeline-skip-range-fill'
const FROM_LABEL = '.timeline-skip-range-from'
const TO_LABEL = '.timeline-skip-range-to'
const START_INPUT = '.timeline-skip-time-input'
const END_INPUT = '.timeline-skip-end-input'

describe('구간 바', () => {
  it('편집 행을 열면 구간 바가 보인다', async () => {
    const extension = await startWithTimeline()

    openEditRow(extension, '둘째 곡')

    expect(find(extension, BAR)).not.toBeNull()
  })

  it('바의 양 끝에 범위가 시작하고 끝나는 시각이 적혀 있다', async () => {
    const extension = await startWithTimeline()

    openEditRow(extension, '둘째 곡')

    expect(readText(extension, FROM_LABEL)).toBe('04:30')
    expect(readText(extension, TO_LABEL)).toBe('10:30')
  })

  it('칠해진 구간이 트랙의 시작과 끝 자리에 놓인다', async () => {
    const extension = await startWithTimeline()

    openEditRow(extension, '둘째 곡')

    const fill = readFillRatios(extension)
    expect(fill.left).toBeCloseTo(0.0833, 2)
    expect(fill.width).toBeCloseTo(0.8333, 2)
  })

  it('시작 칸을 고치면 칠해진 구간이 따라 움직인다', async () => {
    const extension = await startWithTimeline()
    openEditRow(extension, '둘째 곡')

    fillInput(extension, START_INPUT, '06:00')

    const fill = readFillRatios(extension)
    expect(fill.left).toBeCloseTo(0.25, 2)
    expect(fill.width).toBeCloseTo(0.6667, 2)
  })

  it('[지금으로]로 끝을 옮겨도 칠해진 구간이 따라 움직인다', async () => {
    const extension = await startWithTimeline()
    openEditRow(extension, '둘째 곡')
    extension.player.playTo(590)

    clickButton(extension, '끝을 지금 위치로')

    expect(readFillRatios(extension).width).toBeCloseTo(0.8056, 2)
  })

  it('끝 칸을 비우면 칠해진 구간이 다음 트랙이 시작하는 곳까지 늘어난다', async () => {
    const extension = await startWithTimeline()
    openEditRow(extension, '둘째 곡')
    fillInput(extension, END_INPUT, '06:00')

    fillInput(extension, END_INPUT, '')

    expect(readFillRatios(extension).width).toBeCloseTo(0.8333, 2)
  })

  it('바의 범위는 시작 칸을 고쳐도 그대로다', async () => {
    const extension = await startWithTimeline()
    openEditRow(extension, '둘째 곡')

    fillInput(extension, START_INPUT, '06:00')

    expect(readText(extension, FROM_LABEL)).toBe('04:30')
    expect(readText(extension, TO_LABEL)).toBe('10:30')
  })

  it('추가 행에도 구간 바가 보인다', async () => {
    const extension = await startWithTimeline()
    extension.player.playTo(100)

    find(extension, '.timeline-skip-add').click()

    expect(find(extension, BAR)).not.toBeNull()
    expect(readText(extension, FROM_LABEL)).toBe('01:20')
    expect(readText(extension, TO_LABEL)).toBe('05:20')
  })

  it('편집을 닫으면 구간 바가 사라진다', async () => {
    const extension = await startWithTimeline()
    openEditRow(extension, '둘째 곡')

    clickButton(extension, '취소')

    expect(find(extension, RANGE)).toBeNull()
  })

  it('영상 길이를 모르면 구간 바가 없다', async () => {
    const extension = await startWithTimeline({ durationSeconds: Number.NaN })

    openEditRow(extension, '둘째 곡')

    expect(find(extension, RANGE)).toBeNull()
  })
})

async function startWithTimeline(options) {
  const extension = await startWithFakes(options)
  loadTimeline(extension, [TIMELINE_COMMENT])

  return extension
}

// jsdom은 자리를 그리지 않는다. 바에 대한 비율로 적어 둔 값을 읽는다. 실제 픽셀 자리는 e2e가 맡는다.
function readFillRatios(extension) {
  const { style } = find(extension, FILL)

  return { left: Number.parseFloat(style.left) / 100, width: Number.parseFloat(style.width) / 100 }
}
