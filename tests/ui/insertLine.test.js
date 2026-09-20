// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from 'vitest'
import { FIXTURE_VIDEO_SECONDS } from '../fixtures/media/fixtureVideo.js'
import { startWithFakes } from '../fixtures/fakes/startWithFakes.js'
import { fillInput, find, loadTimeline, openEditRow } from '../fixtures/fakes/panelHelpers.js'

const TIMELINE_COMMENT = ['00:00 첫 곡', '05:00 둘째 곡', '10:00 셋째 곡', '15:00 넷째 곡'].join('\n')

const LINE = '.timeline-skip-insert-line'
const START_INPUT = '.timeline-skip-time-input'
const TIME = '.timeline-skip-time'

// 선은 손이 멈춘 뒤에 움직인다. 넉넉히 지나 보내고 자리를 본다.
const SETTLED_MILLISECONDS = 500
const MID_TYPING_MILLISECONDS = 100

afterEach(() => {
  vi.useRealTimers()
})

describe('들어갈 자리 선', () => {
  it('시각을 고치면 들어갈 자리에 선이 생긴다', async () => {
    const extension = await startWithTimeline()
    openEditRow(extension, '둘째 곡')

    typeStart(extension, '12:00')

    expect(readTimeAbove(extension)).toBe('10:00')
  })

  it('자리가 그대로면 고치는 중인 행 바로 위에 선이 생긴다', async () => {
    const extension = await startWithTimeline()
    openEditRow(extension, '둘째 곡')

    typeStart(extension, '04:30')

    expect(find(extension, LINE).nextElementSibling.classList.contains('is-edit-target')).toBe(true)
  })

  it('읽을 수 없는 시각이면 선을 그리지 않는다', async () => {
    const extension = await startWithTimeline()
    openEditRow(extension, '둘째 곡')
    typeStart(extension, '12:00')
    expect(find(extension, LINE)).not.toBeNull()

    typeStart(extension, '어제')

    expect(find(extension, LINE)).toBeNull()
  })

  it('치는 도중에는 선을 옮기지 않는다', async () => {
    const extension = await startWithTimeline()
    openEditRow(extension, '둘째 곡')
    typeStart(extension, '12:00')

    typeStart(extension, '01:00', MID_TYPING_MILLISECONDS)

    expect(readTimeAbove(extension)).toBe('10:00')
  })
})

async function startWithTimeline() {
  const extension = await startWithFakes({ durationSeconds: FIXTURE_VIDEO_SECONDS })
  loadTimeline(extension, [TIMELINE_COMMENT])
  vi.useFakeTimers()

  return extension
}

function typeStart(extension, text, waitMilliseconds = SETTLED_MILLISECONDS) {
  fillInput(extension, START_INPUT, text)
  vi.advanceTimersByTime(waitMilliseconds)
}

function readTimeAbove(extension) {
  return find(extension, LINE).previousElementSibling.querySelector(TIME).textContent
}
