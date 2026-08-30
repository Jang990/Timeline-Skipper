import { describe, it, expect } from 'vitest'

import { findTrackAtTime } from '../../src/core/findTrackAtTime.js'

const tracks = [
  { startSeconds: 10, endSeconds: 100, title: '첫 곡' },
  { startSeconds: 100, endSeconds: 200, title: '둘째 곡' }
]

describe('findTrackAtTime', () => {
  it('현재 시각이 속한 트랙을 반환한다', () => {
    const result = findTrackAtTime(tracks, 50)

    expect(result).toEqual(tracks[0])
  })

  it('트랙의 시작 시각 정각은 그 트랙에 속한다', () => {
    const result = findTrackAtTime(tracks, 100)

    expect(result).toEqual(tracks[1])
  })

  it('트랙의 끝 시각 정각은 그 트랙에 속하지 않는다', () => {
    const result = findTrackAtTime(tracks, 200)

    expect(result).toBe(null)
  })

  it('끝 시각을 모르는 트랙은 영상 끝까지로 본다', () => {
    const liveTracks = [{ startSeconds: 10, endSeconds: null, title: '진행 중인 곡' }]

    const result = findTrackAtTime(liveTracks, 99999)

    expect(result).toEqual(liveTracks[0])
  })

  it('첫 트랙 시작 전이면 null을 반환한다', () => {
    const result = findTrackAtTime(tracks, 5)

    expect(result).toBe(null)
  })

  it('트랙이 하나도 없으면 null을 반환한다', () => {
    const result = findTrackAtTime([], 50)

    expect(result).toBe(null)
  })
})
