import { describe, it, expect } from 'vitest'

import { findEditRange } from '../../../src/core/editing/findEditRange.js'

const tracks = [
  { startSeconds: 0, endSeconds: 300, trimmedEndSeconds: null, title: '첫 곡' },
  { startSeconds: 300, endSeconds: 600, trimmedEndSeconds: null, title: '둘째 곡' },
  { startSeconds: 600, endSeconds: 1800, trimmedEndSeconds: null, title: '셋째 곡' }
]

const DURATION_SECONDS = 1800

describe('findEditRange', () => {
  it('앞 트랙 시작 1초 뒤부터 시작을 옮길 수 있다', () => {
    const result = findEditRange(tracks, 300, 300, DURATION_SECONDS)

    expect(result.startMinSeconds).toBe(1)
  })

  it('다음 트랙의 시작이 범위의 끝이다', () => {
    const result = findEditRange(tracks, 300, 300, DURATION_SECONDS)

    expect(result.toSeconds).toBe(600)
  })

  it('첫 트랙이면 0초부터 옮길 수 있다', () => {
    const result = findEditRange(tracks, 0, 0, DURATION_SECONDS)

    expect(result.startMinSeconds).toBe(0)
  })

  it('마지막 트랙이면 영상 길이가 범위의 끝이다', () => {
    const result = findEditRange(tracks, 600, 600, DURATION_SECONDS)

    expect(result.toSeconds).toBe(1800)
  })

  it('마지막 트랙이고 영상 길이를 모르면(0 또는 NaN) 범위의 끝은 null이다', () => {
    const withNaN = findEditRange(tracks, 600, 600, NaN)
    const withZero = findEditRange(tracks, 600, 600, 0)

    expect(withNaN.toSeconds).toBe(null)
    expect(withZero.toSeconds).toBe(null)
  })

  it('편집 중인 트랙 자신은 이웃으로 치지 않는다', () => {
    const result = findEditRange(tracks, 300, 305, DURATION_SECONDS)

    expect(result).toEqual({ startMinSeconds: 1, toSeconds: 600 })
  })

  it('새로 추가하는 시각에 이미 트랙이 있으면 그 트랙을 앞 이웃으로 본다', () => {
    const result = findEditRange(tracks, null, 300, DURATION_SECONDS)

    expect(result).toEqual({ startMinSeconds: 301, toSeconds: 600 })
  })

  it('직접 입력으로 다음 트랙을 넘어간 시작은 넘어간 자리의 이웃을 따른다', () => {
    const result = findEditRange(tracks, 300, 700, DURATION_SECONDS)

    expect(result).toEqual({ startMinSeconds: 601, toSeconds: 1800 })
  })

  it('영상 길이를 넘은 시각이어도 범위의 끝은 영상 길이다', () => {
    const result = findEditRange(tracks, 300, 2000, DURATION_SECONDS)

    expect(result.toSeconds).toBe(1800)
  })

  it('트랙 순서가 뒤섞여 있어도 시각 기준으로 이웃을 찾는다', () => {
    const shuffled = [tracks[2], tracks[0], tracks[1]]

    const result = findEditRange(shuffled, 300, 300, DURATION_SECONDS)

    expect(result).toEqual({ startMinSeconds: 1, toSeconds: 600 })
  })

  it('트랙이 하나도 없으면 0초부터 영상 끝까지다', () => {
    const result = findEditRange([], null, 120, DURATION_SECONDS)

    expect(result).toEqual({ startMinSeconds: 0, toSeconds: 1800 })
  })
})
