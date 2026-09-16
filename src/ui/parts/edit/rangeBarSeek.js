import { fromBarRatio } from '../../../core/editing/fromBarRatio.js'
import { createButton } from '../../elements.js'

// 바를 누르면 그 자리의 시각으로, 칠해진 구간 양 끝의 표시를 누르면 시작·끝 칸의 시각으로 정확히 옮긴다.
// 픽셀로 짚으면 초가 흔들린다. 경계를 들어 보려는 사람에게는 흔들리지 않는 표시가 따로 필요하다.
// 표시는 칠 안에 붙인다. 칸을 고쳐 칠이 움직이면 표시도 따로 계산하지 않고 따라간다.
export function bindBarSeek(parts, range, view, readSeconds) {
  parts.fill.append(
    createMarker('start', '시작 시각으로 이동', () => readSeconds().startSeconds, view),
    createMarker('end', '끝 시각으로 이동', () => readSeconds().endSeconds, view)
  )

  parts.bar.addEventListener('click', (event) => seekToClickedPlace(event, parts.bar, range, view))
}

function seekToClickedPlace(event, bar, range, view) {
  const box = bar.getBoundingClientRect()
  const targetSeconds = fromBarRatio((event.clientX - box.left) / box.width, range)

  if (targetSeconds !== null) {
    view.onSeek(targetSeconds)
  }
}

function createMarker(side, label, readTargetSeconds, view) {
  return createButton({
    label: '',
    className: `timeline-skip-range-marker is-${side}`,
    title: label,
    ariaLabel: label,
    onClick: (event) => {
      // 표시는 바 안에 있다. 바까지 올라가면 누른 픽셀 자리로 한 번 더 옮겨져 정확한 시각이 흐트러진다.
      event.stopPropagation()

      const targetSeconds = readTargetSeconds()

      if (Number.isFinite(targetSeconds)) {
        view.onSeek(targetSeconds)
      }
    }
  })
}
