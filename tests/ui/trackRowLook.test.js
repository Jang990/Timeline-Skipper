// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { FIXTURE_VIDEO_SECONDS } from '../fixtures/media/fixtureVideo.js'
import { readCommentSnapshot } from '../fixtures/snapshots/commentSnapshot.js'
import { startWithFakes } from '../fixtures/fakes/startWithFakes.js'
import { ROW, find, findAll, findRow, loadTimeline, toggleTrack } from '../fixtures/fakes/panelHelpers.js'

// 트랙 시작은 1, 269, 556, 810, 1026, 1253, 1508, 1795초다. 1100초는 다섯 번째 트랙 안이다.
const { commentTexts } = readCommentSnapshot('3yG8GXdnEFQ')

const SKIPPED_BADGE = '.timeline-skip-skipped-badge'
const EQUALIZER = '.timeline-skip-equalizer'
const EDIT_BUTTON = 'button[aria-label$=" 수정"]'
const REMOVE_BUTTON = 'button[aria-label$=" 목록에서 빼기"]'
const PLAYING_SECONDS = 1100
const PLAYING_INDEX = 4

describe('트랙 목록 행의 모양', () => {
  it('체크를 해제한 행에만 "건너뜀" 표시가 보인다', async () => {
    const extension = await startWithTimeline()

    toggleTrack(extension, 2)

    expect(findRow(extension, 2).querySelector(SKIPPED_BADGE).textContent).toBe('건너뜀')
    expect(findAll(extension, `${ROW} ${SKIPPED_BADGE}`)).toHaveLength(1)
  })

  it('체크를 다시 켜면 그 행의 "건너뜀" 표시가 사라진다', async () => {
    const extension = await startWithTimeline()
    toggleTrack(extension, 2)

    toggleTrack(extension, 2)

    expect(findAll(extension, `${ROW} ${SKIPPED_BADGE}`)).toHaveLength(0)
  })

  it('재생 중인 행에만 막대 그림이 보인다', async () => {
    const extension = await startWithTimeline()

    extension.player.playTo(PLAYING_SECONDS)

    expect(findRow(extension, PLAYING_INDEX).querySelector(EQUALIZER)).not.toBeNull()
    expect(findAll(extension, `${ROW} ${EQUALIZER}`)).toHaveLength(1)
  })

  it('막대 그림은 화면 낭독기에 읽히지 않는다', async () => {
    const extension = await startWithTimeline()

    extension.player.playTo(PLAYING_SECONDS)

    expect(findRow(extension, PLAYING_INDEX).querySelector(EQUALIZER).getAttribute('aria-hidden')).toBe('true')
  })

  it('수정과 빼기 버튼은 글자 없이 아이콘을 그리고 이름은 그대로 읽힌다', async () => {
    const extension = await startWithTimeline()

    const row = findRow(extension, 0)

    for (const selector of [EDIT_BUTTON, REMOVE_BUTTON]) {
      const buttons = row.querySelectorAll(selector)
      expect(buttons).toHaveLength(1)
      expect(buttons[0].querySelectorAll('svg')).toHaveLength(1)
      expect(buttons[0].textContent.trim()).toBe('')
    }
  })

  it('목록 아래 추가 칸에 "05:11 곡명 붙여넣기, 또는 제목만" 안내가 보인다', async () => {
    const extension = await startWithTimeline()

    expect(find(extension, '.timeline-skip-quick-input').placeholder).toBe('05:11 곡명 붙여넣기, 또는 제목만')
  })
})

async function startWithTimeline() {
  const extension = await startWithFakes({ durationSeconds: FIXTURE_VIDEO_SECONDS })
  loadTimeline(extension, commentTexts)

  return extension
}
