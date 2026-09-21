import { describe, it, expect } from 'vitest'

import { findEndedTarget } from '../../../src/core/playback/findEndedTarget.js'

const TRACKS = [
  { startSeconds: 10, endSeconds: 100, title: '첫 곡' },
  { startSeconds: 100, endSeconds: 200, title: '둘째 곡' },
  { startSeconds: 200, endSeconds: 300, title: '마지막 곡' }
]

function createPlayback(overrides = {}) {
  return { tracks: TRACKS, disabledStartSeconds: new Set(), loopEnabled: true, isEditing: false, ...overrides }
}

describe('findEndedTarget', () => {
  it('반복이 켜져 있으면 첫 트랙의 시작을 반환한다', () => {
    const result = findEndedTarget(createPlayback())

    expect(result).toBe(10)
  })

  it('첫 트랙이 해제돼 있으면 그다음 켜진 트랙의 시작을 반환한다', () => {
    const result = findEndedTarget(createPlayback({ disabledStartSeconds: new Set([10]) }))

    expect(result).toBe(100)
  })

  it('반복이 꺼져 있으면 null을 반환한다', () => {
    const result = findEndedTarget(createPlayback({ loopEnabled: false }))

    expect(result).toBe(null)
  })

  it('편집 중이면 null을 반환한다', () => {
    const result = findEndedTarget(createPlayback({ isEditing: true }))

    expect(result).toBe(null)
  })

  it('꺼져 있으면 영상이 끝나도 처음으로 돌아가지 않는다', () => {
    const result = findEndedTarget(createPlayback({ isTurnedOff: true }))

    expect(result).toBe(null)
  })

  it('켜진 트랙이 하나도 없으면 null을 반환한다', () => {
    const result = findEndedTarget(createPlayback({ disabledStartSeconds: new Set([10, 100, 200]) }))

    expect(result).toBe(null)
  })

  it('트랙이 하나도 없으면 null을 반환한다', () => {
    const result = findEndedTarget(createPlayback({ tracks: [] }))

    expect(result).toBe(null)
  })
})
