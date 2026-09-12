import { describe, expect, it } from 'vitest'

import { toBarRatio } from '../../../src/core/editing/toBarRatio.js'

const RANGE = { fromSeconds: 270, toSeconds: 630 }

describe('toBarRatio', () => {
  it('범위의 시작은 0, 범위의 끝은 1로 바꾼다', () => {
    expect(toBarRatio(270, RANGE)).toBe(0)
    expect(toBarRatio(630, RANGE)).toBe(1)
  })

  it('범위의 한가운데는 0.5가 된다', () => {
    expect(toBarRatio(450, RANGE)).toBe(0.5)
  })

  it('범위보다 앞선 시각은 0으로 물린다', () => {
    expect(toBarRatio(0, RANGE)).toBe(0)
  })

  it('범위보다 늦은 시각은 1로 물린다', () => {
    expect(toBarRatio(1800, RANGE)).toBe(1)
  })

  it('시각을 읽을 수 없으면 null을 돌려준다', () => {
    expect(toBarRatio(Number.NaN, RANGE)).toBeNull()
    expect(toBarRatio(null, RANGE)).toBeNull()
  })

  it('범위의 길이가 0이면 0을 돌려준다', () => {
    expect(toBarRatio(300, { fromSeconds: 300, toSeconds: 300 })).toBe(0)
  })
})
