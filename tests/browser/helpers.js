import { expect } from 'vitest'
import snapshot from '../fixtures/snapshots/3yG8GXdnEFQ.json'
import { startInBrowser } from '../fixtures/startInBrowser.js'
import { loadTimeline } from '../fixtures/fakes/panelHelpers.js'

// 트랙 시작은 1, 269, 556, 810, 1026, 1253, 1508, 1795초다.
export const SNAPSHOT_COMMENTS = snapshot.commentTexts

export async function openTimeline(commentTexts) {
  const extension = await startInBrowser()
  loadTimeline(extension, commentTexts)
  await nextFrame()

  return extension
}

export async function playTo(extension, timestampSeconds) {
  extension.player.playTo(timestampSeconds)
  await nextFrame()
}

export async function click(selector) {
  const element = document.querySelector(selector)
  expect(element, selector).not.toBeNull()
  element.click()
  await nextFrame()
}

export function readBox(selectorOrElement) {
  const element = typeof selectorOrElement === 'string' ? document.querySelector(selectorOrElement) : selectorOrElement
  const rect = element.getBoundingClientRect()

  return { x: rect.x, y: rect.y, width: rect.width, height: rect.height, top: rect.top, bottom: rect.bottom, left: rect.left, right: rect.right }
}

export function readStyle(selector, property) {
  return getComputedStyle(document.querySelector(selector))[property]
}

export function isVisible(selector) {
  const element = document.querySelector(selector)

  return element !== null && element.checkVisibility()
}

export function nextFrame() {
  return new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
}

// 조상 중 하나라도 넘친 부분을 자르면, 동그라미의 네 모서리 중 하나는 다른 요소에 덮여 보인다.
export function isFullyVisible(knob) {
  const box = knob.getBoundingClientRect()
  const inset = 1
  const points = [
    [box.left + box.width / 2, box.top + inset],
    [box.left + box.width / 2, box.bottom - inset],
    [box.left + inset, box.top + box.height / 2],
    [box.right - inset, box.top + box.height / 2]
  ]

  return points.every(([x, y]) => {
    const hit = document.elementFromPoint(x, y)

    return hit === knob || knob.contains(hit)
  })
}
