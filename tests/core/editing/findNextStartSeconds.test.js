import { describe, it, expect } from 'vitest'

import { findNextStartSeconds } from '../../../src/core/editing/findNextStartSeconds.js'

const tracks = [
  { startSeconds: 0, endSeconds: 300, title: '첫 곡' },
  { startSeconds: 300, endSeconds: 600, title: '둘째 곡' },
  { startSeconds: 600, endSeconds: 1800, title: '셋째 곡' }
]

const DURATION_SECONDS = 1800

describe('findNextStartSeconds', () => {
  it('다음 트랙이 있으면 그 시작 시각을 돌려준다', () => {
    const result = findNextStartSeconds(tracks, 300, 300, DURATION_SECONDS)

    expect(result).toBe(600)
  })

  it('마지막 트랙이면 영상 길이를 돌려준다', () => {
    const result = findNextStartSeconds(tracks, 600, 600, DURATION_SECONDS)

    expect(result).toBe(1800)
  })

  it('마지막 트랙이고 영상 길이를 모르면(0 또는 NaN) null을 돌려준다', () => {
    const withNaN = findNextStartSeconds(tracks, 600, 600, Number.NaN)
    const withZero = findNextStartSeconds(tracks, 600, 600, 0)

    expect(withNaN).toBe(null)
    expect(withZero).toBe(null)
  })

  it('고치는 중인 트랙 자신은 다음 트랙으로 보지 않는다', () => {
    const result = findNextStartSeconds(tracks, 300, 305, DURATION_SECONDS)

    expect(result).toBe(600)
  })

  it('같은 시각의 이웃은 다음 트랙으로 보지 않는다', () => {
    const result = findNextStartSeconds(tracks, null, 300, DURATION_SECONDS)

    expect(result).toBe(600)
  })

  it('다음 트랙을 넘어간 시각이면 그 자리의 다음 트랙을 따른다', () => {
    const result = findNextStartSeconds(tracks, 300, 700, DURATION_SECONDS)

    expect(result).toBe(1800)
  })

  it('영상 길이를 넘은 시각이어도 영상 길이를 돌려준다', () => {
    const result = findNextStartSeconds(tracks, 300, 2000, DURATION_SECONDS)

    expect(result).toBe(1800)
  })

  it('트랙 순서가 뒤섞여 있어도 시각 기준으로 찾는다', () => {
    const shuffled = [tracks[2], tracks[0], tracks[1]]

    const result = findNextStartSeconds(shuffled, 300, 300, DURATION_SECONDS)

    expect(result).toBe(600)
  })

  it('트랙이 하나도 없으면 영상 길이를 돌려준다', () => {
    const result = findNextStartSeconds([], null, 120, DURATION_SECONDS)

    expect(result).toBe(1800)
  })
})
