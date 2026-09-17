// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { FIXTURE_VIDEO_SECONDS } from '../fixtures/media/fixtureVideo.js'
import { startWithFakes } from '../fixtures/fakes/startWithFakes.js'
import { clickButton, fillInput, find, loadTimeline, openEditRow, readText } from '../fixtures/fakes/panelHelpers.js'

// 둘째 곡은 뒤에 트랙이 있고 셋째 곡은 마지막 트랙이다. 안내 글씨가 갈리는 두 경우가 한 목록에 있다.
const TIMELINE_COMMENT = ['00:00 첫 곡', '05:00 둘째 곡', '10:00 셋째 곡'].join('\n')

const END_INPUT = '.timeline-skip-end-input'

describe('끝 칸의 안내 글씨', () => {
  it('끝을 정하지 않은 트랙은 끝 칸의 안내 글씨가 다음 트랙 시작 시각이다', async () => {
    const extension = await startWithTimeline()

    openEditRow(extension, '둘째 곡')

    expect(readPlaceholder(extension)).toBe('10:00')
  })

  it('끝을 정해 둔 트랙도 안내 글씨는 다음 트랙 시작 시각이다', async () => {
    const extension = await startWithTimeline()
    openEditRow(extension, '첫 곡')
    fillInput(extension, END_INPUT, '3:00')
    clickButton(extension, '저장')
    expect(readText(extension, '.timeline-skip-time')).toBe('00:00 ~ 03:00')

    openEditRow(extension, '첫 곡')

    expect(readPlaceholder(extension)).toBe('05:00')
  })

  it('마지막 트랙은 끝 칸의 안내 글씨가 영상 끝 시각이다', async () => {
    const extension = await startWithTimeline()

    openEditRow(extension, '셋째 곡')

    expect(readPlaceholder(extension)).toBe('30:00')
  })

  it('영상 길이를 모르면 마지막 트랙의 안내 글씨는 끝까지다', async () => {
    const extension = await startWithTimeline({ durationSeconds: Number.NaN })

    openEditRow(extension, '셋째 곡')

    expect(readPlaceholder(extension)).toBe('끝까지')
  })

  it('추가 행의 끝 칸은 재생 위치 다음 트랙의 시작 시각을 안내한다', async () => {
    const extension = await startWithTimeline()
    extension.player.playTo(120)

    find(extension, '.timeline-skip-add').click()

    expect(readPlaceholder(extension)).toBe('05:00')
  })
})

async function startWithTimeline({ durationSeconds = FIXTURE_VIDEO_SECONDS } = {}) {
  const extension = await startWithFakes({ durationSeconds })
  loadTimeline(extension, [TIMELINE_COMMENT])

  return extension
}

function readPlaceholder(extension) {
  return find(extension, END_INPUT).getAttribute('placeholder')
}
