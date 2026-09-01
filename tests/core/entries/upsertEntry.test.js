import { describe, it, expect } from 'vitest'

import { upsertEntry } from '../../../src/core/entries/upsertEntry.js'

describe('upsertEntry', () => {
  it('기존 시각의 항목을 새 항목으로 바꾼다', () => {
    const entries = [
      { timestampSeconds: 0, title: '첫 곡' },
      { timestampSeconds: 90, title: '둘째 곡' }
    ]

    const result = upsertEntry(entries, 90, { timestampSeconds: 90, title: '고친 제목' })

    expect(result).toEqual([
      { timestampSeconds: 0, title: '첫 곡' },
      { timestampSeconds: 90, title: '고친 제목' }
    ])
  })

  it('같은 시각의 항목이 여럿이면 모두 지우고 하나로 만든다', () => {
    const entries = [
      { timestampSeconds: 90, title: '둘째 곡' },
      { timestampSeconds: 90, title: '둘째 곡 (다른 댓글)' },
      { timestampSeconds: 200, title: '셋째 곡' }
    ]

    const result = upsertEntry(entries, 90, { timestampSeconds: 90, title: '고친 제목' })

    expect(result).toHaveLength(2)
    expect(result).toContainEqual({ timestampSeconds: 90, title: '고친 제목' })
  })

  it('시각을 바꾸면 옛 시각의 항목이 사라진다', () => {
    const entries = [
      { timestampSeconds: 0, title: '첫 곡' },
      { timestampSeconds: 90, title: '둘째 곡' }
    ]

    const result = upsertEntry(entries, 90, { timestampSeconds: 120, title: '둘째 곡' })

    expect(result).toEqual([
      { timestampSeconds: 0, title: '첫 곡' },
      { timestampSeconds: 120, title: '둘째 곡' }
    ])
  })

  it('바꾼 시각이 다른 항목과 겹치면 그 항목을 덮어쓴다', () => {
    const entries = [
      { timestampSeconds: 0, title: '첫 곡' },
      { timestampSeconds: 90, title: '둘째 곡' },
      { timestampSeconds: 200, title: '셋째 곡' }
    ]

    const result = upsertEntry(entries, 90, { timestampSeconds: 200, title: '둘째 곡' })

    expect(result).toHaveLength(2)
    expect(result).toContainEqual({ timestampSeconds: 200, title: '둘째 곡' })
    expect(result).not.toContainEqual({ timestampSeconds: 200, title: '셋째 곡' })
  })

  it('이전 시각이 null이면 새 항목으로 추가한다', () => {
    const entries = [{ timestampSeconds: 0, title: '첫 곡' }]

    const result = upsertEntry(entries, null, { timestampSeconds: 90, title: '새 곡' })

    expect(result).toEqual([
      { timestampSeconds: 0, title: '첫 곡' },
      { timestampSeconds: 90, title: '새 곡' }
    ])
  })

  it('입력 배열을 변경하지 않는다', () => {
    const entries = [{ timestampSeconds: 90, title: '둘째 곡' }]

    upsertEntry(entries, 90, { timestampSeconds: 90, title: '고친 제목' })

    expect(entries).toEqual([{ timestampSeconds: 90, title: '둘째 곡' }])
  })
})
