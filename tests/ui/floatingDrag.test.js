// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { startWithFakes } from '../fixtures/fakes/startWithFakes.js'
import { loadTimeline } from '../fixtures/fakes/panelHelpers.js'

const TIMELINE_COMMENT = ['00:00 첫 곡', '05:00 둘째 곡', '10:00 셋째 곡'].join('\n')

const FLOATING = '#timeline-skip-floating'
const ICON = `${FLOATING} .timeline-skip-floating-icon`
const CARD = `${FLOATING} .timeline-skip-floating-card`
const HANDLE = `${FLOATING} .timeline-skip-floating-handle`
const BAR = `${FLOATING} .timeline-skip-now-playing-bar`
const CONTROL = `${FLOATING} .timeline-skip-controls button`

// 위젯은 오른쪽 아래를 기준으로 놓인다. 기본 자리는 CSS가 쥐고 있어 처음에는 인라인 값이 없다.
const CORNER_PIXELS = 24
const CARD_WIDTH_PIXELS = 340
const CARD_HEIGHT_PIXELS = 120

describe('플로팅 위젯 끌어 옮기기', () => {
  it('제목 옆 손잡이를 잡고 끌면 위젯이 그만큼 옮겨진다', async () => {
    await startExpanded()

    dragFrom(query(HANDLE), { xPixels: -100, yPixels: -50 })

    expect(readPlacement()).toEqual({ right: '124px', bottom: '74px' })
  })

  it('펼친 카드의 빈 곳을 끌어도 위젯은 움직이지 않는다', async () => {
    await startExpanded()

    dragFrom(query(CARD), { xPixels: -100, yPixels: -50 })

    expect(readPlacement()).toEqual({ right: '', bottom: '' })
  })

  it('재생 버튼 위에서 끌어도 위젯은 움직이지 않는다', async () => {
    await startExpanded()

    dragFrom(query(CONTROL), { xPixels: -100, yPixels: -50 })

    expect(readPlacement()).toEqual({ right: '', bottom: '' })
  })

  it('진행 바를 끌면 위젯 자리가 아니라 재생 위치가 바뀐다', async () => {
    const extension = await startExpanded()
    sizeElement(query(BAR), { widthPixels: 300, heightPixels: 4, leftPixels: 0, topPixels: 0 })

    dragFrom(query(BAR), { xPixels: 150, yPixels: 0 })

    expect(readPlacement()).toEqual({ right: '', bottom: '' })
    expect(extension.player.seekHistory.length).toBe(1)
  })

  it('접힌 아이콘을 끌면 옮겨지고 펼쳐지지 않는다', async () => {
    await startWithTimeline()
    sizeWidget(query(ICON), { widthPixels: 48, heightPixels: 48 })

    dragFrom(query(ICON), { xPixels: -200, yPixels: -120 }, { clicks: true })

    expect(readPlacement()).toEqual({ right: '224px', bottom: '144px' })
    expect(query(CARD)).toBeNull()
    expect(query(ICON)).not.toBeNull()
  })

  it('접힌 아이콘을 제자리에서 누르면 펼쳐진다', async () => {
    await startWithTimeline()
    sizeWidget(query(ICON), { widthPixels: 48, heightPixels: 48 })

    dragFrom(query(ICON), { xPixels: 2, yPixels: 2 }, { clicks: true })

    expect(query(CARD)).not.toBeNull()
    expect(readPlacement()).toEqual({ right: '', bottom: '' })
  })

  it('옮긴 자리는 새로고침해도 그대로다', async () => {
    const extension = await startExpanded()
    dragFrom(query(HANDLE), { xPixels: -100, yPixels: -50 })

    await extension.restart()

    expect(readPlacement()).toEqual({ right: '124px', bottom: '74px' })
  })

  it('끄는 동안 화면이 다시 그려져도 위젯이 옛 자리로 되돌아가지 않는다', async () => {
    const extension = await startExpanded()
    const handle = query(HANDLE)
    const box = handle.getBoundingClientRect()
    const fromXPixels = box.left + box.width / 2
    const fromYPixels = box.top + box.height / 2

    pointer(handle, 'pointerdown', fromXPixels, fromYPixels)
    pointer(handle, 'pointermove', fromXPixels - 100, fromYPixels - 50)
    extension.player.playTo(180)

    expect(readPlacement()).toEqual({ right: '124px', bottom: '74px' })
  })

  it('창이 좁아져 위젯이 화면 밖에 놓이면 화면 안으로 끌려 들어온다', async () => {
    const extension = await startExpanded()
    dragFrom(query(HANDLE), { xPixels: -600, yPixels: -400 })

    resizeWindow({ widthPixels: 500, heightPixels: 400 })
    extension.player.playTo(120)

    expect(readPlacement()).toEqual({ right: '160px', bottom: '280px' })
  })

  it('PiP 창 안에서는 끌어도 움직이지 않는다', async () => {
    const extension = await startExpanded()
    extension.pictureInPicture.open()

    const pictureInPictureDocument = extension.pictureInPicture.getDocument()
    const handle = pictureInPictureDocument.querySelector('.timeline-skip-floating-handle')
    dragFrom(handle, { xPixels: -100, yPixels: -50 })

    const root = pictureInPictureDocument.getElementById('timeline-skip-floating')
    expect({ right: root.style.right, bottom: root.style.bottom }).toEqual({ right: '', bottom: '' })
  })
})

