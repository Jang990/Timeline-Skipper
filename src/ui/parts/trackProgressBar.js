import { toBarRatio } from '../../core/editing/toBarRatio.js'
import { formatTimestamp } from '../formatTimestamp.js'
import { bindProgressSeek } from './progressBarSeek.js'

const BAR_SELECTOR = '.timeline-skip-now-playing-bar'
const FILL_SELECTOR = '.timeline-skip-now-playing-fill'
const KNOB_SELECTOR = '.timeline-skip-now-playing-knob'
const DRAGGING_CLASS = 'is-dragging'

// 재생 중인 트랙 안에서의 자리를 보여 주고, 누르거나 끌어 그 트랙 안으로 옮긴다.
// 지금 재생 중 카드와 떠 있는 위젯이 함께 쓸 수 있게 view가 아니라 트랙과 옮기는 손만 받는다.
// 범위는 바에 적어 둔다. 그래야 다시 그리지 않고도 재생 위치만으로 자리를 고칠 수 있다.
export function createTrackProgressBar({ startSeconds, endSeconds }, onSeek) {
  const fill = createPart('div', 'timeline-skip-now-playing-fill')
  const knob = createPart('span', 'timeline-skip-now-playing-knob')

  const bar = createPart('div', 'timeline-skip-now-playing-bar')
  bar.dataset.fromSeconds = String(startSeconds)
  bar.dataset.toSeconds = String(endSeconds)
  bar.tabIndex = 0
  bar.setAttribute('role', 'slider')
  bar.setAttribute('aria-label', '재생 위치')
  bar.setAttribute('aria-valuemin', String(startSeconds))
  bar.setAttribute('aria-valuemax', String(endSeconds))
  bar.append(fill, knob)

  bindProgressSeek(bar, readRange(bar), {
    onSeek,
    onPreview: (seconds) => placeProgress(bar, seconds),
    // 재생 준비 전이라 자리를 못 정했으면 출발할 시각도 없다.
    readCurrentSeconds: () => (bar.hasAttribute('aria-valuenow') ? Number(bar.getAttribute('aria-valuenow')) : Number.NaN)
  })

  return bar
}

// 패널은 그릴 내용이 같으면 다시 그리지 않는다. 채움과 동그라미만은 재생 위치가 바뀔 때마다 여기서 고친다.
// 끄는 동안에는 손이 가리키는 자리를 보여 준다. 재생 위치로 되돌리면 동그라미가 손에서 튄다.
export function showTrackProgress(root, currentTimeSeconds) {
  const bar = root.querySelector(BAR_SELECTOR)

  if (bar === null || bar.classList.contains(DRAGGING_CLASS)) {
    return
  }

  placeProgress(bar, currentTimeSeconds)
}

// 읽어 주는 값은 초 단위로 내린다. 방향키로 옮길 때도 이 값에서 출발한다.
function placeProgress(bar, seconds) {
  const ratio = toBarRatio(seconds, readRange(bar))

  if (ratio === null) {
    return
  }

  const percent = `${ratio * 100}%`
  bar.querySelector(FILL_SELECTOR).style.width = percent
  bar.querySelector(KNOB_SELECTOR).style.left = percent
  bar.setAttribute('aria-valuenow', String(Math.floor(seconds)))
  bar.setAttribute('aria-valuetext', formatTimestamp(seconds))
}

function readRange(bar) {
  return { fromSeconds: Number(bar.dataset.fromSeconds), toSeconds: Number(bar.dataset.toSeconds) }
}

function createPart(tagName, className) {
  const part = document.createElement(tagName)
  part.className = className

  return part
}
