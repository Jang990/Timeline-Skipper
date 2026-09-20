import { describe, expect, it } from 'vitest'

import { exceedsDragThreshold } from '../../../src/core/floating/exceedsDragThreshold.js'

// 접힌 아이콘은 통째로 버튼이라 잡을 빈 곳이 없다. 누른 뒤 얼마나 움직였는지로
// 펼치기와 옮기기를 가른다. 손이 떨리는 정도로는 자리가 바뀌지 않아야 한다.
describe('exceedsDragThreshold', () => {
  it('4px 이상 움직였으면 끌기로 본다', () => {
    expect(exceedsDragThreshold({ xPixels: 4, yPixels: 0 })).toBe(true)
  })

  it('3px 움직임은 클릭으로 본다', () => {
    expect(exceedsDragThreshold({ xPixels: 3, yPixels: 0 })).toBe(false)
  })

  it('대각선으로 조금씩 움직여도 합쳐서 4px을 넘으면 끌기다', () => {
    expect(exceedsDragThreshold({ xPixels: 3, yPixels: 3 })).toBe(true)
  })

  it('왼쪽이나 위로 움직인 것도 거리로 센다', () => {
    expect(exceedsDragThreshold({ xPixels: -10, yPixels: -10 })).toBe(true)
  })

  it('전혀 움직이지 않았으면 클릭이다', () => {
    expect(exceedsDragThreshold({ xPixels: 0, yPixels: 0 })).toBe(false)
  })
})
