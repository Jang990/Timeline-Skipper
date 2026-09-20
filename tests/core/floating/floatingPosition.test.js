import { describe, expect, it } from 'vitest'

import { clampFloatingPosition, toDraggedPosition } from '../../../src/core/floating/floatingPosition.js'

// 위젯은 오른쪽 아래를 기준으로 자리를 잡는다. 접었다 펼쳐 크기가 바뀌어도 그 모서리가 제자리에 남는다.
// 그래서 오른쪽으로 끌수록 rightPixels는 줄어든다.
const BOUNDS = {
  widgetWidthPixels: 340,
  widgetHeightPixels: 120,
  viewportWidthPixels: 1000,
  viewportHeightPixels: 800
}

const CORNER = { rightPixels: 24, bottomPixels: 24 }

describe('toDraggedPosition', () => {
  it('끈 거리만큼 위젯이 따라 움직인다', () => {
    const moved = toDraggedPosition({ startPosition: CORNER, movement: { xPixels: -100, yPixels: -50 }, bounds: BOUNDS })

    expect(moved).toEqual({ rightPixels: 124, bottomPixels: 74 })
  })

  it('오른쪽 아래로 끌면 right와 bottom 값이 줄어든다', () => {
    const start = { rightPixels: 100, bottomPixels: 100 }

    const moved = toDraggedPosition({ startPosition: start, movement: { xPixels: 30, yPixels: 40 }, bounds: BOUNDS })

    expect(moved).toEqual({ rightPixels: 70, bottomPixels: 60 })
  })

  it('화면 왼쪽 끝을 넘어가면 끝에 멈춘다', () => {
    const moved = toDraggedPosition({ startPosition: CORNER, movement: { xPixels: -5000, yPixels: 0 }, bounds: BOUNDS })

    expect(moved.rightPixels).toBe(660)
  })

  it('화면 위쪽 끝을 넘어가면 끝에 멈춘다', () => {
    const moved = toDraggedPosition({ startPosition: CORNER, movement: { xPixels: 0, yPixels: -5000 }, bounds: BOUNDS })

    expect(moved.bottomPixels).toBe(680)
  })

  it('화면 오른쪽 아래를 넘어가면 모서리에 멈춘다', () => {
    const moved = toDraggedPosition({ startPosition: CORNER, movement: { xPixels: 5000, yPixels: 5000 }, bounds: BOUNDS })

    expect(moved).toEqual({ rightPixels: 0, bottomPixels: 0 })
  })

  it('움직이지 않았으면 있던 자리를 그대로 돌려준다', () => {
    const moved = toDraggedPosition({ startPosition: CORNER, movement: { xPixels: 0, yPixels: 0 }, bounds: BOUNDS })

    expect(moved).toEqual(CORNER)
  })
})

describe('clampFloatingPosition', () => {
  it('화면 안에 있는 위치는 그대로 둔다', () => {
    expect(clampFloatingPosition({ rightPixels: 200, bottomPixels: 300 }, BOUNDS)).toEqual({ rightPixels: 200, bottomPixels: 300 })
  })

  it('창이 좁아져 위젯이 화면 밖으로 나가면 안으로 끌어온다', () => {
    const narrow = { ...BOUNDS, viewportWidthPixels: 500, viewportHeightPixels: 400 }

    expect(clampFloatingPosition({ rightPixels: 400, bottomPixels: 350 }, narrow)).toEqual({ rightPixels: 160, bottomPixels: 280 })
  })

  it('위젯이 화면보다 크면 왼쪽 위 끝에 맞춘다', () => {
    const tiny = { ...BOUNDS, viewportWidthPixels: 300, viewportHeightPixels: 100 }

    expect(clampFloatingPosition(CORNER, tiny)).toEqual({ rightPixels: -40, bottomPixels: -20 })
  })

  it('저장된 위치가 없으면 null을 그대로 돌려준다', () => {
    expect(clampFloatingPosition(null, BOUNDS)).toBeNull()
  })
})
