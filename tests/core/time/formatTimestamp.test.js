import { describe, it, expect } from 'vitest'

import { formatTimestamp } from '../../../src/core/time/formatTimestamp.js'

describe('formatTimestamp', () => {
  it('한 시간 미만은 "04:29"처럼 분과 초를 두 자리로 쓴다', () => {
    const result = formatTimestamp(269)

    expect(result).toBe('04:29')
  })

  it('한 시간 이상은 "1:02:33"처럼 시를 앞에 붙인다', () => {
    const result = formatTimestamp(3753)

    expect(result).toBe('1:02:33')
  })

  it('0초는 "00:00"으로 쓴다', () => {
    const result = formatTimestamp(0)

    expect(result).toBe('00:00')
  })

  it('소수점 아래 초는 버린다', () => {
    const result = formatTimestamp(92.7)

    expect(result).toBe('01:32')
  })
})
