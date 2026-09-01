import { describe, it, expect } from 'vitest'

import { findSkipTarget } from '../../../src/core/playback/findSkipTarget.js'

const tracks = [
  { startSeconds: 10, endSeconds: 100, title: '첫 곡' },
  { startSeconds: 100, endSeconds: 200, title: '둘째 곡' },
  { startSeconds: 200, endSeconds: 300, title: '셋째 곡' },
  { startSeconds: 300, endSeconds: 420, title: '마지막 곡' }
]

describe('findSkipTarget', () => {
  it('현재 트랙이 켜져 있으면 건너뛰지 않는다', () => {
    const result = findSkipTarget(tracks, new Set([200]), 50)

    expect(result).toBe(null)
  })

  it('현재 트랙이 해제돼 있으면 다음 트랙의 시작 시각을 반환한다', () => {
    const result = findSkipTarget(tracks, new Set([10]), 50)

    expect(result).toBe(100)
  })

  it('연속으로 해제된 트랙은 한 번에 건너뛴다', () => {
    const result = findSkipTarget(tracks, new Set([10, 100, 200]), 50)

    expect(result).toBe(300)
  })

  it('남은 트랙이 전부 해제돼 있으면 영상 끝 시각을 반환한다', () => {
    const result = findSkipTarget(tracks, new Set([200, 300]), 250)

    expect(result).toBe(420)
  })

  it('마지막 트랙이 해제됐고 영상 길이를 모르면 건너뛰지 않는다', () => {
    const liveTracks = [
      { startSeconds: 10, endSeconds: 100, title: '첫 곡' },
      { startSeconds: 100, endSeconds: null, title: '진행 중인 곡' }
    ]

    const result = findSkipTarget(liveTracks, new Set([100]), 150)

    expect(result).toBe(null)
  })

  it('첫 트랙 시작 전에는 건너뛰지 않는다', () => {
    const result = findSkipTarget(tracks, new Set([10]), 5)

    expect(result).toBe(null)
  })

  it('트랙의 시작 시각 정각은 그 트랙에 속한다', () => {
    const result = findSkipTarget(tracks, new Set([100]), 100)

    expect(result).toBe(200)
  })

  it('트랙의 끝 시각 정각은 다음 트랙에 속한다', () => {
    const result = findSkipTarget(tracks, new Set([100]), 200)

    expect(result).toBe(null)
  })

  it('트랙이 하나도 없으면 건너뛰지 않는다', () => {
    const result = findSkipTarget([], new Set([10]), 50)

    expect(result).toBe(null)
  })

  it('해제된 트랙이 하나도 없으면 건너뛰지 않는다', () => {
    const result = findSkipTarget(tracks, new Set(), 50)

    expect(result).toBe(null)
  })
})
