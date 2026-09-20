import { describe, it, expect } from 'vitest'

import { findInsertIndex } from '../../../src/core/editing/findInsertIndex.js'

const tracks = [
  { startSeconds: 0, endSeconds: 300, title: '첫 곡' },
  { startSeconds: 300, endSeconds: 600, title: '둘째 곡' },
  { startSeconds: 600, endSeconds: 1800, title: '셋째 곡' }
]

describe('findInsertIndex', () => {
  it('앞에 놓일 트랙의 수가 곧 그 자리다', () => {
    const result = findInsertIndex(tracks, 300, 700)

    expect(result).toBe(2)
  })

  it('맨 앞으로 옮기면 0을 돌려준다', () => {
    const result = findInsertIndex(tracks, 300, 0)

    expect(result).toBe(0)
  })

  it('맨 뒤로 옮기면 남은 트랙의 수를 돌려준다', () => {
    const result = findInsertIndex(tracks, 300, 1700)

    expect(result).toBe(2)
  })

  it('고치는 중인 트랙 자신은 세지 않는다', () => {
    const result = findInsertIndex(tracks, 0, 700)

    expect(result).toBe(2)
  })

  it('자리를 옮기지 않으면 본래 있던 자리를 돌려준다', () => {
    const result = findInsertIndex(tracks, 300, 300)

    expect(result).toBe(1)
  })

  it('같은 시각의 트랙은 앞에 놓인 것으로 보지 않는다', () => {
    const result = findInsertIndex(tracks, null, 300)

    expect(result).toBe(1)
  })

  it('추가하는 중이면 모든 트랙을 센다', () => {
    const result = findInsertIndex(tracks, null, 700)

    expect(result).toBe(3)
  })

  it('트랙이 하나도 없으면 0을 돌려준다', () => {
    const result = findInsertIndex([], null, 700)

    expect(result).toBe(0)
  })

  it('트랙 순서가 뒤섞여 있어도 앞에 놓일 수는 같다', () => {
    const shuffled = [tracks[2], tracks[0], tracks[1]]

    const result = findInsertIndex(shuffled, 300, 700)

    expect(result).toBe(2)
  })
})
