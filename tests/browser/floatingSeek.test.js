import { describe, it, expect } from 'vitest'
import { userEvent } from '@vitest/browser/context'
import { openTimeline, playTo, click, readBox, isFullyVisible, SNAPSHOT_COMMENTS } from './helpers.js'

const FLOATING = '#timeline-skip-floating'
const KNOB = `${FLOATING} .timeline-skip-now-playing-bar .timeline-skip-now-playing-knob`

describe('떠 있는 위젯의 진행 바', () => {
  it('위젯 진행 바의 동그라미는 잘리지 않고 제목 줄과 버튼 줄 사이에 놓인다', async () => {
    const extension = await openTimeline(SNAPSHOT_COMMENTS)
    await playTo(extension, 1026 + 227 * 0.5)
    await click(`${FLOATING} .timeline-skip-floating-icon`)
    await userEvent.hover(document.body, { position: { x: 1, y: 1 } })

    const title = readBox(`${FLOATING} .timeline-skip-floating-title`)
    const knob = readBox(KNOB)
    const controls = readBox(`${FLOATING} .timeline-skip-controls`)
    expect(knob.y).toBeGreaterThanOrEqual(title.y + title.height)
    expect(knob.y + knob.height).toBeLessThanOrEqual(controls.y)
    expect(isFullyVisible(document.querySelector(KNOB))).toBe(true)
  })
})
