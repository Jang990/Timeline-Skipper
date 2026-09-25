import { describe, it, expect } from 'vitest'
import { userEvent } from '@vitest/browser/context'
import { openTimeline, playTo, nextFrame, SNAPSHOT_COMMENTS } from './helpers.js'

const ROW = '#timeline-skip-panel .timeline-skip-row'
const CHECKBOX = 'input[type="checkbox"]'
const EQUALIZER = '.timeline-skip-equalizer'
const EDIT_BUTTON = 'button[aria-label$=" 수정"]'
const REMOVE_BUTTON = 'button[aria-label$=" 목록에서 빼기"]'
const PLAYING_SECONDS = 1100
const PLAYING_INDEX = 4

describe('트랙 목록 행의 모양', () => {
  it('재생 중인 행에만 막대 그림이 보인다', async () => {
    const extension = await openAtRest()

    await playTo(extension, PLAYING_SECONDS)

    expect(rowAt(PLAYING_INDEX).querySelector(EQUALIZER).checkVisibility()).toBe(true)
    expect(document.querySelectorAll(`${ROW} ${EQUALIZER}`)).toHaveLength(1)
  })

  it('체크한 체크박스와 해제한 체크박스는 배경색이 다르다', async () => {
    await openAtRest()

    rowAt(2).querySelector(CHECKBOX).click()
    await nextFrame()

    expect(rowAt(2).querySelector(CHECKBOX).checked).toBe(false)
    expect(backgroundOf(rowAt(1).querySelector(CHECKBOX))).not.toBe(backgroundOf(rowAt(2).querySelector(CHECKBOX)))
  })

  it('행에 마우스를 올리면 행 배경이 바뀌고 수정 버튼이 드러난다', async () => {
    const extension = await openAtRest()
    await playTo(extension, PLAYING_SECONDS)
    const restingColor = backgroundOf(rowAt(1))

    await userEvent.hover(rowAt(1))

    await expect.poll(() => backgroundOf(rowAt(1))).not.toBe(restingColor)
    await expect.poll(() => getComputedStyle(rowAt(1).querySelector(EDIT_BUTTON)).opacity).toBe('1')
  })

  it('빼기 버튼에 마우스를 올리면 그 행만 밝아지고 앞 행은 그대로다', async () => {
    await openAtRest()
    const restingColor = backgroundOf(rowAt(2))

    await userEvent.hover(rowAt(3))
    await userEvent.hover(rowAt(3).querySelector(REMOVE_BUTTON))

    await expect.poll(() => backgroundOf(rowAt(3))).not.toBe(restingColor)
    expect(backgroundOf(rowAt(2))).toBe(restingColor)
  })
})

// 마우스가 행 위에 남아 있으면 hover가 상태 표시를 덮는다. 목록 밖으로 치운다.
async function openAtRest() {
  const extension = await openTimeline(SNAPSHOT_COMMENTS)
  await userEvent.hover(document.body, { position: { x: 1, y: 1 } })

  return extension
}

function rowAt(index) {
  return document.querySelectorAll(ROW)[index]
}

function backgroundOf(element) {
  return getComputedStyle(element).backgroundColor
}
