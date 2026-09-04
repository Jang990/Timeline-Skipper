import { describe, it, expect } from 'vitest'

import { findPlayingStartSeconds } from '../../../src/core/tracks/findPlayingStartSeconds.js'

const tracks = [
  { startSeconds: 10, endSeconds: 100, title: '첫 곡' },
  { startSeconds: 100, endSeconds: 200, title: '둘째 곡' }
]

describe('findPlayingStartSeconds', () => {
  it('현재 시각이 속한 트랙의 시작 시각을 반환한다', () => {
    const result = findPlayingStartSeconds(tracks, 50)

    expect(result).toBe(10)
  })

  it('트랙의 시작 시각 정각에는 그 트랙의 시작 시각을 반환한다', () => {
    const result = findPlayingStartSeconds(tracks, 10)

    expect(result).toBe(10)
  })

  it('다음 트랙의 시작 시각이 되면 다음 트랙으로 넘어간다', () => {
    const result = findPlayingStartSeconds(tracks, 100)

    expect(result).toBe(100)
  })

  it('첫 트랙 시작 전 구간에서는 null을 반환한다', () => {
    const result = findPlayingStartSeconds(tracks, 5)

    expect(result).toBeNull()
  })

  it('마지막 트랙의 끝 시각을 모르면 영상 끝까지 그 트랙으로 본다', () => {
    const liveTracks = [{ startSeconds: 10, endSeconds: null, title: '진행 중' }]

    const result = findPlayingStartSeconds(liveTracks, 99999)

    expect(result).toBe(10)
  })

  it('어떤 트랙에도 속하지 않는 시각이면 null을 반환한다', () => {
    const result = findPlayingStartSeconds(tracks, 200)

    expect(result).toBeNull()
  })

  it('트랙이 하나도 없으면 null을 반환한다', () => {
    const result = findPlayingStartSeconds([], 50)

    expect(result).toBeNull()
  })
})
