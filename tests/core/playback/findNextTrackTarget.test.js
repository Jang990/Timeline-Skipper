import { describe, it, expect } from 'vitest'

import { findNextTrackTarget } from '../../../src/core/playback/findNextTrackTarget.js'

const tracks = [
  { startSeconds: 10, endSeconds: 100, title: '첫 곡' },
  { startSeconds: 100, endSeconds: 200, title: '둘째 곡' },
  { startSeconds: 200, endSeconds: 300, title: '셋째 곡' },
  { startSeconds: 300, endSeconds: 420, title: '마지막 곡' }
]

describe('findNextTrackTarget', () => {
  it('뒤에 체크된 트랙이 있으면 그 트랙으로 가고 멈추지 않는다', () => {
    const result = findNextTrackTarget({ tracks, disabledStartSeconds: new Set(), loopEnabled: false }, 150)

    expect(result).toEqual({ targetSeconds: 200, shouldPause: false })
  })

  it('마지막 트랙이면 첫 체크된 트랙으로 가고 멈춘다', () => {
    const result = findNextTrackTarget({ tracks, disabledStartSeconds: new Set(), loopEnabled: false }, 350)

    expect(result).toEqual({ targetSeconds: 10, shouldPause: true })
  })

  it('뒤 트랙이 모두 해제돼 있으면 첫 체크된 트랙으로 가고 멈춘다', () => {
    const result = findNextTrackTarget({ tracks, disabledStartSeconds: new Set([200, 300]), loopEnabled: false }, 150)

    expect(result).toEqual({ targetSeconds: 10, shouldPause: true })
  })

  it('첫 트랙이 해제돼 있으면 그다음 체크된 트랙으로 돌아간다', () => {
    const result = findNextTrackTarget({ tracks, disabledStartSeconds: new Set([10]), loopEnabled: false }, 350)

    expect(result).toEqual({ targetSeconds: 100, shouldPause: true })
  })

  it('반복이 켜져 있으면 첫 체크된 트랙으로 가되 멈추지 않는다', () => {
    const result = findNextTrackTarget({ tracks, disabledStartSeconds: new Set(), loopEnabled: true }, 350)

    expect(result).toEqual({ targetSeconds: 10, shouldPause: false })
  })

  it('체크된 트랙이 하나도 없으면 null을 반환한다', () => {
    const result = findNextTrackTarget({ tracks, disabledStartSeconds: new Set([10, 100, 200, 300]), loopEnabled: false }, 150)

    expect(result).toBe(null)
  })

  it('트랙이 없으면 null을 반환한다', () => {
    expect(findNextTrackTarget({ tracks: [], disabledStartSeconds: new Set(), loopEnabled: false }, 50)).toBe(null)
  })
})