async function startWithTimeline(options) {
  const extension = await startWithFakes(options)
  loadTimeline(extension, [TIMELINE_COMMENT])

  return extension
}

async function startExpanded() {
  const extension = await startWithTimeline()
  extension.player.playTo(120)
  query(ICON).click()
  sizeWidget(query(CARD), { widthPixels: CARD_WIDTH_PIXELS, heightPixels: CARD_HEIGHT_PIXELS })

  return extension
}

function query(selector) {
  return document.querySelector(selector)
}

function readPlacement() {
  const root = query(FLOATING)

  return { right: root.style.right, bottom: root.style.bottom }
}

// jsdom은 자리를 그리지 않는다. 위젯이 오른쪽 아래 모서리에 있다고 정해 둔다.
// 실제로 그 자리에 그려지는지는 floatingDrag.spec.js가 맡는다.
function sizeWidget(child, { widthPixels, heightPixels }) {
  const rightPixels = window.innerWidth - CORNER_PIXELS
  const bottomPixels = window.innerHeight - CORNER_PIXELS

  sizeElement(query(FLOATING), {
    widthPixels,
    heightPixels,
    leftPixels: rightPixels - widthPixels,
    topPixels: bottomPixels - heightPixels
  })
  sizeElement(child, { widthPixels, heightPixels, leftPixels: rightPixels - widthPixels, topPixels: bottomPixels - heightPixels })
}

function sizeElement(element, { widthPixels, heightPixels, leftPixels, topPixels }) {
  element.getBoundingClientRect = () => ({
    left: leftPixels,
    top: topPixels,
    right: leftPixels + widthPixels,
    bottom: topPixels + heightPixels,
    width: widthPixels,
    height: heightPixels
  })
}

function resizeWindow({ widthPixels, heightPixels }) {
  window.innerWidth = widthPixels
  window.innerHeight = heightPixels
}

// 브라우저는 놓은 뒤에 click을 한 번 더 보낸다. 아이콘처럼 누르면 반응하는 자리는 그것까지 흉내 내야
// 끌어 옮긴 것이 펼치기로 새지 않는지 확인할 수 있다.
function dragFrom(element, { xPixels, yPixels }, { clicks = false } = {}) {
  const box = element.getBoundingClientRect()
  const fromX = box.left + box.width / 2
  const fromY = box.top + box.height / 2

  pointer(element, 'pointerdown', fromX, fromY)
  pointer(element, 'pointermove', fromX + xPixels, fromY + yPixels)
  pointer(element, 'pointerup', fromX + xPixels, fromY + yPixels)

  if (clicks) {
    element.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 }))
  }
}

// jsdom에는 PointerEvent가 없다. 받는 쪽은 이벤트 이름과 좌표만 보므로 MouseEvent로 흉내 낸다.
function pointer(element, type, clientX, clientY) {
  element.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, button: 0, clientX, clientY }))
}
