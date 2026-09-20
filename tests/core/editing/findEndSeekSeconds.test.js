import { describe, it, expect } from 'vitest'

import { findEndSeekSeconds } from '../../../src/core/editing/findEndSeekSeconds.js'

describe('findEndSeekSeconds', () => {
  it('다음 트랙 시작 2초 앞으로 보낸다', () => {
    const result = findEndSeekSeconds(300, 600)

    expect(result).toBe(598)
  })

  it('마지막 트랙은 영상 끝 2초 앞으로 보낸다', () => {
    const result = findEndSeekSeconds(600, 1800)

    expect(result).toBe(1798)
  })

  it('트랙이 2초보다 짧으면 시작 시각으로 보낸다', () => {
    const result = findEndSeekSeconds(300, 301)

    expect(result).toBe(300)
  })

  it('트랙 길이가 정확히 2초여도 시작 시각으로 보낸다', () => {
    const result = findEndSeekSeconds(300, 302)

    expect(result).toBe(300)
  })

  it('보낼 곳을 모르면 아무 데도 보내지 않는다', () => {
    const result = findEndSeekSeconds(600, null)

    expect(result).toBe(null)
  })
})
