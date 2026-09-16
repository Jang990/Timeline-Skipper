import { describe, expect, it } from 'vitest'

import { fromBarRatio } from '../../../src/core/editing/fromBarRatio.js'

const RANGE = { fromSeconds: 270, toSeconds: 630 }

describe('fromBarRatio', () => {
  it('0은 범위의 시작, 1은 범위의 끝 시각으로 바꾼다', () => {
    expect(fromBarRatio(0, RANGE)).toBe(270)
    expect(fromBarRatio(1, RANGE)).toBe(630)
  })

  it('비율만큼 떨어진 시각을 초 단위로 내려 돌려준다', () => {
    expect(fromBarRatio(0.5, RANGE)).toBe(450)
    expect(fromBarRatio(0.501, RANGE)).toBe(450)
  })

  it('0보다 작은 비율은 범위의 시작으로 물린다', () => {
    expect(fromBarRatio(-0.2, RANGE)).toBe(270)
  })

  it('1보다 큰 비율은 범위의 끝으로 물린다', () => {
    expect(fromBarRatio(1.3, RANGE)).toBe(630)
  })

  it('비율을 읽을 수 없으면 null을 돌려준다', () => {
    expect(fromBarRatio(Number.NaN, RANGE)).toBeNull()
    expect(fromBarRatio(null, RANGE)).toBeNull()
  })

  it('범위의 길이가 0이면 범위의 시작을 돌려준다', () => {
    expect(fromBarRatio(0.5, { fromSeconds: 300, toSeconds: 300 })).toBe(300)
  })
})
