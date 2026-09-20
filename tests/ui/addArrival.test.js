// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { FIXTURE_VIDEO_SECONDS } from '../fixtures/media/fixtureVideo.js'
import { startWithFakes } from '../fixtures/fakes/startWithFakes.js'
import {
  clickButton,
  fillInput,
  find,
  loadTimeline,
  openEditRow,
  pressKey,
  toggleTrack
} from '../fixtures/fakes/panelHelpers.js'

const TIMELINE_COMMENT = ['00:00 첫 곡', '10:00 둘째 곡', '20:00 셋째 곡'].join('\n')

const ARRIVED_TIME = '.timeline-skip-row.is-arrived .timeline-skip-time'
const ARRIVED_ROW = '.timeline-skip-row.is-arrived'
const QUICK_INPUT = '.timeline-skip-quick-input'
const START_INPUT = '.timeline-skip-time-input'

describe('들어간 자리 보여주기', () => {
  it('한 줄 칸으로 추가하면 그 행에 도착 표시가 붙는다', async () => {
    const extension = await startWithTimeline()

    quickAdd(extension, '02:30 새 곡')

    expect(readArrivedTime(extension)).toBe('02:30')
  })

  it('시트로 추가해도 그 행에 도착 표시가 붙는다', async () => {
    const extension = await startWithTimeline()
    clickButton(extension, '자세히 추가')

    fillInput(extension, START_INPUT, '05:00')
    clickButton(extension, '저장')

    expect(readArrivedTime(extension)).toBe('05:00')
  })

  it('시각을 옮겨 저장하면 옮겨간 행에 도착 표시가 붙는다', async () => {
    const extension = await startWithTimeline()
    openEditRow(extension, '둘째 곡')

    fillInput(extension, START_INPUT, '25:00')
    clickButton(extension, '저장')

    expect(readArrivedTime(extension)).toBe('25:00')
  })

  it('여러 줄을 한 번에 붙여넣으면 첫 번째 행에 도착 표시가 붙는다', async () => {
    const extension = await startWithTimeline()

    quickAdd(extension, '03:00 가\n04:00 나')

    expect(readArrivedTime(extension)).toBe('03:00')
  })

  it('체크만 해제할 때는 도착 표시가 붙지 않는다', async () => {
    const extension = await startWithTimeline()

    toggleTrack(extension, 1)

    expect(find(extension, ARRIVED_ROW)).toBeNull()
  })

  it('도착 표시는 다음에 다시 그릴 때 따라오지 않는다', async () => {
    const extension = await startWithTimeline()
    quickAdd(extension, '02:30 새 곡')

    toggleTrack(extension, 0)

    expect(find(extension, ARRIVED_ROW)).toBeNull()
  })
})

async function startWithTimeline() {
  const extension = await startWithFakes({ durationSeconds: FIXTURE_VIDEO_SECONDS })
  loadTimeline(extension, [TIMELINE_COMMENT])

  return extension
}

function quickAdd(extension, text) {
  fillInput(extension, QUICK_INPUT, text)
  pressKey(extension, QUICK_INPUT, 'Enter')
}

function readArrivedTime(extension) {
  return find(extension, ARRIVED_TIME)?.textContent ?? null
}
