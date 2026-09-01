import { describe, it, expect } from 'vitest'

import { findAdjacentTrack } from '../../../src/core/playback/findAdjacentTrack.js'

const tracks = [
  { startSeconds: 10, endSeconds: 100, title: '첫 곡' },
  { startSeconds: 100, endSeconds: 200, title: '둘째 곡' },
  { startSeconds: 200, endSeconds: 300, title: '셋째 곡' },
  { startSeconds: 300, endSeconds: 420, title: '마지막 곡' }
]

describe('findAdjacentTrack', () => {
  it('다음: 현재 트랙 다음 트랙의 시작 시각으로 간다', () => {
    const result = findAdjacentTrack(tracks, new Set(), 50, 'next')

    expect(result).toBe(100)
  })

  it('다음: 해제된 트랙은 건너뛴다', () => {
    const result = findAdjacentTrack(tracks, new Set([100]), 50, 'next')

    expect(result).toBe(200)
  })

  it('다음: 뒤에 켜진 트랙이 없으면 null을 반환한다', () => {
    const result = findAdjacentTrack(tracks, new Set(), 350, 'next')

    expect(result).toBe(null)
  })

  it('다음: 첫 트랙 시작 전이면 첫 트랙으로 간다', () => {
    const result = findAdjacentTrack(tracks, new Set(), 5, 'next')

    expect(result).toBe(10)
  })

  it('이전: 현재 트랙을 3초 넘게 들었으면 그 트랙의 처음으로 간다', () => {
    const result = findAdjacentTrack(tracks, new Set(), 150, 'previous')

    expect(result).toBe(100)
  })

  it('이전: 현재 트랙을 3초 이내로 들었으면 이전 트랙으로 간다', () => {
    const result = findAdjacentTrack(tracks, new Set(), 102, 'previous')

    expect(result).toBe(10)
  })

  it('이전: 정확히 3초면 아직 이전 트랙으로 간다', () => {
    const result = findAdjacentTrack(tracks, new Set(), 103, 'previous')

    expect(result).toBe(10)
  })

  it('이전: 이전 트랙이 해제돼 있으면 그보다 앞의 켜진 트랙으로 간다', () => {
    const result = findAdjacentTrack(tracks, new Set([100]), 202, 'previous')

    expect(result).toBe(10)
  })

  it('이전: 첫 트랙의 3초 이내면 갈 곳이 없어 null을 반환한다', () => {
    const result = findAdjacentTrack(tracks, new Set(), 11, 'previous')

    expect(result).toBe(null)
  })

  it('이전: 첫 트랙 시작 전이면 null을 반환한다', () => {
    const result = findAdjacentTrack(tracks, new Set(), 5, 'previous')

    expect(result).toBe(null)
  })

  it('트랙이 하나도 없으면 null을 반환한다', () => {
    expect(findAdjacentTrack([], new Set(), 50, 'next')).toBe(null)
    expect(findAdjacentTrack([], new Set(), 50, 'previous')).toBe(null)
  })
})
