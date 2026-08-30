import { describe, it, expect } from 'vitest'

import { findLoopTarget } from '../../src/core/findLoopTarget.js'

const tracks = [
  { startSeconds: 10, endSeconds: 100, title: '첫 곡' },
  { startSeconds: 100, endSeconds: 200, title: '둘째 곡' },
  { startSeconds: 200, endSeconds: 300, title: '셋째 곡' },
  { startSeconds: 300, endSeconds: 420, title: '마지막 곡' }
]

describe('findLoopTarget', () => {
  it('마지막 트랙이 끝나면 첫 트랙의 시작으로 돌아간다', () => {
    const result = findLoopTarget(tracks, new Set(), 420)

    expect(result).toBe(10)
  })

  it('마지막 트랙을 재생하는 중에는 돌아가지 않는다', () => {
    const result = findLoopTarget(tracks, new Set(), 350)

    expect(result).toBe(null)
  })

  it('마지막 트랙이 해제돼 있으면 그 앞 켜진 트랙이 끝날 때 돌아간다', () => {
    const result = findLoopTarget(tracks, new Set([300]), 310)

    expect(result).toBe(10)
  })

  it('첫 트랙이 해제돼 있으면 그다음 켜진 트랙으로 돌아간다', () => {
    const result = findLoopTarget(tracks, new Set([10]), 420)

    expect(result).toBe(100)
  })

  it('켜진 트랙이 하나도 없으면 null을 반환한다', () => {
    const allDisabled = new Set(tracks.map((track) => track.startSeconds))

    const result = findLoopTarget(tracks, allDisabled, 420)

    expect(result).toBe(null)
  })

  it('영상 길이를 몰라 끝 시각이 없으면 null을 반환한다', () => {
    const liveTracks = [{ startSeconds: 10, endSeconds: null, title: '진행 중인 곡' }]

    const result = findLoopTarget(liveTracks, new Set(), 99999)

    expect(result).toBe(null)
  })

  it('트랙이 하나도 없으면 null을 반환한다', () => {
    const result = findLoopTarget([], new Set(), 420)

    expect(result).toBe(null)
  })
})
