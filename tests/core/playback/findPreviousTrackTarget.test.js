import { describe, it, expect } from 'vitest'

import { findPreviousTrackTarget } from '../../../src/core/playback/findPreviousTrackTarget.js'

const tracks = [
  { startSeconds: 10, endSeconds: 100, title: '첫 곡' },
  { startSeconds: 100, endSeconds: 200, title: '둘째 곡' },
  { startSeconds: 200, endSeconds: 300, title: '셋째 곡' },
  { startSeconds: 300, endSeconds: 420, title: '마지막 곡' }
]

describe('findPreviousTrackTarget', () => {
  it('앞에 체크된 트랙이 있으면 그 트랙으로 간다', () => {
    const result = findPreviousTrackTarget({ tracks, disabledStartSeconds: new Set(), loopEnabled: false }, 102)

    expect(result).toBe(10)
  })

  it('첫 트랙 3초 안이고 반복이 꺼져 있으면 첫 트랙의 처음으로 되감는다', () => {
    const result = findPreviousTrackTarget({ tracks, disabledStartSeconds: new Set(), loopEnabled: false }, 12)

    expect(result).toBe(10)
  })

  it('첫 트랙 3초 안이고 반복이 켜져 있으면 마지막 체크된 트랙으로 간다', () => {
    const result = findPreviousTrackTarget({ tracks, disabledStartSeconds: new Set(), loopEnabled: true }, 12)

    expect(result).toBe(300)
  })

  it('반복이 켜져 있고 마지막 트랙이 해제돼 있으면 그 앞의 체크된 트랙으로 간다', () => {
    const result = findPreviousTrackTarget({ tracks, disabledStartSeconds: new Set([300]), loopEnabled: true }, 12)

    expect(result).toBe(200)
  })

  it('첫 트랙이 해제돼 있으면 첫 체크된 트랙을 첫 트랙으로 보고 그 처음으로 되감는다', () => {
    const result = findPreviousTrackTarget({ tracks, disabledStartSeconds: new Set([10]), loopEnabled: false }, 102)

    expect(result).toBe(100)
  })

  it('첫 트랙 시작 전이고 반복이 꺼져 있으면 null을 반환한다', () => {
    const result = findPreviousTrackTarget({ tracks, disabledStartSeconds: new Set(), loopEnabled: false }, 5)

    expect(result).toBe(null)
  })

  it('첫 트랙 시작 전이고 반복이 켜져 있으면 마지막 체크된 트랙으로 간다', () => {
    const result = findPreviousTrackTarget({ tracks, disabledStartSeconds: new Set(), loopEnabled: true }, 5)

    expect(result).toBe(300)
  })

  it('체크된 트랙이 하나도 없으면 null을 반환한다', () => {
    const result = findPreviousTrackTarget({ tracks, disabledStartSeconds: new Set([10, 100, 200, 300]), loopEnabled: true }, 150)

    expect(result).toBe(null)
  })

  it('트랙이 없으면 null을 반환한다', () => {
    expect(findPreviousTrackTarget({ tracks: [], disabledStartSeconds: new Set(), loopEnabled: false }, 50)).toBe(null)
  })
})
