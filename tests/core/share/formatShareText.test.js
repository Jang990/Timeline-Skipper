import { describe, it, expect } from 'vitest'

import { formatShareText } from '../../../src/core/share/formatShareText.js'
import { parseTimelineComment } from '../../../src/core/parse/parseTimelineComment.js'

const PROMOTION = [
  '',
  '크롬 확장 Timeline Skipper로 만든 타임라인입니다. 영상에서 좋아하는 부분만 골라 즐겨보세요.',
  'https://chromewebstore.google.com/detail/timeline-skipper/hhddcgcemnlnlhbllopmpgipfhpdenik'
]

const TRACKS = [
  { startSeconds: 1, endSeconds: 120, title: '첫 곡' },
  { startSeconds: 120, endSeconds: 300, title: '둘째 곡' },
  { startSeconds: 300, endSeconds: null, title: '셋째 곡' }
]

describe('formatShareText', () => {
  it('트랙마다 "시각 제목" 한 줄로 시작 시각 순서대로 이어 붙인다', () => {
    const result = formatShareText(TRACKS, new Set())

    expect(result).toBe(['00:01 첫 곡', '02:00 둘째 곡', '05:00 셋째 곡', ...PROMOTION].join('\n'))
  })

  it('꺼 둔 트랙은 줄을 빼지 않고 시각 뒤에 [skip]을 붙인다', () => {
    const result = formatShareText(TRACKS, new Set([120]))

    expect(result).toBe(['00:01 첫 곡', '02:00 [skip] 둘째 곡', '05:00 셋째 곡', ...PROMOTION].join('\n'))
  })

  it('한 시간이 넘는 시각은 "1:02:33" 형식으로 쓴다', () => {
    const tracks = [{ startSeconds: 3753, endSeconds: null, title: '끝 곡' }]

    const result = formatShareText(tracks, new Set())

    expect(result.split('\n')[0]).toBe('1:02:33 끝 곡')
  })

  it('트랙 줄 뒤에 빈 줄을 두고 확장 소개와 웹 스토어 주소를 붙인다', () => {
    const result = formatShareText(TRACKS, new Set())

    expect(result.split('\n').slice(-3)).toEqual(PROMOTION)
  })

  it('트랙이 없으면 소개 문구도 없이 빈 문자열을 돌려준다', () => {
    const result = formatShareText([], new Set())

    expect(result).toBe('')
  })

  it('소개 문구까지 붙은 글을 다시 읽어도 시각·제목·꺼 둔 상태만 그대로 돌아온다', () => {
    const tracks = [...TRACKS, { startSeconds: 3753, endSeconds: null, title: '제목 없음' }]
    const disabledStartSeconds = new Set([1, 3753])

    const entries = parseTimelineComment(formatShareText(tracks, disabledStartSeconds))

    expect(entries).toEqual([
      { timestampSeconds: 1, title: '첫 곡', isDisabled: true },
      { timestampSeconds: 120, title: '둘째 곡' },
      { timestampSeconds: 300, title: '셋째 곡' },
      { timestampSeconds: 3753, title: '제목 없음', isDisabled: true }
    ])
  })
})
