// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { readCommentSnapshot } from '../fixtures/snapshots/commentSnapshot.js'
import { startWithFakes } from '../fixtures/fakes/startWithFakes.js'
import { find, findAll, findRow, loadTimeline, readText } from '../fixtures/fakes/panelHelpers.js'

// 트랙 시작은 1, 269, 556, 810, 1026, 1253, 1508, 1795초다.
// 1100초는 다섯 번째, 1300초는 여섯 번째 트랙 안이고, 0.5초는 첫 트랙 앞이다.
const { commentTexts } = readCommentSnapshot('3yG8GXdnEFQ')

const CARD = '.timeline-skip-now-playing'
const CARD_LABEL = `${CARD} .timeline-skip-now-playing-label`
const CARD_TITLE = `${CARD} .timeline-skip-now-playing-title`
const CONTROL_NAMES = ['이전 트랙', '다음 트랙']
const FLOATING = '#timeline-skip-floating'

describe('지금 재생 중 카드', () => {
  it('재생 중인 트랙의 제목과 순번이 카드에 보인다', async () => {
    const extension = await startWithTimeline()

    extension.player.playTo(1100)

    expect(readText(extension, CARD_LABEL)).toContain('5번째 트랙')
    expect(readText(extension, CARD_TITLE)).toBe(readRowTitle(extension, 4))
  })

  it('재생 위치가 다른 트랙으로 넘어가면 카드의 제목과 순번도 바뀐다', async () => {
    const extension = await startWithTimeline()
    extension.player.playTo(1100)

    extension.player.playTo(1300)

    expect(readText(extension, CARD_LABEL)).toContain('6번째 트랙')
    expect(readText(extension, CARD_TITLE)).toBe(readRowTitle(extension, 5))
  })

  it('첫 트랙 앞에서는 카드 제목이 "트랙 밖 구간"이다', async () => {
    const extension = await startWithTimeline()

    extension.player.playTo(0.5)

    expect(readText(extension, CARD_TITLE)).toBe('트랙 밖 구간')
  })

  it('트랙이 없으면 카드에 제목 없이 조작 버튼만 보인다', async () => {
    const extension = await startWithFakes()

    expect(find(extension, CARD)).not.toBeNull()
    expect(find(extension, CARD_TITLE)).toBeNull()
    expect(findAll(extension, `${CARD} button`)).toHaveLength(4)
  })

  it('조작 버튼은 글자 없이 아이콘을 그리고 이름은 그대로 읽힌다', async () => {
    const extension = await startWithTimeline()

    const buttons = findAll(extension, `${CARD} button`)

    expect(buttons).toHaveLength(4)
    for (const button of buttons) {
      expectIconOnly(button)
    }
    for (const name of [...CONTROL_NAMES, '반복 켜기']) {
      expect(findAll(extension, `${CARD} button[aria-label="${name}"]`)).toHaveLength(1)
    }
  })

  // 영상이 스스로 재생되거나 멈춘 것을 흉내 낸다. 버튼을 누르지 않아도 아이콘이 따라가야 한다.
  it('재생 중에는 가운데 버튼이 일시정지 아이콘이고 멈추면 재생 아이콘으로 바뀐다', async () => {
    const extension = await startWithTimeline()

    extension.player.togglePlay()
    expect(findAll(extension, `${CARD} button[aria-label="일시정지"] svg[data-icon="pause"]`)).toHaveLength(1)

    extension.player.togglePlay()
    expect(findAll(extension, `${CARD} button[aria-label="재생"] svg[data-icon="play"]`)).toHaveLength(1)
  })

  it('떠 있는 위젯의 조작 버튼도 아이콘으로 그려진다', async () => {
    const extension = await startWithTimeline()

    document.querySelector(`${FLOATING} .timeline-skip-floating-icon`).click()

    for (const name of CONTROL_NAMES) {
      expectIconOnly(document.querySelector(`${FLOATING} button[aria-label="${name}"]`))
    }
  })
})

async function startWithTimeline() {
  const extension = await startWithFakes()
  loadTimeline(extension, commentTexts)

  return extension
}

function readRowTitle(extension, trackIndex) {
  return findRow(extension, trackIndex).querySelector('.timeline-skip-title').textContent
}

function expectIconOnly(button) {
  expect(button.querySelectorAll('svg')).toHaveLength(1)
  expect(button.textContent.trim()).toBe('')
}
