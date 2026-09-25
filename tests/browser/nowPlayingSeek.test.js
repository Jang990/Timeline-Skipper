import { describe, it, expect } from 'vitest'
import { userEvent } from '@vitest/browser/context'
import { openTimeline, playTo, readBox, isFullyVisible, SNAPSHOT_COMMENTS } from './helpers.js'

const BAR = '#timeline-skip-panel .timeline-skip-now-playing .timeline-skip-now-playing-bar'
const FILL = `${BAR} .timeline-skip-now-playing-fill`
const KNOB = `${BAR} .timeline-skip-now-playing-knob`
const PIXEL_TOLERANCE = 1.5

describe('지금 재생 중 진행 바로 옮기기', () => {
  it('진행 바의 동그라미는 바 밖으로 잘리지 않고 채움 끝에 놓인다', async () => {
    const extension = await openTimeline(SNAPSHOT_COMMENTS)
    await playTo(extension, 1026 + 227 * 0.5)
    await userEvent.hover(document.body, { position: { x: 1, y: 1 } })

    const bar = readBox(BAR)
    const fill = readBox(FILL)
    const knob = readBox(KNOB)
    expect(knob.height).toBeGreaterThan(bar.height)
    expect(Math.abs(knob.x + knob.width / 2 - (fill.x + fill.width))).toBeLessThanOrEqual(PIXEL_TOLERANCE)
    expect(Math.abs(knob.y + knob.height / 2 - (bar.y + bar.height / 2))).toBeLessThanOrEqual(PIXEL_TOLERANCE)
    expect(isFullyVisible(document.querySelector(KNOB))).toBe(true)
  })
})
