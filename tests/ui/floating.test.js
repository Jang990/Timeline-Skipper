// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { settle, startWithFakes } from '../fixtures/fakes/startWithFakes.js'
import { clickButton, findAll, loadTimeline } from '../fixtures/fakes/panelHelpers.js'

// 둘째 곡의 제목이 길어도 여기서는 흐르는지 보지 않는다. jsdom은 폭을 재지 못해 e2e가 맡는다.
const TIMELINE_COMMENT = ['00:00 첫 곡', '05:00 둘째 곡', '10:00 셋째 곡'].join('\n')

const FLOATING = '#timeline-skip-floating'
const ICON = `${FLOATING} .timeline-skip-floating-icon`
const CARD = `${FLOATING} .timeline-skip-floating-card`
const TITLE = `${FLOATING} .timeline-skip-floating-title`
const COLLAPSE = `${FLOATING} .timeline-skip-floating-collapse`

// 위젯은 패널 밖, 문서 끝에 붙는다. 패널 안이 아니라 문서 전체에서 찾는다.
describe('플로팅 위젯', () => {
  it('트랙이 없으면 위젯이 뜨지 않는다', async () => {
    const extension = await startWithFakes()

    expect(extension.findPanel()).not.toBeNull()
    expect(query(FLOATING)).toBeNull()
  })

  it('타임라인을 불러오면 접힌 아이콘이 뜬다', async () => {
    const extension = await startWithFakes()

    loadTimeline(extension, [TIMELINE_COMMENT])

    expect(query(ICON)).not.toBeNull()
    expect(query(CARD)).toBeNull()
  })

  it('전체화면에 들어가면 위젯이 사라지고, 나오면 다시 뜬다', async () => {
    const extension = await startWithTimeline()
    expect(query(FLOATING)).not.toBeNull()

    extension.fullscreen.setFullscreen(true)
    expect(query(FLOATING)).toBeNull()

    extension.fullscreen.setFullscreen(false)
    expect(query(FLOATING)).not.toBeNull()
  })

  it('아이콘을 누르면 펼쳐지고, 접기 버튼을 누르면 다시 접힌다', async () => {
    await startWithTimeline()

    query(ICON).click()
    expect(query(CARD)).not.toBeNull()
    expect(query(ICON)).toBeNull()

    query(COLLAPSE).click()
    expect(query(ICON)).not.toBeNull()
    expect(query(CARD)).toBeNull()
  })

  it('위젯에 현재 재생 중인 트랙 이름이 보인다', async () => {
    await startWithTimeline()

    query(ICON).click()

    expect(query(TITLE).textContent).toBe('첫 곡')
  })

  it('재생 위치를 옮기면 위젯의 트랙 이름이 그 트랙으로 바뀐다', async () => {
    const extension = await startWithTimeline()
    query(ICON).click()

    extension.player.playTo(700)

    expect(query(TITLE).textContent).toBe('셋째 곡')
  })

  it('다음 버튼은 다음 트랙 시작으로, 이전 버튼은 이전 트랙 시작으로 옮긴다', async () => {
    const extension = await startWithTimeline()
    query(ICON).click()

    query(`${CARD} [aria-label="다음 트랙"]`).click()
    expect(extension.player.getCurrentTimeSeconds()).toBe(300)

    query(`${CARD} [aria-label="이전 트랙"]`).click()
    expect(extension.player.getCurrentTimeSeconds()).toBe(0)
  })

  it('반복 버튼을 누르면 패널의 반복 버튼도 함께 켜진다', async () => {
    const extension = await startWithTimeline()
    query(ICON).click()

    query(`${CARD} [aria-label="반복 켜기"]`).click()

    expect(findAll(extension, '.timeline-skip-control.is-active')).toHaveLength(1)
  })

  it('패널의 숨기기 버튼을 누르면 위젯이 사라진다', async () => {
    const extension = await startWithTimeline()
    expect(query(FLOATING)).not.toBeNull()

    clickMenuItem(extension, '위젯 숨기기')

    expect(query(FLOATING)).toBeNull()
  })

  it('숨긴 뒤 보이기 버튼을 누르면 다시 나타난다', async () => {
    const extension = await startWithTimeline()
    clickMenuItem(extension, '위젯 숨기기')
    expect(query(FLOATING)).toBeNull()

    clickMenuItem(extension, '위젯 보이기')

    expect(query(ICON)).not.toBeNull()
  })

  it('펼쳐둔 위젯을 숨겼다 보이면 펼친 채로 돌아온다', async () => {
    const extension = await startWithTimeline()
    query(ICON).click()
    clickMenuItem(extension, '위젯 숨기기')
    expect(query(FLOATING)).toBeNull()

    clickMenuItem(extension, '위젯 보이기')

    expect(query(CARD)).not.toBeNull()
  })

  // 진짜 저장소를 거치는 새로고침은 floating.spec.js가 맡는다. 여기서는 저장분으로 되살리는 쪽만 본다.
  it('펼쳐둔 상태는 같은 저장소로 다시 시작한 뒤에도 유지된다', async () => {
    const extension = await startWithTimeline()
    query(ICON).click()
    await settle()

    await extension.restart()

    expect(query(CARD)).not.toBeNull()
  })

  it('숨긴 상태는 같은 저장소로 다시 시작한 뒤에도 유지된다', async () => {
    const extension = await startWithTimeline()
    clickMenuItem(extension, '위젯 숨기기')
    await settle()

    const restarted = await extension.restart()

    expect(restarted.findPanel()).not.toBeNull()
    expect(query(FLOATING)).toBeNull()
  })
})

async function startWithTimeline() {
  const extension = await startWithFakes()
  loadTimeline(extension, [TIMELINE_COMMENT])

  return extension
}

function query(selector) {
  return document.querySelector(selector)
}

// 숨기기·보이기는 패널 헤더의 더보기 메뉴 안에 있다. 메뉴를 먼저 연다.
function clickMenuItem(extension, label) {
  clickButton(extension, '더보기')
  findAll(extension, '[role="menuitem"]').find((item) => item.textContent === label).click()
}
