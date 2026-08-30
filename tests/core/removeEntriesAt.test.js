import { describe, it, expect } from 'vitest'

import { removeEntriesAt } from '../../src/core/removeEntriesAt.js'

describe('removeEntriesAt', () => {
  it('해당 시각의 항목을 제거한 새 배열을 반환한다', () => {
    const entries = [
      { timestampSeconds: 0, title: '첫 곡' },
      { timestampSeconds: 90, title: '둘째 곡' }
    ]

    const result = removeEntriesAt(entries, 90)

    expect(result).toEqual([{ timestampSeconds: 0, title: '첫 곡' }])
  })

  it('여러 댓글에서 온 같은 시각 항목을 모두 제거한다', () => {
    const entries = [
      { timestampSeconds: 90, title: '둘째 곡' },
      { timestampSeconds: 90, title: '둘째 곡 (다른 댓글)' },
      { timestampSeconds: 200, title: '셋째 곡' }
    ]

    const result = removeEntriesAt(entries, 90)

    expect(result).toEqual([{ timestampSeconds: 200, title: '셋째 곡' }])
  })

  it('목록에 없는 시각을 지우면 원본과 같은 내용을 반환한다', () => {
    const entries = [{ timestampSeconds: 0, title: '첫 곡' }]

    const result = removeEntriesAt(entries, 90)

    expect(result).toEqual([{ timestampSeconds: 0, title: '첫 곡' }])
  })

  it('빈 배열에서 지워도 빈 배열을 반환한다', () => {
    const result = removeEntriesAt([], 90)

    expect(result).toEqual([])
  })

  it('입력 배열을 변경하지 않는다', () => {
    const entries = [
      { timestampSeconds: 0, title: '첫 곡' },
      { timestampSeconds: 90, title: '둘째 곡' }
    ]

    removeEntriesAt(entries, 90)

    expect(entries).toHaveLength(2)
  })
})
