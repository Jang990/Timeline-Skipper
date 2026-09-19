import { describe, it, expect } from 'vitest'

import { findTakenTimestamp } from '../../../src/core/tracks/findTakenTimestamp.js'

const tracks = [
  { startSeconds: 0, endSeconds: 90, title: '첫 곡' },
  { startSeconds: 90, endSeconds: 200, title: '둘째 곡' }
]

describe('findTakenTimestamp', () => {
  it('목록에 이미 있는 시각이면 그 시각을 돌려준다', () => {
    const result = findTakenTimestamp([{ timestampSeconds: 90, title: '새 곡' }], tracks)

    expect(result).toBe(90)
  })

  it('입력한 줄끼리 같은 시각이 겹치면 그 시각을 돌려준다', () => {
    const entries = [
      { timestampSeconds: 120, title: 'a' },
      { timestampSeconds: 120, title: 'b' }
    ]

    const result = findTakenTimestamp(entries, tracks)

    expect(result).toBe(120)
  })

  it('겹치는 시각이 여럿이면 먼저 적힌 줄의 시각을 돌려준다', () => {
    const entries = [
      { timestampSeconds: 150, title: 'a' },
      { timestampSeconds: 90, title: 'b' },
      { timestampSeconds: 0, title: 'c' }
    ]

    const result = findTakenTimestamp(entries, tracks)

    expect(result).toBe(90)
  })

  it('겹치는 시각이 없으면 null을 돌려준다', () => {
    const entries = [
      { timestampSeconds: 120, title: 'a' },
      { timestampSeconds: 150, title: 'b' }
    ]

    const result = findTakenTimestamp(entries, tracks)

    expect(result).toBe(null)
  })

  it('입력이 비어 있으면 null을 돌려준다', () => {
    const result = findTakenTimestamp([], tracks)

    expect(result).toBe(null)
  })
})
