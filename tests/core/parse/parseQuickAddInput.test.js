import { describe, it, expect } from 'vitest'

import { parseQuickAddInput } from '../../../src/core/parse/parseQuickAddInput.js'

describe('parseQuickAddInput', () => {
  it('"05:11 음악1" 한 줄은 적힌 시각과 제목으로 읽는다', () => {
    const result = parseQuickAddInput('05:11 음악1', 40)

    expect(result).toEqual([{ timestampSeconds: 311, title: '음악1', usesNow: false }])
  })

  it('"1:02:33 곡"처럼 시간 단위가 있는 시각도 초로 읽는다', () => {
    const result = parseQuickAddInput('1:02:33 곡', 40)

    expect(result[0].timestampSeconds).toBe(3753)
  })

  it('시각이 없는 한 줄은 지금 재생 위치를 초 단위로 내림해 쓰고 그 줄 전체를 제목으로 삼는다', () => {
    const result = parseQuickAddInput('밤양갱 (Live)', 92.7)

    expect(result).toEqual([{ timestampSeconds: 92, title: '밤양갱 (Live)', usesNow: true }])
  })

  it('재생 위치를 알 수 없으면 제목만 쓴 줄은 0초로 읽는다', () => {
    const result = parseQuickAddInput('음악1', Number.NaN)

    expect(result[0].timestampSeconds).toBe(0)
  })

  it('여러 줄이면 시각이 있는 줄만 읽고 시각 없는 줄은 버린다', () => {
    const text = ['세트리스트', '00:05 첫 곡', '잠깐 토크', '03:20 둘째 곡'].join('\n')

    const result = parseQuickAddInput(text, 40)

    expect(result.map((entry) => entry.title)).toEqual(['첫 곡', '둘째 곡'])
    expect(result.every((entry) => entry.usesNow === false)).toBe(true)
  })

  it('시각이 역순인 여러 줄도 적힌 순서 그대로 돌려준다', () => {
    const result = parseQuickAddInput('03:20 둘째 곡\n00:05 첫 곡', 40)

    expect(result.map((entry) => entry.timestampSeconds)).toEqual([200, 5])
  })

  it('영상 길이를 넘는 시각도 그대로 읽는다', () => {
    const result = parseQuickAddInput('9:59:59 끝', 40)

    expect(result[0].timestampSeconds).toBe(35999)
  })

  it('앞뒤 공백과 빈 줄은 무시한다', () => {
    const result = parseQuickAddInput('\n   음악1   \n\n', 40)

    expect(result).toEqual([{ timestampSeconds: 40, title: '음악1', usesNow: true }])
  })

  it('빈 입력이면 빈 배열을 반환한다', () => {
    const result = parseQuickAddInput('  \n ', 40)

    expect(result).toEqual([])
  })

  it('읽은 항목에는 시각과 제목만 담는다', () => {
    const result = parseQuickAddInput('00:05 첫 곡', 40)

    expect(Object.keys(result[0]).sort()).toEqual(['timestampSeconds', 'title', 'usesNow'])
  })

  it('[skip]이 붙은 한 줄은 비활성화 표시를 함께 돌려준다', () => {
    const result = parseQuickAddInput('05:11 [skip] 음악1', 40)

    expect(result).toEqual([{ timestampSeconds: 311, title: '음악1', usesNow: false, isDisabled: true }])
  })

  it('여러 줄 중 [skip]이 붙은 줄만 비활성화 표시를 돌려준다', () => {
    const text = ['00:05 첫 곡', '03:20 [skip] 둘째 곡', '05:00 셋째 곡'].join('\n')

    const result = parseQuickAddInput(text, 40)

    expect(result.map((entry) => entry.isDisabled === true)).toEqual([false, true, false])
    expect(result[1].title).toBe('둘째 곡')
  })

  it('시각 없이 "[skip] 음악1"만 쓴 한 줄은 지금 재생 위치에 비활성화 표시를 붙여 돌려준다', () => {
    const result = parseQuickAddInput('[skip] 음악1', 92.7)

    expect(result).toEqual([{ timestampSeconds: 92, title: '음악1', usesNow: true, isDisabled: true }])
  })

  it('시각 없이 [skip]만 쓴 한 줄은 제목을 "제목 없음"으로 채운다', () => {
    const result = parseQuickAddInput('[skip]', 40)

    expect(result).toEqual([{ timestampSeconds: 40, title: '제목 없음', usesNow: true, isDisabled: true }])
  })
})
