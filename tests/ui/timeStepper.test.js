// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { FIXTURE_VIDEO_SECONDS } from '../fixtures/media/fixtureVideo.js'
import { startWithFakes } from '../fixtures/fakes/startWithFakes.js'
import { clickButton, fillInput, find, loadTimeline, openEditRow, pressKey, readTexts } from '../fixtures/fakes/panelHelpers.js'

// 주로 둘째 곡(05:00)을 고친다. 앞뒤에 트랙이 있어야 이웃 경계에서 멈추는 것이 보인다.
const TIMELINE_COMMENT = ['00:00 첫 곡', '05:00 둘째 곡', '10:00 셋째 곡'].join('\n')

const ROW_TIME = '.timeline-skip-time'
const START_INPUT = '.timeline-skip-time-input'

describe('시각 조정 버튼', () => {
  it('앞 트랙 시작에서 시작의 [지금으로]를 누르면 앞 트랙 시작 1초 뒤가 들어간다', async () => {
    const extension = await startWithTimeline()
    openEditRow(extension, '둘째 곡')
    extension.player.playTo(0)

    clickButton(extension, '시작을 지금 위치로')

    expect(find(extension, START_INPUT).value).toBe('00:01')
  })

  it('시작의 [지금으로]를 누르면 지금 재생 위치가 시작 칸에 들어간다', async () => {
    const extension = await startWithTimeline()
    openEditRow(extension, '둘째 곡')
    extension.player.playTo(400)

    clickButton(extension, '시작을 지금 위치로')

    expect(find(extension, START_INPUT).value).toBe('06:40')
  })

  it('[지금으로]로 넣은 값을 저장하면 목록에 반영된다', async () => {
    const extension = await startWithTimeline()
    openEditRow(extension, '둘째 곡')
    extension.player.playTo(310)
    clickButton(extension, '시작을 지금 위치로')

    clickButton(extension, '저장')

    expect(readTexts(extension, ROW_TIME)[1]).toBe('05:10')
  })

  it('직접 추가 행에서도 [지금으로]로 시각을 넣을 수 있다', async () => {
    const extension = await startWithTimeline()
    extension.player.playTo(120)
    clickButton(extension, '자세히 추가')
    extension.player.playTo(130)

    clickButton(extension, '시작을 지금 위치로')

    expect(find(extension, START_INPUT).value).toBe('02:10')
  })

  it('시작 칸에 직접 입력하고 Enter를 누르면 저장된다', async () => {
    const extension = await startWithTimeline()
    openEditRow(extension, '둘째 곡')
    fillInput(extension, START_INPUT, '5:20')

    pressKey(extension, START_INPUT, 'Enter')

    expect(readTexts(extension, ROW_TIME)[1]).toBe('05:20')
  })

  it('[시작으로]를 누르면 시작 칸의 시각으로 영상을 옮긴다', async () => {
    const extension = await startWithTimeline()
    openEditRow(extension, '둘째 곡')

    clickButton(extension, '시작 시각으로 이동')

    expect(extension.player.getCurrentTimeSeconds()).toBe(300)
  })

  it('시작 칸을 고친 뒤 [시작으로]를 누르면 고친 시각으로 옮긴다', async () => {
    const extension = await startWithTimeline()
    openEditRow(extension, '둘째 곡')
    fillInput(extension, START_INPUT, '5:20')

    clickButton(extension, '시작 시각으로 이동')

    expect(extension.player.getCurrentTimeSeconds()).toBe(320)
  })

  it('[끝으로]를 누르면 다음 트랙 시작 2초 앞으로 영상을 옮긴다', async () => {
    const extension = await startWithTimeline()
    openEditRow(extension, '둘째 곡')

    clickButton(extension, '끝 시각으로 이동')

    expect(extension.player.getCurrentTimeSeconds()).toBe(598)
  })

  it('마지막 트랙에서 [끝으로]를 누르면 영상 끝 2초 앞으로 옮긴다', async () => {
    const extension = await startWithTimeline()
    openEditRow(extension, '셋째 곡')

    clickButton(extension, '끝 시각으로 이동')

    expect(extension.player.getCurrentTimeSeconds()).toBe(FIXTURE_VIDEO_SECONDS - 2)
  })
})

async function startWithTimeline() {
  const extension = await startWithFakes({ durationSeconds: FIXTURE_VIDEO_SECONDS })
  loadTimeline(extension, [TIMELINE_COMMENT])

  return extension
}
