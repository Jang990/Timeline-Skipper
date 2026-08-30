import { describe, it, expect } from 'vitest'

import { parseTrackInput } from '../../src/core/parseTrackInput.js'

describe('parseTrackInput', () => {
  it('"4:29"와 제목을 초 단위 시각과 제목으로 만든다', () => {
    const result = parseTrackInput('4:29', 'Ballerino')

    expect(result).toEqual({ timestampSeconds: 269, title: 'Ballerino' })
  })

  it('"1:02:33"처럼 시간 단위가 있어도 초로 바꾼다', () => {
    const result = parseTrackInput('1:02:33', '긴 곡')

    expect(result).toEqual({ timestampSeconds: 3753, title: '긴 곡' })
  })

  it('"4:29 Ballerino"처럼 콜론 형식이면 시각과 제목을 함께 읽는다', () => {
    const result = parseTrackInput('4:29 Ballerino', '')

    expect(result).toEqual({ timestampSeconds: 269, title: 'Ballerino' })
  })

  it('"0112 안녕"처럼 콜론 없는 숫자에 제목을 붙이면 null을 반환한다', () => {
    const result = parseTrackInput('0112 안녕', '')

    expect(result).toBeNull()
  })

  it('제목 칸에 쓴 제목이 시각 칸에 딸려온 제목보다 우선한다', () => {
    const result = parseTrackInput('4:29 Ballerino', '내가 쓴 제목')

    expect(result).toEqual({ timestampSeconds: 269, title: '내가 쓴 제목' })
  })

  it('제목이 비어 있으면 "제목 없음"으로 채운다', () => {
    const result = parseTrackInput('4:29', '')

    expect(result).toEqual({ timestampSeconds: 269, title: '제목 없음' })
  })

  it('제목 앞뒤 공백을 없앤다', () => {
    const result = parseTrackInput('4:29', '  Ballerino  ')

    expect(result).toEqual({ timestampSeconds: 269, title: 'Ballerino' })
  })

  it('"1840"처럼 콜론이 없으면 뒤에서부터 끊어 18:40으로 읽는다', () => {
    const result = parseTrackInput('1840', '곡')

    expect(result).toEqual({ timestampSeconds: 1120, title: '곡' })
  })

  it('"10423"은 1:04:23으로 읽는다', () => {
    const result = parseTrackInput('10423', '곡')

    expect(result).toEqual({ timestampSeconds: 3863, title: '곡' })
  })

  it('"53"과 "0053"을 모두 53초로 읽는다', () => {
    expect(parseTrackInput('53', '곡').timestampSeconds).toBe(53)
    expect(parseTrackInput('0053', '곡').timestampSeconds).toBe(53)
  })

  it('콜론 없는 입력도 초가 60 이상이면 null을 반환한다', () => {
    const result = parseTrackInput('1860', '곡')

    expect(result).toBeNull()
  })

  it('시가 있는 콜론 없는 입력은 분이 60 이상이면 null을 반환한다', () => {
    const result = parseTrackInput('16000', '곡')

    expect(result).toBeNull()
  })

  it('숫자가 일곱 자리 이상이면 null을 반환한다', () => {
    const result = parseTrackInput('1234567', '곡')

    expect(result).toBeNull()
  })

  it('시각으로 읽을 수 없으면 null을 반환한다', () => {
    expect(parseTrackInput('', '곡')).toBeNull()
    expect(parseTrackInput('abc', '곡')).toBeNull()
    expect(parseTrackInput('4:2', '곡')).toBeNull()
  })

  it('초가 60 이상이면 null을 반환한다', () => {
    const result = parseTrackInput('4:70', '곡')

    expect(result).toBeNull()
  })
})
