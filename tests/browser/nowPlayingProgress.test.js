import { describe, it, expect } from 'vitest'
import { openTimeline, playTo, readBox, SNAPSHOT_COMMENTS } from './helpers.js'

const BAR = '#timeline-skip-panel .timeline-skip-now-playing .timeline-skip-now-playing-progress .timeline-skip-now-playing-bar'
const FILL = `${BAR} .timeline-skip-now-playing-fill`

describe('지금 재생 중 진행 바', () => {
  it('진행 바는 트랙 안에서 흐른 비율만큼 채워진다', async () => {
    const extension = await openTimeline(SNAPSHOT_COMMENTS)

    await playTo(extension, 1026 + 227 * 0.5)

    await expect.poll(() => Math.abs(readBox(FILL).width / readBox(BAR).width - 0.5)).toBeLessThanOrEqual(0.02)
  })
})
