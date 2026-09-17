import { fromBarRatio } from '../../core/editing/fromBarRatio.js'
import { stepPlaybackSeconds } from '../../core/playback/stepPlaybackSeconds.js'

const DRAGGING_CLASS = 'is-dragging'
const KEY_STEP_SECONDS = { ArrowLeft: -5, ArrowRight: 5 }

// 누르기와 끌기를 한 흐름으로 다룬다. 누르는 순간부터 동그라미가 손을 따라가고, 놓을 때 한 번만 옮긴다.
// 끄는 도중에 옮기면 지나가는 트랙마다 건너뛰기가 끼어들어, 놓기 전에 엉뚱한 곳으로 튄다.
// hooks의 onPreview는 채움과 동그라미를 그 시각에 놓고, readCurrentSeconds는 지금 보이는 시각을 돌려준다.
export function bindProgressSeek(bar, range, hooks) {
  let dragSeconds = null

  bar.addEventListener('pointerdown', (event) => {
    // 가운데·오른쪽 버튼은 옮기라는 뜻이 아니다.
    if (event.button !== 0) {
      return
    }

    event.preventDefault()
    bar.setPointerCapture?.(event.pointerId)
    bar.classList.add(DRAGGING_CLASS)
    dragSeconds = follow(event, bar, range, hooks, dragSeconds)
  })

  bar.addEventListener('pointermove', (event) => {
    if (bar.classList.contains(DRAGGING_CLASS)) {
      dragSeconds = follow(event, bar, range, hooks, dragSeconds)
    }
  })

  bar.addEventListener('pointerup', (event) => {
    if (!bar.classList.contains(DRAGGING_CLASS)) {
      return
    }

    const targetSeconds = follow(event, bar, range, hooks, dragSeconds)
    endDrag(bar)

    if (targetSeconds !== null) {
      hooks.onSeek(targetSeconds)
    }
  })

  // 브라우저가 끌기를 빼앗으면(스크롤 제스처 등) 사람이 놓은 것이 아니다. 옮기지 않는다.
  bar.addEventListener('pointercancel', () => endDrag(bar))

  bar.addEventListener('keydown', (event) => stepByKey(event, range, hooks))
}

// 바의 폭이 0이면 자리를 낼 수 없다. 그때는 마지막으로 짚은 자리를 그대로 쓴다.
function follow(event, bar, range, hooks, previousSeconds) {
  const box = bar.getBoundingClientRect()
  const seconds = fromBarRatio((event.clientX - box.left) / box.width, range) ?? previousSeconds

  if (seconds !== null) {
    hooks.onPreview(seconds)
  }

  return seconds
}

function endDrag(bar) {
  bar.classList.remove(DRAGGING_CLASS)
}

// 방향키는 보이는 시각에서 출발한다. 옮긴 자리를 바로 보여 줘야 연달아 눌렀을 때 누른 만큼 옮겨진다.
function stepByKey(event, range, hooks) {
  const deltaSeconds = KEY_STEP_SECONDS[event.key]

  if (deltaSeconds === undefined) {
    return
  }

  event.preventDefault()
  const steppedSeconds = stepPlaybackSeconds(hooks.readCurrentSeconds(), deltaSeconds, range.toSeconds)

  if (steppedSeconds === null) {
    return
  }

  const targetSeconds = Math.max(steppedSeconds, range.fromSeconds)
  hooks.onPreview(targetSeconds)
  hooks.onSeek(targetSeconds)
}
