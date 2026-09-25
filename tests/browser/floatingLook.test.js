import { describe, it, expect } from 'vitest'
import { openTimeline, click, readBox } from './helpers.js'

const TIMELINE_COMMENT = ['00:00 첫 곡', '05:00 둘째 곡', '10:00 셋째 곡'].join('\n')
const FLOATING = '#timeline-skip-floating'
const TOLERANCE = 4

describe('떠 있는 위젯의 배치', () => {
  it('순번 줄은 제목 바로 아래에 놓인다', async () => {
    await openTimeline([TIMELINE_COMMENT])
    await click(`${FLOATING} .timeline-skip-floating-icon`)

    const title = readBox(`${FLOATING} .timeline-skip-floating-title`)
    const meta = readBox(`${FLOATING} .timeline-skip-floating-meta`)
    const controls = readBox(`${FLOATING} .timeline-skip-controls`)
    expect(meta.y).toBeGreaterThanOrEqual(title.y + title.height - 1)
    expect(meta.y - (title.y + title.height)).toBeLessThanOrEqual(TOLERANCE)
    expect(Math.abs(meta.x - title.x)).toBeLessThanOrEqual(1)
    expect(meta.y + meta.height).toBeLessThanOrEqual(controls.y)
  })
})
