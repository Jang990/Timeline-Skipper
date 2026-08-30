import { describe, it, expect } from 'vitest'

import { isTimestampTaken } from '../../src/core/isTimestampTaken.js'

const tracks = [
  { startSeconds: 0, endSeconds: 90, title: '첫 곡' },
  { startSeconds: 90, endSeconds: 200, title: '둘째 곡' }
]

describe('isTimestampTaken', () => {
  it('그 시각에 이미 트랙이 있으면 true를 반환한다', () => {
    const result = isTimestampTaken(tracks, 90, null)

    expect(result).toBe(true)
  })

  it('그 시각에 트랙이 없으면 false를 반환한다', () => {
    const result = isTimestampTaken(tracks, 120, null)

    expect(result).toBe(false)
  })

  it('고치는 중인 트랙 자신의 시각은 겹친 것으로 보지 않는다', () => {
    const result = isTimestampTaken(tracks, 90, 90)

    expect(result).toBe(false)
  })

  it('다른 트랙의 시각으로 옮기려 하면 true를 반환한다', () => {
    const result = isTimestampTaken(tracks, 0, 90)

    expect(result).toBe(true)
  })

  it('트랙이 하나도 없으면 false를 반환한다', () => {
    const result = isTimestampTaken([], 90, null)

    expect(result).toBe(false)
  })
})
