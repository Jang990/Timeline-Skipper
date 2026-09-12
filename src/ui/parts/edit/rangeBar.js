import { findBarRange } from '../../../core/editing/findBarRange.js'
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

  const fill = createPart('timeline-skip-range-fill')
  const bar = createPart('timeline-skip-range-bar')
  bar.append(fill)

  const element = createPart('timeline-skip-range')
  element.append(createLabel('from', range.fromSeconds), bar, createLabel('to', range.toSeconds))

  const show = () => showSeconds(fill, range, readSeconds())

  for (const input of inputs) {
    input.addEventListener('input', show)
  }

  show()

  return element
}

function showSeconds(fill, range, { startSeconds, endSeconds }) {
  const leftRatio = toBarRatio(startSeconds, range)
  const rightRatio = toBarRatio(endSeconds, range)

  // 고치는 도중에는 읽을 수 없는 값이 잠깐씩 들어온다. 칠이 사라졌다 나타나느니 그대로 둔다.
  if (leftRatio === null || rightRatio === null) {
    return
  }

  fill.style.left = toPercent(leftRatio)
  fill.style.width = toPercent(Math.max(rightRatio - leftRatio, 0))
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
