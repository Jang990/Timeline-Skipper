import { describe, it, expect, afterEach } from 'vitest'
import { openTimeline, playTo, readStyle, nextFrame, SNAPSHOT_COMMENTS } from './helpers.js'

const ROW = '#timeline-skip-panel .timeline-skip-row'
const TEXT_PRIMARY = 'rgb(1, 2, 3)'
const CALL_TO_ACTION = 'rgb(4, 5, 6)'

describe('테마 색', () => {
  afterEach(() => document.documentElement.removeAttribute('style'))

  it('페이지가 유튜브 글자색 변수를 정하면 트랙 제목이 그 색을 따른다', async () => {
    await openTimeline(SNAPSHOT_COMMENTS)

    document.documentElement.style.setProperty('--yt-sys-color-baseline--text-primary', TEXT_PRIMARY)
    await nextFrame()

    expect(readStyle(`${ROW} .timeline-skip-title`, 'color')).toBe(TEXT_PRIMARY)
  })

  it('페이지가 유튜브 강조색 변수를 정하면 재생 중인 행의 시각이 그 색을 따른다', async () => {
    const extension = await openTimeline(SNAPSHOT_COMMENTS)
    await playTo(extension, 1100)

    document.documentElement.style.setProperty('--yt-sys-color-baseline--call-to-action', CALL_TO_ACTION)
    await nextFrame()

    expect(readStyle(`${ROW}.is-playing .timeline-skip-time`, 'color')).toBe(CALL_TO_ACTION)
  })
})
