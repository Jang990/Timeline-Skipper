import { describe, it, expect } from 'vitest'
import { openTimeline, click, readBox } from './helpers.js'

const TIMELINE_COMMENT = ['00:00 첫 곡', '05:00 둘째 곡', '10:00 셋째 곡'].join('\n')
const PANEL = '#timeline-skip-panel'
const START_INPUT = `${PANEL} .timeline-skip-time-input`
const STEP_BUTTON = `${PANEL} .timeline-skip-step`
const TOLERANCE = 1

describe('편집 시트의 시간 영역 배치', () => {
  it('시각 칸과 세 버튼은 한 줄에 나란히 놓인다', async () => {
    await openTimeline([TIMELINE_COMMENT])

    await click(`${PANEL} button[aria-label="둘째 곡 수정"]`)

    const start = readBox(START_INPUT)
    const buttons = [...document.querySelectorAll(STEP_BUTTON)]
    expect(buttons).toHaveLength(3)
    let leftEdge = start.x + start.width
    for (const button of buttons) {
      const box = readBox(button)
      expect(Math.abs(box.y + box.height / 2 - (start.y + start.height / 2))).toBeLessThanOrEqual(start.height)
      expect(box.x).toBeGreaterThanOrEqual(leftEdge - TOLERANCE)
      leftEdge = box.x + box.width
    }
  })
})
