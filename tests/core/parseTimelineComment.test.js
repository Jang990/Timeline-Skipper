import { describe, it, expect } from 'vitest'

import { parseTimelineComment } from '../../src/core/parseTimelineComment.js'

describe('parseTimelineComment', () => {
  it('"00:01 Ballerino" 형식의 줄을 시각과 제목으로 분리한다', () => {
    const commentText = '00:01 Ballerino'

    const result = parseTimelineComment(commentText)

    expect(result).toEqual([{ timestampSeconds: 1, title: 'Ballerino' }])
  })

  it('"1:02:33 곡명" 처럼 시간 단위가 있으면 초로 환산한다', () => {
    const commentText = '1:02:33 아무 노래'

    const result = parseTimelineComment(commentText)

    expect(result).toEqual([{ timestampSeconds: 3753, title: '아무 노래' }])
  })

  it('여러 줄이 있으면 등장 순서대로 모두 반환한다', () => {
    const commentText = ['00:10 첫 곡', '03:20 둘째 곡', '1:00:00 셋째 곡'].join('\n')

    const result = parseTimelineComment(commentText)

    expect(result).toEqual([
      { timestampSeconds: 10, title: '첫 곡' },
      { timestampSeconds: 200, title: '둘째 곡' },
      { timestampSeconds: 3600, title: '셋째 곡' }
    ])
  })

  it('"00:01 - 곡명" 처럼 구분 기호가 있어도 제목만 남긴다', () => {
    const commentText = ['00:01 - 첫 곡', '00:30 ~ 둘째 곡', '01:00 | 셋째 곡'].join('\n')

    const result = parseTimelineComment(commentText)

    expect(result).toEqual([
      { timestampSeconds: 1, title: '첫 곡' },
      { timestampSeconds: 30, title: '둘째 곡' },
      { timestampSeconds: 60, title: '셋째 곡' }
    ])
  })

  it('시각 뒤 제목의 앞뒤 공백을 제거한다', () => {
    const commentText = '00:05    공백 많은 제목   '

    const result = parseTimelineComment(commentText)

    expect(result).toEqual([{ timestampSeconds: 5, title: '공백 많은 제목' }])
  })

  it('시각만 있는 줄은 제목을 "제목 없음"으로 채운다', () => {
    const commentText = '02:30'

    const result = parseTimelineComment(commentText)

    expect(result).toEqual([{ timestampSeconds: 150, title: '제목 없음' }])
  })

  it('"(00:00)Virtual Insanity" 처럼 괄호로 감싼 시각도 읽는다', () => {
    const commentText = ['(00:00)Virtual Insanity', '(05:41)Cosmic Girl'].join('\n')

    const result = parseTimelineComment(commentText)

    expect(result).toEqual([
      { timestampSeconds: 0, title: 'Virtual Insanity' },
      { timestampSeconds: 341, title: 'Cosmic Girl' }
    ])
  })

  it('"▶ 00:01 곡명" 처럼 시각 앞에 기호가 붙어도 읽는다', () => {
    const commentText = '▶ 00:01 첫 곡'

    const result = parseTimelineComment(commentText)

    expect(result).toEqual([{ timestampSeconds: 1, title: '첫 곡' }])
  })

  it('"Maroon 5 - Sugar 3:12" 처럼 시각이 줄 끝에 있어도 읽는다', () => {
    const commentText = 'Maroon 5 - Sugar 3:12'

    const result = parseTimelineComment(commentText)

    expect(result).toEqual([{ timestampSeconds: 192, title: 'Maroon 5 - Sugar' }])
  })

  it('줄 끝 시각도 시간 단위를 읽는다', () => {
    const commentText = '아주 긴 곡 1:02:33'

    const result = parseTimelineComment(commentText)

    expect(result).toEqual([{ timestampSeconds: 3753, title: '아주 긴 곡' }])
  })

  it('타임라인 형식이 아닌 줄은 결과에서 제외한다', () => {
    const commentText = ['영상 잘 봤습니다', '00:01 첫 곡', '구독하고 갑니다'].join('\n')

    const result = parseTimelineComment(commentText)

    expect(result).toEqual([{ timestampSeconds: 1, title: '첫 곡' }])
  })

  it('시각이 문장 중간에 있으면 타임라인으로 보지 않는다', () => {
    const commentText = '노래 3:45 부분이 제일 좋아요'

    const result = parseTimelineComment(commentText)

    expect(result).toEqual([])
  })

  it('주소가 적힌 줄은 타임라인으로 보지 않는다', () => {
    const commentText = 'https://soundok.koivis.com/mycozypop/2682'

    const result = parseTimelineComment(commentText)

    expect(result).toEqual([])
  })

  it('초가 60 이상이면 시각으로 보지 않고 제외한다', () => {
    const commentText = '99:99 잘못된 시각'

    const result = parseTimelineComment(commentText)

    expect(result).toEqual([])
  })

  it('시간 단위 없이 분이 60을 넘으면 그대로 초로 환산한다', () => {
    const commentText = '75:30 긴 방송의 트랙'

    const result = parseTimelineComment(commentText)

    expect(result).toEqual([{ timestampSeconds: 4530, title: '긴 방송의 트랙' }])
  })

  it('줄바꿈이 \\r\\n이어도 각 줄을 읽는다', () => {
    const commentText = ['(00:00)Virtual Insanity', '(05:41)Cosmic Girl'].join('\r\n')

    const result = parseTimelineComment(commentText)

    expect(result).toEqual([
      { timestampSeconds: 0, title: 'Virtual Insanity' },
      { timestampSeconds: 341, title: 'Cosmic Girl' }
    ])
  })

  it('빈 문자열이면 빈 배열을 반환한다', () => {
    const commentText = ''

    const result = parseTimelineComment(commentText)

    expect(result).toEqual([])
  })
})
