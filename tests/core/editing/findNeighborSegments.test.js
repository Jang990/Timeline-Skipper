import { describe, expect, it } from 'vitest'

import { findNeighborSegments } from '../../../src/core/editing/findNeighborSegments.js'

// 끝을 당겨 둔 트랙이 하나도 없는, 댓글을 막 불러온 상태다.
const TRACKS = [
  { startSeconds: 1, endSeconds: 269, trimmedEndSeconds: null, title: '01.Ballerino' },
  { startSeconds: 269, endSeconds: 556, trimmedEndSeconds: null, title: '02.헤어지지 못하는 여자' },
  { startSeconds: 556, endSeconds: 1800, trimmedEndSeconds: null, title: '03.눈물' }
]

describe('findNeighborSegments', () => {
  it('앞 트랙과 뒤 트랙을 각자의 구간으로 돌려준다', () => {
    const segments = findNeighborSegments(TRACKS, 269, 269)

    expect(segments).toEqual([
      { fromSeconds: 1, toSeconds: 269 },
      { fromSeconds: 556, toSeconds: 1800 }
    ])
  })

  it('끝을 정해 두지 않은 앞 트랙은 편집 중인 시작까지 이어진다', () => {
    const segments = findNeighborSegments(TRACKS, 269, 269)

    expect(segments[0].toSeconds).toBe(269)
  })

  it('시작을 당기면 앞 트랙의 구간이 그만큼 줄어든다', () => {
    const segments = findNeighborSegments(TRACKS, 269, 240)

    expect(segments[0]).toEqual({ fromSeconds: 1, toSeconds: 240 })
  })

  it('시작을 늦추면 끝을 정해 두지 않은 앞 트랙이 그만큼 늘어난다', () => {
    const segments = findNeighborSegments(TRACKS, 269, 300)

    expect(segments[0]).toEqual({ fromSeconds: 1, toSeconds: 300 })
  })

  it('끝을 당겨 둔 앞 트랙은 편집 중인 시작을 따라오지 않는다', () => {
    const tracks = [{ ...TRACKS[0], endSeconds: 200, trimmedEndSeconds: 200 }, TRACKS[1], TRACKS[2]]

    const segments = findNeighborSegments(tracks, 269, 300)

    expect(segments[0]).toEqual({ fromSeconds: 1, toSeconds: 200 })
  })

  it('끝을 당겨 둔 트랙도 다음 트랙이 시작하는 곳을 넘지 않는다', () => {
    const tracks = [{ ...TRACKS[0], endSeconds: 400, trimmedEndSeconds: 400 }, TRACKS[1], TRACKS[2]]

    const segments = findNeighborSegments(tracks, 269, 269)

    expect(segments[0]).toEqual({ fromSeconds: 1, toSeconds: 269 })
  })

  it('고치는 중인 트랙 자신은 구간에 넣지 않는다', () => {
    const segments = findNeighborSegments(TRACKS, 269, 269)

    expect(segments.some((segment) => segment.fromSeconds === 269)).toBe(false)
  })

  it('추가 중이면 모든 트랙이 구간으로 나온다', () => {
    const segments = findNeighborSegments(TRACKS, null, 100)

    expect(segments).toEqual([
      { fromSeconds: 1, toSeconds: 100 },
      { fromSeconds: 269, toSeconds: 556 },
      { fromSeconds: 556, toSeconds: 1800 }
    ])
  })

  it('마지막 트랙은 영상이 끝나는 시각까지 이어진다', () => {
    const segments = findNeighborSegments(TRACKS, 269, 269)

    expect(segments.at(-1)).toEqual({ fromSeconds: 556, toSeconds: 1800 })
  })

  it('끝을 알 수 없거나 길이가 없는 구간은 돌려주지 않는다', () => {
    const tracks = [TRACKS[0], TRACKS[1], { ...TRACKS[2], endSeconds: null }]

    const segments = findNeighborSegments(tracks, 269, 269)

    expect(segments).toEqual([{ fromSeconds: 1, toSeconds: 269 }])
  })

  it('트랙이 순서 없이 들어와도 각자의 구간을 바르게 잡는다', () => {
    const segments = findNeighborSegments([TRACKS[2], TRACKS[0], TRACKS[1]], 269, 269)

    expect(segments).toEqual([
      { fromSeconds: 1, toSeconds: 269 },
      { fromSeconds: 556, toSeconds: 1800 }
    ])
  })

  it('트랙이 하나도 없으면 빈 배열을 돌려준다', () => {
    const segments = findNeighborSegments([], null, 100)

    expect(segments).toEqual([])
  })
})
