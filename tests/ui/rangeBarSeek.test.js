// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { startWithFakes } from '../fixtures/fakes/startWithFakes.js'
import { clickButton, fillInput, find, loadTimeline, openEditRow } from '../fixtures/fakes/panelHelpers.js'

// 둘째 곡(05:00)을 고친다. 픽스처 영상은 1800초라 바가 덮는 시간은 270~630초이고,
// 칠해진 구간은 300~600초다.
const TIMELINE_COMMENT = ['00:00 첫 곡', '05:00 둘째 곡', '10:00 셋째 곡'].join('\n')

const BAR = '.timeline-skip-range-bar'
const PLAYHEAD = '.timeline-skip-range-playhead'
const START_INPUT = '.timeline-skip-time-input'
const END_INPUT = '.timeline-skip-end-input'
const TITLE_INPUT = '.timeline-skip-title-input'

// jsdom은 레이아웃이 없어 바의 폭이 0이다. 폭을 정해 두고 그 위의 자리를 누른다.
// 폭이 정확하므로 누른 자리의 시각도 흔들리지 않는다. 초 단위로 내린 값을 그대로 비교한다.
const BAR_WIDTH_PIXELS = 1000

// 재생 위치 표시가 클릭을 바로 흘려보내는지는 CSS에 달려 있어 e2e에만 둔다.
describe('구간 바로 이동', () => {
  it('칠해진 구간을 누르면 누른 자리의 시각으로 영상이 옮겨진다', async () => {
    const extension = await startEditing()

    clickBarAt(extension, 0.5)

    expect(extension.player.getCurrentTimeSeconds()).toBe(450)
  })

  it('이웃 구간을 눌러도 그 시각으로 영상이 옮겨진다', async () => {
    const extension = await startEditing()

    clickBarAt(extension, 0.03)

    expect(extension.player.getCurrentTimeSeconds()).toBe(280)
  })

  it('바를 누르면 재생 위치 표시가 누른 자리로 옮겨진다', async () => {
    const extension = await startEditing()

    clickBarAt(extension, 0.5)
    extension.player.playTo(extension.player.getCurrentTimeSeconds())

    expect(Number.parseFloat(find(extension, PLAYHEAD).style.left) / 100).toBeCloseTo(0.5, 1)
  })

  it('시작 표시를 누르면 시작 시각으로 정확히 옮겨진다', async () => {
    const extension = await startEditing()

    clickButton(extension, '시작 시각으로 이동')

    expect(extension.player.getCurrentTimeSeconds()).toBe(300)
  })

  it('끝 칸이 비어 있으면 끝 표시는 다음 트랙이 시작하는 시각으로 옮긴다', async () => {
    const extension = await startEditing()

    clickButton(extension, '끝 시각으로 이동')

    expect(extension.player.getCurrentTimeSeconds()).toBe(600)
  })

  it('끝 칸에 시각이 있으면 끝 표시는 그 시각으로 정확히 옮긴다', async () => {
    const extension = await startEditing()
    fillInput(extension, END_INPUT, '09:00')

    clickButton(extension, '끝 시각으로 이동')

    expect(extension.player.getCurrentTimeSeconds()).toBe(540)
  })

  it('시작 칸을 고치면 시작 표시를 눌렀을 때 고친 시각으로 옮겨진다', async () => {
    const extension = await startEditing()
    fillInput(extension, START_INPUT, '06:00')

    clickButton(extension, '시작 시각으로 이동')

    expect(extension.player.getCurrentTimeSeconds()).toBe(360)
  })

  // 진짜 영상은 옮기고 나서 timeupdate를 낸다. 그 뒤에 그려지는 것까지 봐야 입력이 지워지지 않는지 알 수 있다.
  it('바를 눌러도 편집 칸에 입력하던 글자는 그대로다', async () => {
    const extension = await startEditing()
    fillInput(extension, TITLE_INPUT, '고치던 제목')

    clickBarAt(extension, 0.5)
    extension.player.playTo(extension.player.getCurrentTimeSeconds())

    expect(extension.player.getCurrentTimeSeconds()).toBe(450)
    expect(find(extension, TITLE_INPUT).value).toBe('고치던 제목')
  })

  it('추가 행의 바를 눌러도 영상이 옮겨진다', async () => {
    const extension = await startWithTimeline()
    extension.player.playTo(100)
    find(extension, '.timeline-skip-add').click()
    expect(find(extension, BAR)).not.toBeNull()

    // 100초에 추가하면 바는 80~320초를 덮는다.
    clickBarAt(extension, 0.5)

    expect(extension.player.getCurrentTimeSeconds()).toBe(200)
  })
})

async function startWithTimeline() {
  const extension = await startWithFakes()
  loadTimeline(extension, [TIMELINE_COMMENT])

  return extension
}

// 누르기 전 재생 위치를 바 범위 밖에 둔다. 누른 결과와 원래 자리가 우연히 겹치지 않게 한다.
async function startEditing() {
  const extension = await startWithTimeline()
  extension.player.playTo(100)
  openEditRow(extension, '둘째 곡')

  return extension
}

function clickBarAt(extension, ratio) {
  const bar = find(extension, BAR)
  bar.getBoundingClientRect = () => ({ left: 0, top: 0, width: BAR_WIDTH_PIXELS, height: 8, right: BAR_WIDTH_PIXELS, bottom: 8 })

  bar.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: BAR_WIDTH_PIXELS * ratio }))
}
