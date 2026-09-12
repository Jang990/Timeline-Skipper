import { findBarRange } from '../../../core/editing/findBarRange.js'
import { findNeighborSegments } from '../../../core/editing/findNeighborSegments.js'
import { toBarRatio } from '../../../core/editing/toBarRatio.js'
import { formatTimestamp } from '../../formatTimestamp.js'

// 편집 중인 트랙이 이웃 사이 어디를 차지하는지 보여준다. 칸의 숫자만으로는
// 앞뒤 트랙과의 거리가 보이지 않는다.
//
// 범위는 편집을 열 때 한 번 정하고 닫을 때까지 바꾸지 않는다. 칸을 고칠 때마다 눈금이
// 함께 움직이면 칠해진 구간이 제자리에 있는 것처럼 보여, 무엇이 얼마나 옮겨졌는지 알 수 없다.
export function createRangeBar(draft, view, inputs, readSeconds) {
  const range = findBarRange(view.tracks, draft.previousStartSeconds, draft.startSeconds, view.getDurationSeconds())

  // 영상 길이를 모르면 범위가 없다. 바 없이 지금까지처럼 편집한다.
  if (range === null) {
    return null
  }

  const parts = createParts()
  const element = createPart('timeline-skip-range')
  element.append(createLabel('from', range.fromSeconds), parts.bar, createLabel('to', range.toSeconds))

  const show = () => showBar(parts, { range, draft, view }, readSeconds())

  for (const input of inputs) {
    input.addEventListener('input', show)
  }

  show()

  return element
}

function createParts() {
  const neighbors = createPart('timeline-skip-range-neighbors')
  const fill = createPart('timeline-skip-range-fill')
  const bar = createPart('timeline-skip-range-bar')

  // 이웃을 먼저 깔고 이 트랙을 그 위에 얹는다. 겹치는 자리에서는 고치는 중인 쪽이 보여야 한다.
  bar.append(neighbors, fill)

  return { bar, neighbors, fill }
}

function showBar(parts, context, { startSeconds, endSeconds }) {
  const { range, draft, view } = context
  const leftRatio = toBarRatio(startSeconds, range)
  const rightRatio = toBarRatio(endSeconds, range)

  // 고치는 도중에는 읽을 수 없는 값이 잠깐씩 들어온다. 칠이 사라졌다 나타나느니 그대로 둔다.
  if (leftRatio === null || rightRatio === null) {
    return
  }

  placePart(parts.fill, leftRatio, rightRatio)

  // 물려서 가장자리에 붙은 것과 실제로 거기가 끝인 것은 화면에서 같아 보인다. 잘렸다고 알린다.
  parts.bar.classList.toggle('is-overflow-start', startSeconds < range.fromSeconds)
  parts.bar.classList.toggle('is-overflow-end', endSeconds > range.toSeconds)

  showNeighbors(parts.neighbors, range, findNeighborSegments(view.tracks, draft.previousStartSeconds, startSeconds))
}

// 끝을 정해 두지 않은 앞 트랙은 이 트랙의 시작을 따라 늘고 준다. 매번 다시 그려야 그것이 보인다.
function showNeighbors(container, range, segments) {
  const parts = segments.map((segment) => toNeighborPart(range, segment)).filter((part) => part !== null)

  container.replaceChildren(...parts)
}

// 바 밖으로 온전히 벗어난 이웃은 그리지 않는다. 폭이 0인 자국만 남는다.
function toNeighborPart(range, { fromSeconds, toSeconds }) {
  const leftRatio = toBarRatio(fromSeconds, range)
  const rightRatio = toBarRatio(toSeconds, range)

  if (rightRatio <= leftRatio) {
    return null
  }

  return placePart(createPart('timeline-skip-range-neighbor'), leftRatio, rightRatio)
}

function placePart(part, leftRatio, rightRatio) {
  part.style.left = toPercent(leftRatio)
  part.style.width = toPercent(Math.max(rightRatio - leftRatio, 0))

  return part
}

function toPercent(ratio) {
  return `${ratio * 100}%`
}

function createPart(className) {
  const part = document.createElement('div')
  part.className = className

  return part
}

function createLabel(side, seconds) {
  const label = createPart(`timeline-skip-range-${side}`)
  label.textContent = formatTimestamp(seconds)

  return label
}
