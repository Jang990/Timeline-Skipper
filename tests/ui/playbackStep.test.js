// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { startWithFakes } from '../fixtures/fakes/startWithFakes.js'
import { clickButton, fillInput, find, loadTimeline, openEditRow, readText } from '../fixtures/fakes/panelHelpers.js'

// 둘째 곡(05:00)을 고친다. 픽스처 영상은 1800초라 끝 쪽 제한에는 닿지 않는다.
const TIMELINE_COMMENT = ['00:00 첫 곡', '05:00 둘째 곡', '10:00 셋째 곡'].join('\n')

const PLAYBACK_ROW = '.timeline-skip-playback-row'
const POSITION = '.timeline-skip-playback-position'
const START_INPUT = '.timeline-skip-time-input'
const END_INPUT = '.timeline-skip-end-input'
const TITLE_INPUT = '.timeline-skip-title-input'

describe('재생 위치 이동 버튼', () => {
  it('편집 행을 열면 재생 위치를 옮기는 버튼 네 개와 재생 위치가 한 줄에 보인다', async () => {
    const extension = await startWithTimeline()
    extension.player.playTo(400)

    openEditRow(extension, '둘째 곡')

    const row = find(extension, PLAYBACK_ROW)
    for (const stepLabel of ['10초 되감기', '1초 되감기', '1초 빨리 감기', '10초 빨리 감기']) {
      expect(row.querySelector(`button[aria-label="${stepLabel}"]`)).not.toBeNull()
    }
    expect(row.querySelector(POSITION).textContent).toBe('06:40')
  })

  it('+10s를 누르면 재생 위치가 10초 늦어진다', async () => {
    const extension = await startEditingAt(400)

    clickButton(extension, '10초 빨리 감기')

    expect(extension.player.getCurrentTimeSeconds()).toBe(410)
  })

  it('−1s를 누르면 재생 위치가 1초 당겨진다', async () => {
    const extension = await startEditingAt(400)

    clickButton(extension, '1초 되감기')

    expect(extension.player.getCurrentTimeSeconds()).toBe(399)
  })

  it('±를 눌러도 시작 칸과 끝 칸의 값은 그대로다', async () => {
    const extension = await startEditingAt(400)

    clickButton(extension, '10초 빨리 감기')

    expect(extension.player.getCurrentTimeSeconds()).toBe(410)
    expect(find(extension, START_INPUT).value).toBe('05:00')
    expect(find(extension, END_INPUT).value).toBe('')
  })

  // 진짜 영상은 옮기고 나서 timeupdate를 낸다. 그 뒤에 그려지는 것까지 봐야 입력이 지워지지 않는지 알 수 있다.
  it('±를 눌러도 편집 칸에 입력하던 글자는 그대로다', async () => {
    const extension = await startEditingAt(400)
    fillInput(extension, TITLE_INPUT, '고치던 제목')

    clickButton(extension, '10초 빨리 감기')
    extension.player.playTo(extension.player.getCurrentTimeSeconds())

    expect(readText(extension, POSITION)).toBe('06:50')
    expect(find(extension, TITLE_INPUT).value).toBe('고치던 제목')
  })

  it('가운데 재생 위치는 영상을 옮기면 따라 바뀐다', async () => {
    const extension = await startEditingAt(400)

    extension.player.playTo(500)

    expect(readText(extension, POSITION)).toBe('08:20')
  })

  it('±로 옮긴 뒤 [지금으로]를 누르면 옮긴 시각이 칸에 들어간다', async () => {
    const extension = await startEditingAt(400)
    clickButton(extension, '1초 되감기')
    expect(extension.player.getCurrentTimeSeconds()).toBe(399)

    clickButton(extension, '시작을 지금 위치로')

    expect(find(extension, START_INPUT).value).toBe('06:39')
  })

  it('추가 행에서도 ±로 재생 위치를 옮길 수 있다', async () => {
    const extension = await startWithTimeline()
    extension.player.playTo(120)
    clickButton(extension, '자세히 추가')

    clickButton(extension, '10초 빨리 감기')

    expect(extension.player.getCurrentTimeSeconds()).toBe(130)
  })
})

async function startWithTimeline() {
  const extension = await startWithFakes()
  loadTimeline(extension, [TIMELINE_COMMENT])

  return extension
}

async function startEditingAt(timestampSeconds) {
  const extension = await startWithTimeline()
  extension.player.playTo(timestampSeconds)
  openEditRow(extension, '둘째 곡')

  return extension
}
