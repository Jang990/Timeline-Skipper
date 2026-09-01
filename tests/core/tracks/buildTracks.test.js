import { describe, it, expect } from 'vitest'

import { buildTracks } from '../../../src/core/tracks/buildTracks.js'

describe('buildTracks', () => {
  it('시각이 뒤섞여 있어도 시작 시각 오름차순으로 정렬한다', () => {
    const entries = [
      { timestampSeconds: 200, title: '둘째 곡' },
      { timestampSeconds: 10, title: '첫 곡' }
    ]

    const result = buildTracks(entries, 300)

    expect(result.map((track) => track.title)).toEqual(['첫 곡', '둘째 곡'])
  })

  it('각 트랙의 끝 시각을 다음 트랙의 시작 시각으로 채운다', () => {
    const entries = [
      { timestampSeconds: 0, title: '첫 곡' },
      { timestampSeconds: 90, title: '둘째 곡' },
      { timestampSeconds: 200, title: '셋째 곡' }
    ]

    const result = buildTracks(entries, 300)

    expect(result.map((track) => track.endSeconds)).toEqual([90, 200, 300])
  })

  it('마지막 트랙의 끝 시각은 영상 길이가 된다', () => {
    const entries = [
      { timestampSeconds: 10, title: '첫 곡' },
      { timestampSeconds: 90, title: '마지막 곡' }
    ]

    const result = buildTracks(entries, 421)

    expect(result.at(-1)).toEqual({ startSeconds: 90, endSeconds: 421, title: '마지막 곡' })
  })

  it('트랙이 하나뿐이면 영상 끝까지가 그 트랙의 구간이다', () => {
    const entries = [{ timestampSeconds: 60, title: '유일한 곡' }]

    const result = buildTracks(entries, 300)

    expect(result).toEqual([{ startSeconds: 60, endSeconds: 300, title: '유일한 곡' }])
  })

  it('시작 시각이 같은 트랙이 여러 개면 먼저 나온 것만 남긴다', () => {
    const entries = [
      { timestampSeconds: 10, title: '먼저 적힌 곡' },
      { timestampSeconds: 10, title: '나중에 적힌 곡' },
      { timestampSeconds: 20, title: '다음 곡' }
    ]

    const result = buildTracks(entries, 100)

    expect(result).toEqual([
      { startSeconds: 10, endSeconds: 20, title: '먼저 적힌 곡' },
      { startSeconds: 20, endSeconds: 100, title: '다음 곡' }
    ])
  })

  it('영상 길이를 넘는 시각은 트랙에서 제외한다', () => {
    const entries = [
      { timestampSeconds: 10, title: '정상 곡' },
      { timestampSeconds: 150, title: '영상 밖 시각' }
    ]

    const result = buildTracks(entries, 100)

    expect(result).toEqual([{ startSeconds: 10, endSeconds: 100, title: '정상 곡' }])
  })

  it('영상 길이와 정확히 같은 시각도 제외한다', () => {
    const entries = [
      { timestampSeconds: 10, title: '정상 곡' },
      { timestampSeconds: 100, title: '영상 끝 시각' }
    ]

    const result = buildTracks(entries, 100)

    expect(result).toEqual([{ startSeconds: 10, endSeconds: 100, title: '정상 곡' }])
  })

  it('영상 길이를 알 수 없으면 마지막 트랙의 끝 시각을 null로 둔다', () => {
    const entries = [
      { timestampSeconds: 10, title: '첫 곡' },
      { timestampSeconds: 20, title: '마지막 곡' }
    ]

    const result = buildTracks(entries, undefined)

    expect(result).toEqual([
      { startSeconds: 10, endSeconds: 20, title: '첫 곡' },
      { startSeconds: 20, endSeconds: null, title: '마지막 곡' }
    ])
  })

  it('영상 길이를 알 수 없으면 시각 범위로 걸러내지 않는다', () => {
    const entries = [
      { timestampSeconds: 10, title: '첫 곡' },
      { timestampSeconds: 99999, title: '아주 뒤의 곡' }
    ]

    const result = buildTracks(entries, Number.NaN)

    expect(result.map((track) => track.startSeconds)).toEqual([10, 99999])
  })

  it('빈 배열을 넣으면 빈 배열을 반환한다', () => {
    const result = buildTracks([], 300)

    expect(result).toEqual([])
  })

  it('입력 배열을 변경하지 않는다', () => {
    const entries = [
      { timestampSeconds: 200, title: '둘째 곡' },
      { timestampSeconds: 10, title: '첫 곡' }
    ]

    buildTracks(entries, 300)

    expect(entries.map((entry) => entry.title)).toEqual(['둘째 곡', '첫 곡'])
  })
})
